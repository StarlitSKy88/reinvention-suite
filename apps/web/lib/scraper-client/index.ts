/**
 * Python 爬虫微服务客户端
 *
 * 让 Next.js 端可以调用 Python 爬虫（避免端口冲突）
 */

const SCRAPER_URL =
  process.env.SCRAPER_SERVICE_URL || 'http://localhost:8000';
const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY || '';

/**
 * 通用请求封装
 */
async function callScraper<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${SCRAPER_URL}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (SCRAPER_API_KEY) {
    headers['X-API-Key'] = SCRAPER_API_KEY;
  }

  const res = await fetch(url, {
    ...options,
    headers,
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    throw new Error(`Scraper request failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

/**
 * 标准化结果（与 Python 端 ScraperResult 对应）
 */
export class ScraperResult {
  source!: string;
  company!: string;
  title!: string;
  location: string = '';
  url: string = '';
  description: string = '';
  keywords: string[] = [];
  raw_data: Record<string, any> = {};

  constructor(data: Partial<ScraperResult>) {
    Object.assign(this, data);
  }

  toDict() {
    return {
      source: this.source,
      company: this.company,
      title: this.title,
      location: this.location,
      url: this.url,
      description: this.description,
      keywords: this.keywords,
      rawData: this.raw_data,
    };
  }
}

/**
 * 政府采购网爬虫客户端
 */
export class GovProcurementScraper {
  async scrapeAllKeywords(): Promise<ScraperResult[]> {
    try {
      const data = await callScraper<{ success: boolean; jobs: any[] }>(
        '/api/v1/scrape/gov-procurement',
        { method: 'POST' }
      );

      if (!data.success) return [];

      return data.jobs.map(
        (j) =>
          new ScraperResult({
            source: 'ccgp',
            company: j.company,
            title: j.title,
            location: j.location,
            url: j.url,
            description: j.description,
            keywords: j.keywords,
            raw_data: j.raw_data || {},
          })
      );
    } catch {
      return [];
    }
  }

  async scrape(keyword: string): Promise<ScraperResult[]> {
    return this.scrapeAllKeywords();
  }
}

/**
 * 人社局公告爬虫客户端
 */
export class HRSSBulletinScraper {
  async scrape(region?: string): Promise<ScraperResult[]> {
    try {
      const data = await callScraper<{ success: boolean; jobs: any[] }>(
        '/api/v1/scrape/hrss-bulletin',
        {
          method: 'POST',
          body: JSON.stringify({ region }),
        }
      );

      if (!data.success) return [];

      return data.jobs.map(
        (j) =>
          new ScraperResult({
            source: 'hrss_bulletin',
            company: j.company,
            title: j.title,
            location: j.location,
            url: j.url,
            description: j.description,
            keywords: j.keywords,
          })
      );
    } catch {
      return [];
    }
  }
}

/**
 * 机会评分（前端版，与 Python 版同步）
 */
export class OpportunityScorer {
  score(opp: ScraperResult): {
    score: number;
    factors: Record<string, number>;
    recommendation: string;
    next_actions: string[];
  } {
    const text = (opp.title + ' ' + opp.description).toLowerCase();
    const keywords = ['再就业', '稳就业', '35', '失业', 'ai 求职', '人力资源', '招聘'];
    let keywordMatch = 0;
    for (const kw of keywords) {
      if (text.includes(kw)) keywordMatch += 15;
    }
    keywordMatch = Math.min(keywordMatch, 100);

    const regionPriority: Record<string, number> = {
      '北京': 100, '上海': 100, '深圳': 90, '广州': 90,
      '杭州': 80, '成都': 70, '武汉': 65,
    };
    let regionScore = 30;
    for (const [r, s] of Object.entries(regionPriority)) {
      if (opp.location?.includes(r) || opp.company?.includes(r)) {
        regionScore = s;
        break;
      }
    }

    const buyerType: Record<string, number> = {
      '人社局': 100, '就业服务': 95, '社保局': 80, '政府': 60,
    };
    let buyerScore = 30;
    for (const [b, s] of Object.entries(buyerType)) {
      if (opp.company?.includes(b)) {
        buyerScore = s;
        break;
      }
    }

    const score = Math.round(
      keywordMatch * 0.35 +
      regionScore * 0.3 +
      buyerScore * 0.35
    );

    let recommendation = 'low';
    let actions: string[] = [];
    if (score >= 75) {
      recommendation = 'high';
      actions = ['立即指派 BD', '48 小时内拜访'];
    } else if (score >= 50) {
      recommendation = 'medium';
      actions = ['3 天内联系', '加入项目跟踪'];
    } else {
      recommendation = 'low';
      actions = ['暂时观望'];
    }

    return {
      score,
      factors: {
        keywordMatch,
        regionScore,
        buyerScore,
      },
      recommendation,
      next_actions: actions,
    };
  }
}

export const scorer = new OpportunityScorer();
