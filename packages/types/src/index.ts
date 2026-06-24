/**
 * @reinvention/types — 跨应用共享类型
 */

// ─── 用户相关 ────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email?: string;
  phone?: string;
  wechatOpenId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  targetJobs: string[];
  targetSalary: {
    min: number;
    max: number;
    currency: 'CNY' | 'USD' | 'EUR';
  };
  targetLocations: string[];
  targetIndustries: string[];
  willingToRelocate: boolean;
  remotePreferred: boolean;
  privacyLevel: 'strict' | 'normal' | 'open';
  govProgramId?: string;
}

// ─── 简历相关 ────────────────────────────────────────────────────────────────

export interface ResumeStructured {
  id?: number;
  userId: string;
  name: string;
  contact: {
    email: string;
    phone: string;
    location: string;
  };
  /** 自我总结（一句话描述）*/
  summary?: string;
  experiences: ResumeExperience[];
  education: ResumeEducation[];
  skills: string[];
  projects: ResumeProject[];
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface ResumeExperience {
  company: string;
  title: string;
  duration: string;
  description: string;
  achievements: string[];
}

export interface ResumeEducation {
  school: string;
  degree: string;
  major: string;
  duration: string;
}

export interface ResumeProject {
  name: string;
  description: string;
  technologies: string[];
  role: string;
  duration?: string;
}

export type RewriteType = 'general' | 'for_jd' | 'age_masked' | 'discrim_safe';

/**
 * 用户事实库（反幻觉核心）
 * 所有改写只能基于此库
 */
export interface FactBase {
  userId: string;
  // 项目事实
  projects: Array<{
    id: string;
    name: string;
    role: string;
    duration: string;
    achievements: string[];
    technologies: string[];
    metrics?: Record<string, string | number>;
  }>;
  // 技能事实
  skills: Array<{
    name: string;
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    yearsOfExperience: number;
    lastUsed: string;
  }>;
  // 工作经历事实
  experiences: Array<{
    id: string;
    company: string;
    title: string;
    duration: { start: string; end: string | 'present' };
    responsibilities: string[];
    achievements: string[];
    teamSize?: number;
  }>;
  // 自我描述事实
  summary: string;
  // 用户确认
  userConfirmed: boolean;
  confirmedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface ResumeVersion {
  id?: number;
  userId: string;
  resumeId: number;
  targetJobId?: string;
  targetCompany?: string;
  rewriteType: RewriteType;
  content: string;
  factSources: FactSource[];
  matchScore?: number;
  ageMaskApplied: boolean;
  discrimCheckPassed: boolean;
  userAccepted?: boolean;
  createdAt: string;
}

export interface FactSource {
  section: string;
  content: string;
  sourceFactId: string;
}

// ─── 匹配与差距分析 ──────────────────────────────────────────────────────────

export interface JobPosting {
  id: string;
  title: string;
  company: string;
  companyName?: string;
  location: string;
  salary?: {
    min: number;
    max: number;
    currency: string;
  } | string;
  description: string;
  requirements: string[];
  keywords: string[];
  source: 'company_website' | 'boss_zhipin' | 'lagou' | 'liepin' | 'linkedin' | 'exa';
  sourceUrl: string;
  postedAt: string;
  applyUrl?: string;
}

export interface MatchScore {
  jobId: string;
  userId: string;
  score: number; // 0-100
  matchedKeywords: string[];
  missingKeywords: string[];
  reasoning: string;
  computedAt: string;
}

export interface GapReport {
  userId: string;
  jobId: string;
  matchScore: number;
  missingSkills: string[];
  missingExperience: string[];
  optimizationSuggestions: Suggestion[];
  rewrittenResume: string;
  generatedAt: string;
}

export interface Suggestion {
  type: 'skill' | 'experience' | 'project' | 'narrative';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionItems: string[];
}

// ─── 项目孵化器 ──────────────────────────────────────────────────────────────

export type ProjectType =
  | 'open_source'
  | 'technical_writing'
  | 'product_mvp'
  | 'data_experiment'
  | 'personal_branding'
  | 'industry_research'
  | 'community_building'
  | 'course_creation'
  | 'tool_development'
  | 'consulting';

export interface ProjectTemplate {
  id: string;
  type: ProjectType;
  name: string;
  description: string;
  applicableGoals: string[]; // 适配的目标岗位
  durationWeeks: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  techStack: string[];
  steps: ProjectStep[];
  successCriteria: string[];
  resumeDescription: string;
}

export interface ProjectStep {
  order: number;
  title: string;
  description: string;
  estimatedHours: number;
  resources: ProjectResource[];
}

export interface ProjectResource {
  type: 'article' | 'video' | 'tool' | 'template' | 'community';
  title: string;
  url?: string;
}

export interface ProjectIncubation {
  id?: number;
  userId: string;
  templateId: string;
  status: 'planning' | 'in_progress' | 'completed' | 'abandoned';
  milestones: ProjectMilestone[];
  deliverables: ProjectDeliverable[];
  resumeDescription?: string;
  startedAt: string;
  completedAt?: string;
}

export interface ProjectMilestone {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
  completedAt?: string;
}

export interface ProjectDeliverable {
  type: 'github_repo' | 'article' | 'mvp' | 'research' | 'community';
  url?: string;
  title: string;
  description: string;
}

// ─── AI Provider 相关 ─────────────────────────────────────────────────────────

export type AIProviderName = 'minimax' | 'claude' | 'deepseek';

export interface AIRequest {
  task: AITaskType;
  input: AIInput;
  options?: AIOptions;
}

export type AITaskType =
  | 'resume_parse'
  | 'resume_rewrite'
  | 'jd_analysis'
  | 'gap_analysis'
  | 'cover_letter'
  | 'age_mask'
  | 'discrim_detect'
  | 'project_recommend'
  | 'company_match';

export interface AIInput {
  prompt: string;
  context?: Record<string, unknown>;
  systemPrompt?: string;
}

export interface AIOptions {
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  provider?: AIProviderName;
  highQuality?: boolean;
}

export interface AIResponse {
  content: string;
  provider: AIProviderName;
  model: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

// ─── 政府看板相关 ────────────────────────────────────────────────────────────

export interface GovDashboardMetrics {
  period: { start: string; end: string };
  // 核心指标
  serviceCoverage: {
    totalUsers: number;
    ageAbove35Ratio: number;
    newUsersThisMonth: number;
  };
  // 活跃度
  activity: {
    monthlyActiveUsers: number;
    retentionRate: number;
  };
  // 服务深度
  serviceDepth: {
    resumeUploads: number;
    resumeRewrites: number;
    jobMatches: number;
    projectIncubations: number;
  };
  // 成功率
  successRate: {
    totalJobSeekers: number;
    successfulReemployment: number;
    reemploymentRate: number;
    averageJobSearchDays: number;
  };
  // 用户满意度
  satisfaction: {
    npsScore: number;
    positiveRate: number;
  };
  // 用户画像
  userDemographics: {
    ageDistribution: Record<string, number>;
    industryDistribution: Record<string, number>;
    regionDistribution: Record<string, number>;
    unemploymentDurationDistribution: Record<string, number>;
  };
}

export interface GovSuccessCase {
  id: string;
  userId: string; // 脱敏
  ageRange: string;
  industry: string;
  unemploymentMonths: number;
  targetJob: string;
  originalSalary: number;
  newSalary: number;
  storyNarrative: string;
  videoUrl?: string;
  permissionGranted: boolean;
  createdAt: string;
}

// ─── API 响应格式 ────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  metadata?: {
    requestId: string;
    timestamp: string;
  };
}
