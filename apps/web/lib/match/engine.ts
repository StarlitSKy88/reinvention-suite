/**
 * 岗位匹配引擎
 *
 * 输入：用户画像 + JD 列表
 * 输出：Top N 匹配岗位（按匹配度排序）
 */

import type {
  UserProfile,
  JobPosting,
  MatchScore,
} from '@reinvention/types';
import { getAIRouter } from '@/lib/ai';
import { analyzeJD, type JDAnalysis } from './jd-analyzer';

export interface MatchInput {
  user: UserProfile;
  userSkills: string[]; // 用户技能列表
  userYearsOfExperience: number;
  userCurrentSalary?: number;
  jobs: JobPosting[];
  /** 每个 JD 最多分析多少（性能优化）*/
  maxAnalysisCount?: number;
}

export interface MatchedJob extends JobPosting {
  matchScore: MatchScore;
  jdAnalysis?: JDAnalysis;
}

export interface MatchResult {
  matchedJobs: MatchedJob[];
  totalAnalyzed: number;
  totalJobs: number;
  durationMs: number;
}

/**
 * 匹配引擎主函数
 */
export async function matchJobs(input: MatchInput): Promise<MatchResult> {
  const startTime = Date.now();

  // Step 1: 预筛选（基于用户偏好快速过滤）
  const filteredJobs = preFilterJobs(input.jobs, input.user);

  // Step 2: 限制分析数量（性能优化）
  const maxCount = input.maxAnalysisCount || 30;
  const jobsToAnalyze = filteredJobs.slice(0, maxCount);

  // Step 3: 批量分析 JD + 计算匹配度
  const matchedJobs: MatchedJob[] = [];

  for (const job of jobsToAnalyze) {
    try {
      // 分析 JD
      const jdAnalysis = await analyzeJD(job.description);

      // 计算匹配度
      const matchScore = computeMatchScoreFromAnalysis(
        jdAnalysis,
        input
      );

      matchedJobs.push({
        ...job,
        matchScore,
        jdAnalysis,
      });
    } catch (error) {
      // 单个 JD 失败不影响整体
      console.error(`JD 分析失败: ${job.title}`, error);
    }
  }

  // Step 4: 排序（按匹配度）
  matchedJobs.sort((a, b) => b.matchScore.score - a.matchScore.score);

  return {
    matchedJobs,
    totalAnalyzed: jobsToAnalyze.length,
    totalJobs: input.jobs.length,
    durationMs: Date.now() - startTime,
  };
}

// ─── 预筛选 ────────────────────────────────────────────────────────────────

function preFilterJobs(jobs: JobPosting[], user: UserProfile): JobPosting[] {
  return jobs.filter((job) => {
    // 地点过滤
    if (
      user.targetLocations.length > 0 &&
      job.location &&
      !user.targetLocations.some((loc) => job.location!.includes(loc))
    ) {
      // 用户愿意搬迁或远程偏好，跳过地点过滤
      if (!user.willingToRelocate && !user.remotePreferred) {
        return false;
      }
    }

    return true;
  });
}

// ─── 匹配度计算 ──────────────────────────────────────────────────────────────

function computeMatchScoreFromAnalysis(
  jdAnalysis: JDAnalysis,
  input: MatchInput
): MatchScore {
  const userSkillSet = new Set(input.userSkills.map((s) => s.toLowerCase()));
  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];

  let totalWeight = 0;
  let earnedWeight = 0;

  for (const kw of jdAnalysis.keywords) {
    totalWeight += kw.weight;
    const keywordLower = kw.keyword.toLowerCase();

    // 检查是否匹配（技能名包含、相似等）
    const isMatched = checkKeywordMatch(keywordLower, userSkillSet);

    if (isMatched) {
      matchedKeywords.push(kw.keyword);
      earnedWeight += kw.weight;
    } else {
      missingKeywords.push(kw.keyword);
    }
  }

  // 基础分：关键词匹配
  const keywordScore = totalWeight > 0
    ? Math.round((earnedWeight / totalWeight) * 100)
    : 0;

  // 经验分
  const experienceScore = computeExperienceScore(
    jdAnalysis,
    input.userYearsOfExperience
  );

  // 综合分（70% 关键词 + 30% 经验）
  const finalScore = Math.round(keywordScore * 0.7 + experienceScore * 0.3);

  return {
    jobId: jdAnalysis.title,
    userId: input.user.id,
    score: finalScore,
    matchedKeywords,
    missingKeywords,
    reasoning: `关键词匹配度 ${keywordScore}%，经验匹配度 ${experienceScore}%`,
    computedAt: new Date().toISOString(),
  };
}

/**
 * 检查关键词是否匹配（支持模糊匹配）
 */
function checkKeywordMatch(keyword: string, userSkills: Set<string>): boolean {
  // 直接匹配
  if (userSkills.has(keyword)) return true;

  // 子串匹配（如 "React.js" 匹配 "React"）
  for (const skill of userSkills) {
    if (skill.includes(keyword) || keyword.includes(skill)) {
      return true;
    }
  }

  return false;
}

/**
 * 计算经验匹配分
 */
function computeExperienceScore(jd: JDAnalysis, userYears: number): number {
  const requiredYears = parseYearsFromSeniority(jd.seniorityLevel);

  if (requiredYears === 0) return 100;

  const diff = userYears - requiredYears;

  if (diff >= 0) {
    // 经验充足或超资历
    return diff > 15 ? 70 : Math.min(100, 80 + diff * 2);
  } else {
    // 经验不足
    const ratio = userYears / requiredYears;
    return Math.round(ratio * 100);
  }
}

function parseYearsFromSeniority(
  level: JDAnalysis['seniorityLevel']
): number {
  const map: Record<NonNullable<JDAnalysis['seniorityLevel']>, number> = {
    entry: 1,
    mid: 3,
    senior: 6,
    manager: 8,
    director: 12,
    executive: 15,
  };
  return level ? map[level] : 0;
}
