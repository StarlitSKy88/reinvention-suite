/**
 * RBAC（基于角色的访问控制）
 *
 * 角色：
 * - super_admin: 超级管理员
 * - admin: 管理员
 * - operator: 操作员（BD/运营）
 * - viewer: 查看者（政府领导）
 * - gov_officer: 政府官员（看板用户）
 * - user: 普通用户（C 端求职者）
 */

export enum Role {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  OPERATOR = 'operator',
  VIEWER = 'viewer',
  GOV_OFFICER = 'gov_officer',
  USER = 'user',
}

export enum Resource {
  USERS = 'users',
  JOBS = 'jobs',
  MATCHES = 'matches',
  RESUMES = 'resumes',
  DASHBOARD = 'dashboard',
  SETTINGS = 'settings',
  OPPORTUNITIES = 'opportunities',
  ANALYTICS = 'analytics',
  SCRAPERS = 'scrapers',
  API_KEYS = 'api_keys',
}

export enum Action {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  APPROVE = 'approve',
  ADMIN = 'admin',
}

/**
 * 空权限（用于补全 Record 类型）
 */
const NO_ACCESS: Action[] = [];

/**
 * 权限矩阵：角色 × 资源 × 操作
 */
const PERMISSION_MATRIX: Record<Role, Record<Resource, Action[]>> = {
  [Role.SUPER_ADMIN]: {
    [Resource.USERS]: [Action.READ, Action.WRITE, Action.DELETE, Action.ADMIN],
    [Resource.JOBS]: [Action.READ, Action.WRITE, Action.DELETE, Action.APPROVE],
    [Resource.MATCHES]: [Action.READ, Action.WRITE, Action.DELETE, Action.APPROVE],
    [Resource.RESUMES]: [Action.READ, Action.WRITE, Action.DELETE],
    [Resource.DASHBOARD]: [Action.READ, Action.WRITE, Action.ADMIN],
    [Resource.SETTINGS]: [Action.READ, Action.WRITE, Action.ADMIN],
    [Resource.OPPORTUNITIES]: [Action.READ, Action.WRITE, Action.DELETE, Action.APPROVE],
    [Resource.ANALYTICS]: [Action.READ, Action.WRITE, Action.ADMIN],
    [Resource.SCRAPERS]: [Action.READ, Action.WRITE, Action.DELETE, Action.ADMIN],
    [Resource.API_KEYS]: [Action.READ, Action.WRITE, Action.DELETE, Action.ADMIN],
  },
  [Role.ADMIN]: {
    [Resource.USERS]: [Action.READ, Action.WRITE],
    [Resource.JOBS]: [Action.READ, Action.WRITE, Action.APPROVE],
    [Resource.MATCHES]: [Action.READ, Action.WRITE],
    [Resource.RESUMES]: [Action.READ, Action.WRITE],
    [Resource.DASHBOARD]: [Action.READ, Action.WRITE],
    [Resource.SETTINGS]: [Action.READ, Action.WRITE],
    [Resource.OPPORTUNITIES]: [Action.READ, Action.WRITE, Action.APPROVE],
    [Resource.ANALYTICS]: [Action.READ, Action.WRITE],
    [Resource.SCRAPERS]: [Action.READ, Action.WRITE],
    [Resource.API_KEYS]: [Action.READ, Action.WRITE],
  },
  [Role.OPERATOR]: {
    [Resource.USERS]: [Action.READ],
    [Resource.JOBS]: [Action.READ, Action.WRITE],
    [Resource.MATCHES]: [Action.READ, Action.WRITE],
    [Resource.RESUMES]: [Action.READ],
    [Resource.DASHBOARD]: [Action.READ],
    [Resource.SETTINGS]: NO_ACCESS,
    [Resource.OPPORTUNITIES]: [Action.READ, Action.WRITE, Action.APPROVE],
    [Resource.ANALYTICS]: [Action.READ],
    [Resource.SCRAPERS]: [Action.READ, Action.WRITE],
    [Resource.API_KEYS]: NO_ACCESS,
  },
  [Role.VIEWER]: {
    [Resource.USERS]: NO_ACCESS,
    [Resource.JOBS]: [Action.READ],
    [Resource.MATCHES]: NO_ACCESS,
    [Resource.RESUMES]: NO_ACCESS,
    [Resource.DASHBOARD]: [Action.READ],
    [Resource.SETTINGS]: NO_ACCESS,
    [Resource.OPPORTUNITIES]: [Action.READ],
    [Resource.ANALYTICS]: [Action.READ],
    [Resource.SCRAPERS]: NO_ACCESS,
    [Resource.API_KEYS]: NO_ACCESS,
  },
  [Role.GOV_OFFICER]: {
    [Resource.USERS]: NO_ACCESS,
    [Resource.JOBS]: NO_ACCESS,
    [Resource.MATCHES]: NO_ACCESS,
    [Resource.RESUMES]: NO_ACCESS,
    [Resource.DASHBOARD]: [Action.READ],
    [Resource.SETTINGS]: NO_ACCESS,
    [Resource.OPPORTUNITIES]: NO_ACCESS,
    [Resource.ANALYTICS]: [Action.READ],
    [Resource.SCRAPERS]: NO_ACCESS,
    [Resource.API_KEYS]: NO_ACCESS,
  },
  [Role.USER]: {
    [Resource.USERS]: NO_ACCESS,
    [Resource.RESUMES]: [Action.READ, Action.WRITE, Action.DELETE],
    [Resource.JOBS]: [Action.READ],
    [Resource.MATCHES]: [Action.READ],
    [Resource.DASHBOARD]: NO_ACCESS,
    [Resource.SETTINGS]: NO_ACCESS,
    [Resource.OPPORTUNITIES]: NO_ACCESS,
    [Resource.ANALYTICS]: NO_ACCESS,
    [Resource.SCRAPERS]: NO_ACCESS,
    [Resource.API_KEYS]: NO_ACCESS,
  },
};

export interface AuthContext {
  userId: string;
  role: Role;
  regionCode?: string;
  govProgramId?: string;
}

/**
 * 检查权限
 */
export function can(
  context: AuthContext,
  resource: Resource,
  action: Action
): boolean {
  const rolePerms = PERMISSION_MATRIX[context.role];
  if (!rolePerms) return false;

  const resourcePerms = rolePerms[resource];
  if (!resourcePerms) return false;

  return resourcePerms.includes(action);
}

/**
 * 抛出权限错误（如无权限）
 */
export function require(
  context: AuthContext,
  resource: Resource,
  action: Action
): void {
  if (!can(context, resource, action)) {
    throw new PermissionDeniedError(
      `权限不足：${context.role} 无法 ${action} ${resource}`
    );
  }
}

/**
 * 权限错误
 */
export class PermissionDeniedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermissionDeniedError';
  }
}

/**
 * 角色等级（数字越大权限越高）
 */
const ROLE_LEVEL: Record<Role, number> = {
  [Role.USER]: 1,
  [Role.GOV_OFFICER]: 2,
  [Role.VIEWER]: 3,
  [Role.OPERATOR]: 4,
  [Role.ADMIN]: 5,
  [Role.SUPER_ADMIN]: 6,
};

/**
 * 比较角色等级
 */
export function hasRoleAtLeast(
  context: AuthContext,
  requiredRole: Role
): boolean {
  return ROLE_LEVEL[context.role] >= ROLE_LEVEL[requiredRole];
}
