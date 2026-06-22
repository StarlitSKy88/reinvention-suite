/**
 * 用户行为埋点 + 政府看板数据采集
 *
 * 核心目的：
 * 1. 服务于政府数据看板（Task #23）
 * 2. 用户授权 + 隐私脱敏
 * 3. 实时上报 + 批量上报两种模式
 */

export type AnalyticsEventType =
  | 'user_register' // 用户注册
  | 'user_login' // 登录
  | 'resume_upload' // 简历上传
  | 'resume_parse' // 简历解析完成
  | 'resume_rewrite' // 简历改写
  | 'age_mask_detect' // 年龄去敏
  | 'discrim_detect' // 反歧视检测
  | 'job_match' // 岗位匹配
  | 'gap_analysis' // 差距分析
  | 'project_start' // 开始项目孵化
  | 'project_complete' // 项目完成
  | 'delivery_navigate' // 投递导航
  | 'success_report' // 成功申报（用户主动）
  | 'gov_program_join' // 加入政府项目
  | 'page_view' // 页面浏览
  | 'feature_use' // 功能使用
  | 'feedback'; // 用户反馈

export interface AnalyticsEvent {
  /** 事件 ID（后端生成）*/
  id?: string;
  /** 事件类型 */
  type: AnalyticsEventType;
  /** 事件时间戳 */
  timestamp: string;
  /** 脱敏后的用户 ID（hash）*/
  anonymousUserId: string;
  /** 事件属性（已脱敏）*/
  properties: Record<string, unknown>;
  /** 用户代理（已脱敏）*/
  userAgent?: string;
  /** 来源页面 */
  source?: string;
}

export interface AnalyticsContext {
  /** 真实的 userId（客户端，不上传）*/
  realUserId: string;
  /** 政府项目 ID（可选）*/
  govProgramId?: string;
  /** 城市（用户授权位置）*/
  city?: string;
}

/**
 * 简单的 hash 函数（用于匿名化 userId）
 * 注意：这不是加密哈希，仅用于不可逆脱敏
 */
async function hashUserId(userId: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(userId + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export class AnalyticsTracker {
  private context: AnalyticsContext;
  private eventQueue: AnalyticsEvent[] = [];
  private readonly SALT = 'reinvention-v1-2026';
  private readonly FLUSH_INTERVAL_MS = 30_000; // 30s
  private flushTimer: ReturnType<typeof setInterval> | null = null;

  constructor(context: AnalyticsContext) {
    this.context = context;
    this.startAutoFlush();
  }

  /**
   * 追踪事件
   */
  async track(
    type: AnalyticsEventType,
    properties: Record<string, unknown> = {}
  ): Promise<void> {
    const anonymousUserId = await hashUserId(
      this.context.realUserId,
      this.SALT
    );

    const event: AnalyticsEvent = {
      type,
      timestamp: new Date().toISOString(),
      anonymousUserId,
      properties: this.sanitizeProperties(properties),
      source: typeof window !== 'undefined' ? window.location.pathname : undefined,
    };

    this.eventQueue.push(event);

    // 立即上报关键事件
    if (this.isCriticalEvent(type)) {
      await this.flush();
    }
  }

  /**
   * 批量上报
   */
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events,
          context: {
            govProgramId: this.context.govProgramId,
            city: this.context.city,
          },
        }),
      });
    } catch (error) {
      // 上报失败，重新入队
      this.eventQueue.unshift(...events);
      console.error('[Analytics] 上报失败', error);
    }
  }

  /**
   * 关闭追踪器
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    // 最后一次上报
    this.flush();
  }

  // ─── Private ─────────────────────────────────────────────────────────────

  private startAutoFlush(): void {
    if (typeof window === 'undefined') return;
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.FLUSH_INTERVAL_MS);
  }

  private isCriticalEvent(type: AnalyticsEventType): boolean {
    return [
      'user_register',
      'resume_upload',
      'success_report',
      'gov_program_join',
    ].includes(type);
  }

  /**
   * 脱敏事件属性
   */
  private sanitizeProperties(
    properties: Record<string, unknown>
  ): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(properties)) {
      // 不上传敏感字段
      if (this.isSensitiveKey(key)) {
        continue;
      }

      // 限制字段长度
      if (typeof value === 'string' && value.length > 500) {
        sanitized[key] = value.slice(0, 500) + '...';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private isSensitiveKey(key: string): boolean {
    const sensitive = [
      'phone',
      'email',
      'idCard',
      'bankCard',
      'password',
      'token',
      'cookie',
    ];
    return sensitive.some((s) => key.toLowerCase().includes(s));
  }
}

// 单例
let _tracker: AnalyticsTracker | null = null;

export function getTracker(): AnalyticsTracker {
  if (!_tracker) {
    _tracker = new AnalyticsTracker({
      realUserId: 'anonymous', // 会在用户登录后替换
    });
  }
  return _tracker;
}
