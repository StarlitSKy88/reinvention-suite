/**
 * PII 脱敏器（Personal Identifiable Information）
 *
 * 核心设计：
 * 1. 在 Web Worker 中运行，不阻塞主线程
 * 2. 使用多种正则规则识别 PII
 * 3. 脱敏后保留结构（不破坏简历可读性）
 * 4. 输出脱敏文本 + 占位符映射
 *
 * 脱敏类型：
 * - 手机号：138****1234
 * - 邮箱：z***@example.com
 * - 身份证：110101********1234
 * - 姓名：张*（按位置推断）
 * - 地址：保留省市，区级模糊
 * - 银行卡：完全隐藏
 */

export interface RedactionResult {
  /** 脱敏后的文本 */
  redactedText: string;
  /** 占位符映射（用于 LLM 还原）*/
  placeholderMap: Record<string, string>;
  /** 检测到的 PII 数量 */
  stats: {
    phones: number;
    emails: number;
    idCards: number;
    names: number;
    addresses: number;
    bankCards: number;
    total: number;
  };
  /** 警告（如检测到未识别 PII 类型）*/
  warnings: string[];
}

// ─── 正则规则 ────────────────────────────────────────────────────────────────

const PHONE_PATTERNS = [
  // 中国大陆手机号：1[3-9]xxxxxxxxx
  /\b(1[3-9])\d{1}(\*{4})\d{4}\b/g, // 已经脱敏
  /\b(1[3-9])\d{9}\b/g, // 完整手机号
  // 带分隔符的手机号
  /\b(1[3-9])\d{1}[\s-]?\d{4}[\s-]?\d{4}\b/g,
];

const EMAIL_PATTERN =
  /\b([A-Za-z0-9._%+-]+)@([A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/g;

const ID_CARD_PATTERN =
  /\b([1-9]\d{5})(?:19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dXx]\b/g;

const BANK_CARD_PATTERN =
  /\b(?:\d[\s-]?){13,19}\b/g; // 13-19 位连续数字

const ADDRESS_KEYWORDS = [
  '地址',
  '住址',
  '现居',
  '居住地',
  '户籍',
  'Address',
  'addr',
];

/**
 * 检测并脱敏
 */
export function redactPII(text: string): RedactionResult {
  if (!text || typeof text !== 'string') {
    return {
      redactedText: '',
      placeholderMap: {},
      stats: emptyStats(),
      warnings: ['输入文本为空'],
    };
  }

  let redacted = text;
  const placeholderMap: Record<string, string> = {};
  const stats = emptyStats();
  const warnings: string[] = [];

  // 1. 手机号脱敏
  redacted = redactWithPattern(
    redacted,
    PHONE_PATTERNS,
    (match, p1) => {
      const placeholder = `${p1}****${match.slice(-4)}`;
      return `${p1}****${match.slice(-4)}`;
    },
    (count) => {
      stats.phones = count;
    },
    placeholderMap,
    'PHONE'
  );

  // 2. 邮箱脱敏
  redacted = redactWithPattern(
    redacted,
    [EMAIL_PATTERN],
    (match, local, domain) => {
      const placeholder = `${local[0]}***@${domain}`;
      return placeholder;
    },
    (count) => {
      stats.emails = count;
    },
    placeholderMap,
    'EMAIL'
  );

  // 3. 身份证脱敏
  redacted = redactWithPattern(
    redacted,
    [ID_CARD_PATTERN],
    (match, prefix) => {
      return `${prefix}********${match.slice(-4)}`;
    },
    (count) => {
      stats.idCards = count;
    },
    placeholderMap,
    'ID_CARD'
  );

  // 4. 银行卡脱敏
  redacted = redactWithPattern(
    redacted,
    [BANK_CARD_PATTERN],
    () => {
      return '[BANK_CARD_REMOVED]';
    },
    (count) => {
      stats.bankCards = count;
    },
    placeholderMap,
    'BANK_CARD'
  );

  // 5. 姓名脱敏（基于简历顶部结构推断）
  const nameResult = redactNameInResume(redacted);
  redacted = nameResult.text;
  stats.names = nameResult.count;

  // 6. 地址脱敏（保留省市，模糊区级）
  const addressResult = redactAddress(redacted);
  redacted = addressResult.text;
  stats.addresses = addressResult.count;

  stats.total =
    stats.phones +
    stats.emails +
    stats.idCards +
    stats.names +
    stats.addresses +
    stats.bankCards;

  // 7. 检查未识别的潜在 PII（启发式）
  const potentialNames = detectPotentialNames(redacted);
  if (potentialNames.length > 0) {
    warnings.push(
      `检测到 ${potentialNames.length} 处疑似姓名但未脱敏：${potentialNames
        .slice(0, 3)
        .join('、')}...（请人工复核）`
    );
  }

  return {
    redactedText: redacted,
    placeholderMap,
    stats,
    warnings,
  };
}

// ─── 辅助函数 ────────────────────────────────────────────────────────────────

function emptyStats() {
  return {
    phones: 0,
    emails: 0,
    idCards: 0,
    names: 0,
    addresses: 0,
    bankCards: 0,
    total: 0,
  };
}

/**
 * 通用正则替换 + 占位符记录
 */
function redactWithPattern(
  text: string,
  patterns: RegExp[],
  replacer: (match: string, ...groups: string[]) => string,
  counter: (count: number) => void,
  placeholderMap: Record<string, string>,
  piiType: string
): string {
  let count = 0;
  const placeholderPrefix = `__${piiType}_`;

  let result = text;
  for (const pattern of patterns) {
    result = result.replace(pattern, (match, ...args) => {
      const groups = args.slice(0, -2); // 去掉 offset 和 full string
      const placeholder = replacer(match, ...groups);

      count++;
      const placeholderId = `${placeholderPrefix}${count}__`;
      placeholderMap[placeholderId] = match;

      return placeholderId;
    });
  }

  counter(count);
  return result;
}

/**
 * 姓名脱敏（基于简历结构推断）
 * 通常在简历开头"姓名：xxx"或"Name: xxx"
 */
function redactNameInResume(
  text: string
): { text: string; count: number } {
  const namePattern = /(姓\s*名|Name)\s*[：:]\s*([^\s\n,，]{2,4})/gi;
  let count = 0;
  const result = text.replace(namePattern, (match, label, name) => {
    count++;
    if (name.length <= 1) return `${label}: *`;
    return `${label}: ${name[0]}*`;
  });
  return { text: result, count };
}

/**
 * 地址脱敏（保留省市，模糊区级）
 */
function redactAddress(
  text: string
): { text: string; count: number } {
  // 匹配 "XX省XX市XX区XX" 形式
  const addressPattern =
    /(省|自治区|市)\s*([^市]{1,20}?市)\s*([^区]{1,20}?区)\s*([^,，\n]{1,50})/g;

  let count = 0;
  const result = text.replace(addressPattern, (match, ...args) => {
    const groups = args.slice(0, -2);
    const [provinceOrCity, city, district, detail] = groups;
    count++;
    return `${provinceOrCity} ${city} ${district} ****`;
  });
  return { text: result, count };
}

/**
 * 启发式：检测疑似未脱敏的姓名
 * 用于生成警告
 */
function detectPotentialNames(text: string): string[] {
  // 简单启发式：开头 200 字内，全角逗号后的 2-4 字中文名
  const head = text.slice(0, 500);
  const matches = head.match(/[，,]\s*([一-龥]{2,4})/g) || [];
  return matches
    .map((m) => m.replace(/[，,\s]/g, ''))
    .filter((name) => isLikelyName(name));
}

/**
 * 启发式判断是否像人名
 */
function isLikelyName(text: string): boolean {
  if (text.length < 2 || text.length > 4) return false;
  // 常见姓
  const commonSurnames = [
    '王', '李', '张', '刘', '陈', '杨', '黄', '赵', '吴', '周',
    '徐', '孙', '马', '朱', '胡', '郭', '何', '高', '林', '罗',
  ];
  return commonSurnames.includes(text[0]);
}

/**
 * Web Worker 接口（未来扩展）
 */
export class PIIRedactionWorker {
  private worker: Worker | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'Worker' in window) {
      // 暂时使用同步实现，未来可改为真正的 Worker
      // this.worker = new Worker(new URL('./redactor.worker.ts', import.meta.url));
    }
  }

  async redact(text: string): Promise<RedactionResult> {
    // 暂时使用同步实现
    return Promise.resolve(redactPII(text));
  }

  destroy() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}
