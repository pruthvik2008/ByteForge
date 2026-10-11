/**
 * AccessGuard Frontend Types
 * Team Byteforge (CBC090)
 */

export interface User {
  id: string;
  name: string;
  email: string;
  department: string;
  title: string;
  status: 'active' | 'suspended';
  isAdmin: boolean;
  createdAt: string;
  lastLogin: string;
  assignedRoles?: Role[];
  inheritedRoles?: Role[];
  directGrantsCount?: number;
  effectivePermissionsCount?: number;
  associatedFindingsCount?: number;
  highestSeverity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'SECURE';
}

export interface Role {
  id: string;
  name: string;
  description: string;
  department: string;
  isSystemRole: boolean;
  riskTier: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  assignedUsersCount?: number;
  permissionsCount?: number;
}

export interface Resource {
  id: string;
  name: string;
  type: 'database' | 'financial_service' | 'iam_policy' | 'storage' | 'api';
  classification: 'public' | 'internal' | 'confidential' | 'critical_pci' | 'production_core';
  description: string;
  createdAt: string;
  openFindingsCount?: number;
  highestSeverity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'SECURE';
}

export interface Permission {
  id: string;
  name: string;
  action: 'read' | 'write' | 'delete' | 'approve' | 'release' | 'admin' | 'export';
  resourceId: string;
  isDangerous: boolean;
  isDestructive: boolean;
  isSensitive: boolean;
  description: string;
}

export interface EffectivePermissionSource {
  type: 'direct' | 'role' | 'inherited_role';
  roleId?: string;
  roleName?: string;
  parentRoleId?: string;
  parentRoleName?: string;
  grantId?: string;
  path: string[];
}

export interface EffectivePermission {
  permission: Permission;
  resource: Resource;
  sources: EffectivePermissionSource[];
  isDangerous: boolean;
  isDestructive: boolean;
  isSensitive: boolean;
  isApprovedAdmin: boolean;
  approvalTicket?: string;
}

export interface UserEffectiveAccess {
  user: User;
  assignedRoles: Role[];
  inheritedRoles: Role[];
  directGrantsCount: number;
  effectivePermissions: EffectivePermission[];
  associatedFindingsCount: number;
  highestSeverity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'SECURE';
  findings?: Finding[];
}

export interface Finding {
  id: string;
  userId: string;
  ruleCategory: 'excessive_permission' | 'stale_access' | 'sod_conflict' | 'dangerous_permission' | 'unusual_combination' | 'unrestricted_access' | 'sensitive_data';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  affectedResourceId: string;
  affectedPermissionId: string;
  affectedRoleId?: string;
  sourceGrantType: 'direct' | 'role' | 'inherited_role';
  permissionPath: {
    source: string;
    path: string[];
    viaRoles: string[];
    isInherited: boolean;
  };
  evidence: string;
  potentialImpact: string;
  recommendedFix: string;
  reviewStatus: 'Open' | 'In Progress' | 'Resolved' | 'Approved_Exception';
  isApprovedAdmin?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardSummary {
  totalUsers: number;
  totalRoles: number;
  totalPermissions: number;
  totalResources: number;
  totalFindings: number;
  openFindingsCount: number;
  resolvedFindingsCount: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  riskScore: number;
  riskTier: string;
  lastScanTimestamp: string;
}

export interface AuditLog {
  id: string;
  action: string;
  targetUserId: string;
  targetGrantId?: string;
  targetPermissionId?: string;
  targetRoleId?: string;
  actorId: string;
  actorName: string;
  reason: string;
  previousState?: any;
  newState?: any;
  riskScoreBefore?: number;
  riskScoreAfter?: number;
  verified: boolean;
  timestamp: string;
}

export interface SimulationResult {
  userId: string;
  userName: string;
  changeType: string;
  targetItem: string;
  affectedResources: string[];
  isSafeguardTriggered: boolean;
  safeguardWarning: string | null;
  metricsBefore: {
    riskScore: number;
    criticalFindings: number;
    highFindings: number;
    openFindings: number;
  };
  metricsAfter: {
    riskScore: number;
    criticalFindings: number;
    highFindings: number;
    openFindings: number;
  };
  riskReductionPercent: number;
  recommendedAction: string;
}
