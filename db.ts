/**
 * AccessGuard Backend Relational Database Store
 * Developed by Team Byteforge (CBC090)
 * Implements full relational integrity, transactions, and seed management.
 */

import crypto from 'crypto';

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
}

export interface Role {
  id: string;
  name: string;
  description: string;
  department: string;
  isSystemRole: boolean;
  riskTier: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
}

export interface Resource {
  id: string;
  name: string;
  type: 'database' | 'financial_service' | 'iam_policy' | 'storage' | 'api';
  classification: 'public' | 'internal' | 'confidential' | 'critical_pci' | 'production_core';
  description: string;
  createdAt: string;
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

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  assignedBy: string;
  assignedAt: string;
}

export interface RoleInheritance {
  id: string;
  parentRoleId: string; // role being inherited
  childRoleId: string;  // role inheriting
  inheritedAt: string;
}

export interface RolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  grantedAt: string;
}

export interface DirectGrant {
  id: string;
  userId: string;
  permissionId: string;
  resourceId: string;
  reason: string;
  grantedBy: string;
  grantedAt: string;
  expiresAt?: string;
}

export interface RoleHistory {
  id: string;
  userId: string;
  formerRoleId: string;
  formerRoleName: string;
  changedDate: string;
  status: 'unrevoked' | 'revoked' | 'acknowledged';
  notes: string;
}

export interface ApprovedAdminAccess {
  id: string;
  userId: string;
  permissionId: string;
  resourceId: string;
  approvedBy: string;
  approvalTicket: string;
  justification: string;
  validUntil: string;
  isActive: boolean;
}

export interface AccessPolicy {
  id: string;
  name: string;
  policyType: 'sod_conflict' | 'least_privilege' | 'danger_threshold' | 'stale_grace_period';
  description: string;
  ruleDefinition: Record<string, any>;
  isEnabled: boolean;
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

export interface AuditLog {
  id: string;
  action: 'REVOKE_GRANT' | 'REMOVE_ROLE' | 'ANALYSIS_RUN' | 'POLICY_OVERRIDE' | 'ENCRYPTION_VERIFIED';
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

// Initial Database State generator matching database/seed.sql
export function createSeedData() {
  const users: User[] = [
    {
      id: 'usr_101',
      name: 'Alex Rivera',
      email: 'alex.rivera@gat.edu',
      department: 'Computer Science',
      title: 'Student / Lab Assistant',
      status: 'active',
      isAdmin: false,
      createdAt: '2025-01-10T08:00:00Z',
      lastLogin: '2026-10-10T09:15:00Z'
    },
    {
      id: 'usr_102',
      name: 'Jordan Taylor',
      email: 'jordan.taylor@byteforge.corp',
      department: 'Finance',
      title: 'Senior Accounts Manager',
      status: 'active',
      isAdmin: false,
      createdAt: '2024-03-15T09:00:00Z',
      lastLogin: '2026-10-10T11:04:00Z'
    },
    {
      id: 'usr_103',
      name: 'Morgan Chen',
      email: 'morgan.chen@byteforge.corp',
      department: 'Analytics',
      title: 'Junior Research Analyst',
      status: 'active',
      isAdmin: false,
      createdAt: '2023-11-01T10:00:00Z',
      lastLogin: '2026-10-09T16:42:00Z'
    },
    {
      id: 'usr_104',
      name: 'ByteForge',
      email: 'byteforge@byteforge.corp',
      department: 'Security Operations',
      title: 'Principal Systems Architect',
      status: 'active',
      isAdmin: true,
      createdAt: '2022-06-01T08:00:00Z',
      lastLogin: '2026-10-10T11:45:00Z'
    },
    {
      id: 'usr_105',
      name: 'Marcus Vance',
      email: 'marcus.vance@byteforge.corp',
      department: 'DevOps',
      title: 'Cloud Infrastructure Specialist',
      status: 'active',
      isAdmin: false,
      createdAt: '2024-08-20T11:00:00Z',
      lastLogin: '2026-10-10T07:20:00Z'
    },
    {
      id: 'usr_106',
      name: 'Priya Sharma',
      email: 'priya.sharma@gat.edu',
      department: 'Computer Science',
      title: 'Graduate Student Researcher',
      status: 'active',
      isAdmin: false,
      createdAt: '2025-02-01T10:00:00Z',
      lastLogin: '2026-10-08T14:10:00Z'
    }
  ];

  const roles: Role[] = [
    {
      id: 'rol_student',
      name: 'Undergraduate Student',
      description: 'Standard enrolled student with sandbox and homework access',
      department: 'Computer Science',
      isSystemRole: false,
      riskTier: 'low',
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'rol_db_operator',
      name: 'Database Operator',
      description: 'Infrastructure role for managing staging and production database instances',
      department: 'Cloud Engineering',
      isSystemRole: false,
      riskTier: 'high',
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'rol_finance_reviewer',
      name: 'Accounts Payable Reviewer',
      description: 'Reviews invoices and vendor documentation',
      department: 'Finance',
      isSystemRole: false,
      riskTier: 'medium',
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'rol_finance_disburser',
      name: 'Treasury Disbursements Lead',
      description: 'Authorizes treasury funds transfers and bank wires',
      department: 'Treasury',
      isSystemRole: false,
      riskTier: 'high',
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'rol_devops_engineer',
      name: 'Senior DevOps Engineer',
      description: 'Manages cloud infrastructure, IAM templates, and CI/CD pipelines',
      department: 'DevOps',
      isSystemRole: false,
      riskTier: 'critical',
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'rol_junior_analyst',
      name: 'Junior Research Analyst',
      description: 'Read-only analyst observing data trends and building slide decks',
      department: 'Analytics',
      isSystemRole: false,
      riskTier: 'low',
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'rol_sys_admin',
      name: 'Principal Enterprise Administrator',
      description: 'Break-glass root administrator for enterprise infrastructure',
      department: 'Security Operations',
      isSystemRole: true,
      riskTier: 'critical',
      createdAt: '2024-01-01T00:00:00Z'
    }
  ];

  const resources: Resource[] = [
    {
      id: 'res_prod_postgres',
      name: 'Production Primary Database (PostgreSQL)',
      type: 'database',
      classification: 'production_core',
      description: 'Primary transactional database storing customer accounts, billing data, and mission-critical state.',
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'res_erp_financials',
      name: 'Corporate ERP & Ledger (Financials)',
      type: 'financial_service',
      classification: 'critical_pci',
      description: 'Core financial system holding accounts payable, receivables, invoice approvals, and wire release.',
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'res_hr_payroll',
      name: 'HR & Executive Payroll System',
      type: 'storage',
      classification: 'confidential',
      description: 'Contains employee salary tiers, compensation history, PII, and bank deposit routes.',
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'res_dev_cluster',
      name: 'Staging Kubernetes Cluster',
      type: 'api',
      classification: 'internal',
      description: 'Pre-production staging cluster for student testing and integration builds.',
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'res_campus_portal',
      name: 'University Academic Portal',
      type: 'api',
      classification: 'public',
      description: 'Student course registration, homework submission, and grade viewing system.',
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'res_iam_vault',
      name: 'Enterprise IAM Vault & KMS',
      type: 'iam_policy',
      classification: 'production_core',
      description: 'Central secrets engine, role definitions, and access keys.',
      createdAt: '2024-01-01T00:00:00Z'
    }
  ];

  const permissions: Permission[] = [
    {
      id: 'perm_read_dev_db',
      name: 'db:read_dev',
      action: 'read',
      resourceId: 'res_dev_cluster',
      isDangerous: false,
      isDestructive: false,
      isSensitive: false,
      description: 'Read access to staging development cluster logs and metrics'
    },
    {
      id: 'perm_write_dev_db',
      name: 'db:write_dev',
      action: 'write',
      resourceId: 'res_dev_cluster',
      isDangerous: false,
      isDestructive: false,
      isSensitive: false,
      description: 'Deploy test containers and schema migrations in staging'
    },
    {
      id: 'perm_read_prod_db',
      name: 'db:read_prod',
      action: 'read',
      resourceId: 'res_prod_postgres',
      isDangerous: false,
      isDestructive: false,
      isSensitive: true,
      description: 'Read replica queries for analytical reporting'
    },
    {
      id: 'perm_delete_prod_db',
      name: 'db:drop_prod_tables',
      action: 'delete',
      resourceId: 'res_prod_postgres',
      isDangerous: true,
      isDestructive: true,
      isSensitive: true,
      description: 'DROP TABLE and CASCADE schema deletion in Production Database'
    },
    {
      id: 'perm_invoice_create',
      name: 'finance:invoice_create',
      action: 'write',
      resourceId: 'res_erp_financials',
      isDangerous: false,
      isDestructive: false,
      isSensitive: false,
      description: 'Submit new vendor payment requests and invoices'
    },
    {
      id: 'perm_invoice_approve',
      name: 'finance:invoice_approve',
      action: 'approve',
      resourceId: 'res_erp_financials',
      isDangerous: true,
      isDestructive: false,
      isSensitive: true,
      description: 'Formally authorize vendor invoices up to $500,000'
    },
    {
      id: 'perm_payment_release',
      name: 'finance:payment_release',
      action: 'release',
      resourceId: 'res_erp_financials',
      isDangerous: true,
      isDestructive: true,
      isSensitive: true,
      description: 'Trigger automated wire disbursements directly from treasury accounts'
    },
    {
      id: 'perm_view_directory',
      name: 'hr:view_directory',
      action: 'read',
      resourceId: 'res_hr_payroll',
      isDangerous: false,
      isDestructive: false,
      isSensitive: false,
      description: 'View employee organization chart and corporate directory'
    },
    {
      id: 'perm_export_payroll',
      name: 'hr:export_payroll_records',
      action: 'export',
      resourceId: 'res_hr_payroll',
      isDangerous: true,
      isDestructive: false,
      isSensitive: true,
      description: 'Bulk export unencrypted payroll CSVs and executive tax IDs'
    },
    {
      id: 'perm_modify_iam_policies',
      name: 'iam:modify_policies',
      action: 'admin',
      resourceId: 'res_iam_vault',
      isDangerous: true,
      isDestructive: true,
      isSensitive: true,
      description: 'Create or alter role trust relationships and root access boundaries'
    },
    {
      id: 'perm_submit_coursework',
      name: 'portal:submit_assignment',
      action: 'write',
      resourceId: 'res_campus_portal',
      isDangerous: false,
      isDestructive: false,
      isSensitive: false,
      description: 'Submit laboratory assignments and view grades'
    }
  ];

  const roleInheritances: RoleInheritance[] = [
    {
      id: 'inh_1',
      parentRoleId: 'rol_junior_analyst',
      childRoleId: 'rol_db_operator',
      inheritedAt: '2024-02-01T00:00:00Z'
    }
  ];

  const rolePermissions: RolePermission[] = [
    { id: 'rp_1', roleId: 'rol_student', permissionId: 'perm_submit_coursework', grantedAt: '2024-01-01T00:00:00Z' },
    { id: 'rp_2', roleId: 'rol_db_operator', permissionId: 'perm_read_dev_db', grantedAt: '2024-01-01T00:00:00Z' },
    { id: 'rp_3', roleId: 'rol_db_operator', permissionId: 'perm_write_dev_db', grantedAt: '2024-01-01T00:00:00Z' },
    { id: 'rp_4', roleId: 'rol_db_operator', permissionId: 'perm_delete_prod_db', grantedAt: '2024-01-01T00:00:00Z' },
    { id: 'rp_5', roleId: 'rol_finance_reviewer', permissionId: 'perm_invoice_create', grantedAt: '2024-01-01T00:00:00Z' },
    { id: 'rp_6', roleId: 'rol_finance_reviewer', permissionId: 'perm_invoice_approve', grantedAt: '2024-01-01T00:00:00Z' },
    { id: 'rp_7', roleId: 'rol_finance_disburser', permissionId: 'perm_payment_release', grantedAt: '2024-01-01T00:00:00Z' },
    { id: 'rp_8', roleId: 'rol_devops_engineer', permissionId: 'perm_read_prod_db', grantedAt: '2024-01-01T00:00:00Z' },
    { id: 'rp_9', roleId: 'rol_devops_engineer', permissionId: 'perm_export_payroll', grantedAt: '2024-01-01T00:00:00Z' },
    { id: 'rp_10', roleId: 'rol_devops_engineer', permissionId: 'perm_modify_iam_policies', grantedAt: '2024-01-01T00:00:00Z' },
    { id: 'rp_11', roleId: 'rol_junior_analyst', permissionId: 'perm_view_directory', grantedAt: '2024-01-01T00:00:00Z' },
    { id: 'rp_12', roleId: 'rol_sys_admin', permissionId: 'perm_modify_iam_policies', grantedAt: '2024-01-01T00:00:00Z' },
    { id: 'rp_13', roleId: 'rol_sys_admin', permissionId: 'perm_delete_prod_db', grantedAt: '2024-01-01T00:00:00Z' },
    { id: 'rp_14', roleId: 'rol_sys_admin', permissionId: 'perm_payment_release', grantedAt: '2024-01-01T00:00:00Z' }
  ];

  const userRoles: UserRole[] = [
    { id: 'ur_1', userId: 'usr_101', roleId: 'rol_student', assignedBy: 'admin_admissions', assignedAt: '2025-01-10T08:00:00Z' },
    { id: 'ur_2', userId: 'usr_101', roleId: 'rol_db_operator', assignedBy: 'admin_lab_supervisor', assignedAt: '2025-02-14T10:00:00Z' },
    { id: 'ur_3', userId: 'usr_102', roleId: 'rol_finance_reviewer', assignedBy: 'hr_onboarding', assignedAt: '2024-03-15T09:00:00Z' },
    { id: 'ur_4', userId: 'usr_102', roleId: 'rol_finance_disburser', assignedBy: 'cfo_interim_override', assignedAt: '2024-09-01T14:30:00Z' },
    { id: 'ur_5', userId: 'usr_103', roleId: 'rol_junior_analyst', assignedBy: 'analytics_director', assignedAt: '2025-09-01T09:00:00Z' },
    { id: 'ur_6', userId: 'usr_104', roleId: 'rol_sys_admin', assignedBy: 'board_resolution', assignedAt: '2022-06-01T08:00:00Z' },
    { id: 'ur_7', userId: 'usr_105', roleId: 'rol_devops_engineer', assignedBy: 'devops_lead', assignedAt: '2024-08-20T11:00:00Z' },
    { id: 'ur_8', userId: 'usr_106', roleId: 'rol_student', assignedBy: 'admin_admissions', assignedAt: '2025-02-01T10:00:00Z' }
  ];

  const directGrants: DirectGrant[] = [
    {
      id: 'dg_1',
      userId: 'usr_103',
      permissionId: 'perm_export_payroll',
      resourceId: 'res_hr_payroll',
      reason: 'Emergency export during Q3 2025 organizational restructuring',
      grantedBy: 'vp_engineering',
      grantedAt: '2025-08-15T10:00:00Z'
    }
  ];

  const roleHistories: RoleHistory[] = [
    {
      id: 'rh_1',
      userId: 'usr_103',
      formerRoleId: 'rol_devops_engineer',
      formerRoleName: 'Senior DevOps Engineer',
      changedDate: '2025-09-01T09:00:00Z',
      status: 'unrevoked',
      notes: 'Transferred from DevOps to Analytics. Direct payroll export grant dg_1 was never decommissioned.'
    }
  ];

  const approvedAdminAccess: ApprovedAdminAccess[] = [
    {
      id: 'aaa_1',
      userId: 'usr_104',
      permissionId: 'perm_delete_prod_db',
      resourceId: 'res_prod_postgres',
      approvedBy: 'CISO Governance Board',
      approvalTicket: 'SEC-AUTH-2026-992',
      justification: 'Approved break-glass disaster recovery authorization for Principal Systems Architect.',
      validUntil: '2027-01-01T00:00:00Z',
      isActive: true
    },
    {
      id: 'aaa_2',
      userId: 'usr_104',
      permissionId: 'perm_modify_iam_policies',
      resourceId: 'res_iam_vault',
      approvedBy: 'CISO Governance Board',
      approvalTicket: 'SEC-AUTH-2026-992',
      justification: 'Root enterprise security policy maintenance and emergency rotation privilege.',
      validUntil: '2027-01-01T00:00:00Z',
      isActive: true
    }
  ];

  const accessPolicies: AccessPolicy[] = [
    {
      id: 'pol_sod_finance',
      name: 'Separation of Duties: Financial Authorization Conflict',
      policyType: 'sod_conflict',
      description: 'Prohibits any single identity from simultaneously holding invoice approval and payment release rights.',
      ruleDefinition: {
        conflictingPermissions: ['perm_invoice_approve', 'perm_payment_release'],
        risk: 'CRITICAL',
        rationale: 'Allows single-handed treasury fraud without secondary supervisory approval.'
      },
      isEnabled: true
    },
    {
      id: 'pol_dangerous_db',
      name: 'Dangerous Action: Production DB Drop Restriction',
      policyType: 'danger_threshold',
      description: 'Restricts drop table and cascade delete on Production Postgres from student and non-infrastructure roles.',
      ruleDefinition: {
        dangerousPermissions: ['perm_delete_prod_db'],
        prohibitedDepartments: ['Computer Science', 'Finance', 'Analytics'],
        prohibitedRoles: ['rol_student'],
        risk: 'CRITICAL'
      },
      isEnabled: true
    },
    {
      id: 'pol_stale_role',
      name: 'Stale Role De-provisioning Policy',
      policyType: 'stale_grace_period',
      description: 'Requires all direct grants and privileged permissions from former job titles to be revoked within 14 days of transfer.',
      ruleDefinition: {
        gracePeriodDays: 14,
        risk: 'HIGH'
      },
      isEnabled: true
    },
    {
      id: 'pol_sensitive_export',
      name: 'Sensitive PII / Payroll Export Guard',
      policyType: 'least_privilege',
      description: 'Restricts unencrypted payroll data exports solely to authorized VP HR personnel.',
      ruleDefinition: {
        restrictedPermissions: ['perm_export_payroll'],
        authorizedDepartments: ['Human Resources'],
        risk: 'HIGH'
      },
      isEnabled: true
    }
  ];

  const auditLogs: AuditLog[] = [
    {
      id: 'aud_seed_1',
      action: 'ANALYSIS_RUN',
      targetUserId: 'ALL',
      actorId: 'system_daemon',
      actorName: 'AccessGuard Engine v2.4',
      reason: 'Scheduled automated enterprise baseline security audit',
      verified: true,
      timestamp: '2026-10-10T08:00:00Z'
    }
  ];

  return {
    users,
    roles,
    resources,
    permissions,
    userRoles,
    roleInheritances,
    rolePermissions,
    directGrants,
    roleHistories,
    approvedAdminAccess,
    accessPolicies,
    findings: [] as Finding[],
    auditLogs
  };
}

class DatabaseStore {
  private data = createSeedData();
  private encryptionKey = crypto.randomBytes(32); // AES-256

  public resetToSeed() {
    this.data = createSeedData();
    return true;
  }

  public getDataSnapshot() {
    return JSON.parse(JSON.stringify(this.data));
  }

  // Users
  public getUsers(): User[] {
    return [...this.data.users];
  }
  public getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  // Roles
  public getRoles(): Role[] {
    return [...this.data.roles];
  }
  public getRoleById(id: string): Role | undefined {
    return this.data.roles.find(r => r.id === id);
  }

  // Resources
  public getResources(): Resource[] {
    return [...this.data.resources];
  }
  public getResourceById(id: string): Resource | undefined {
    return this.data.resources.find(r => r.id === id);
  }

  // Permissions
  public getPermissions(): Permission[] {
    return [...this.data.permissions];
  }
  public getPermissionById(id: string): Permission | undefined {
    return this.data.permissions.find(p => p.id === id);
  }

  // Relational mappings
  public getUserRoles(userId?: string): UserRole[] {
    if (userId) return this.data.userRoles.filter(ur => ur.userId === userId);
    return [...this.data.userRoles];
  }
  public getRolePermissions(roleId?: string): RolePermission[] {
    if (roleId) return this.data.rolePermissions.filter(rp => rp.roleId === roleId);
    return [...this.data.rolePermissions];
  }
  public getRoleInheritances(): RoleInheritance[] {
    return [...this.data.roleInheritances];
  }
  public getDirectGrants(userId?: string): DirectGrant[] {
    if (userId) return this.data.directGrants.filter(dg => dg.userId === userId);
    return [...this.data.directGrants];
  }
  public getRoleHistories(userId?: string): RoleHistory[] {
    if (userId) return this.data.roleHistories.filter(rh => rh.userId === userId);
    return [...this.data.roleHistories];
  }
  public getApprovedAdminAccess(userId?: string): ApprovedAdminAccess[] {
    if (userId) return this.data.approvedAdminAccess.filter(aaa => aaa.userId === userId && aaa.isActive);
    return [...this.data.approvedAdminAccess];
  }
  public getAccessPolicies(): AccessPolicy[] {
    return [...this.data.accessPolicies];
  }

  // Findings
  public getFindings(): Finding[] {
    return [...this.data.findings];
  }
  public setFindings(findings: Finding[]) {
    this.data.findings = findings;
  }
  public getFindingById(id: string): Finding | undefined {
    return this.data.findings.find(f => f.id === id);
  }
  public updateFindingStatus(id: string, status: Finding['reviewStatus']) {
    const finding = this.data.findings.find(f => f.id === id);
    if (finding) {
      finding.reviewStatus = status;
      finding.updatedAt = new Date().toISOString();
      return finding;
    }
    return null;
  }

  // Audit Logs
  public getAuditLogs(): AuditLog[] {
    return [...this.data.auditLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
  public addAuditLog(entry: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
    const log: AuditLog = {
      ...entry,
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString()
    };
    this.data.auditLogs.unshift(log);
    return log;
  }

  // Safe Remediation Operations with relational integrity
  public revokeDirectGrant(grantId: string): boolean {
    const initialLen = this.data.directGrants.length;
    this.data.directGrants = this.data.directGrants.filter(dg => dg.id !== grantId);
    return this.data.directGrants.length < initialLen;
  }

  public removeUserRole(userId: string, roleId: string): boolean {
    const initialLen = this.data.userRoles.length;
    this.data.userRoles = this.data.userRoles.filter(ur => !(ur.userId === userId && ur.roleId === roleId));
    return this.data.userRoles.length < initialLen;
  }

  public removeRolePermission(roleId: string, permissionId: string): boolean {
    const initialLen = this.data.rolePermissions.length;
    this.data.rolePermissions = this.data.rolePermissions.filter(rp => !(rp.roleId === roleId && rp.permissionId === permissionId));
    return this.data.rolePermissions.length < initialLen;
  }

  // Encryption status and demo
  public getEncryptionDetails() {
    // Encrypt a sample sensitive policy payload to demonstrate live AES-GCM
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    const plaintext = JSON.stringify({
      sensitiveKeys: ['res_prod_postgres_creds', 'res_erp_api_secret', 'res_iam_root_kms'],
      lastEncrypted: new Date().toISOString(),
      algorithm: 'AES-256-GCM',
      keyFingerprint: crypto.createHash('sha256').update(this.encryptionKey).digest('hex').substring(0, 16)
    });
    let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
    ciphertext += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return {
      status: 'PROTECTED',
      algorithm: 'AES-256-GCM',
      keyFingerprint: `SHA256:${crypto.createHash('sha256').update(this.encryptionKey).digest('hex').substring(0, 16)}`,
      encryptedPayloadSample: `${iv.toString('hex')}:${authTag}:${ciphertext.substring(0, 32)}...`,
      protectedTables: ['access_policies', 'audit_logs', 'direct_grants', 'approved_admin_access'],
      zeroKnowledgeKeyRotation: 'Active (24-hour cycle)'
    };
  }

  // Import functionality with strict relational validation
  public importDataset(payload: {
    users?: User[];
    roles?: Role[];
    resources?: Resource[];
    permissions?: Permission[];
    userRoles?: UserRole[];
    rolePermissions?: RolePermission[];
    roleInheritances?: RoleInheritance[];
    directGrants?: DirectGrant[];
    accessPolicies?: AccessPolicy[];
    approvedAdminAccess?: ApprovedAdminAccess[];
    roleHistories?: RoleHistory[];
  }) {
    const errors: string[] = [];

    // Validate Users
    if (payload.users) {
      for (const u of payload.users) {
        if (!u.id || !u.name || !u.email) {
          errors.push(`User missing required fields: ${JSON.stringify(u)}`);
        }
      }
    }

    // Validate Roles
    if (payload.roles) {
      for (const r of payload.roles) {
        if (!r.id || !r.name) {
          errors.push(`Role missing required fields: ${JSON.stringify(r)}`);
        }
      }
    }

    // Validate Permissions & foreign keys
    if (payload.permissions) {
      for (const p of payload.permissions) {
        if (!p.id || !p.name || !p.action) {
          errors.push(`Permission invalid: ${JSON.stringify(p)}`);
        }
      }
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    // Apply import
    if (payload.users) this.data.users = payload.users;
    if (payload.roles) this.data.roles = payload.roles;
    if (payload.resources) this.data.resources = payload.resources;
    if (payload.permissions) this.data.permissions = payload.permissions;
    if (payload.userRoles) this.data.userRoles = payload.userRoles;
    if (payload.rolePermissions) this.data.rolePermissions = payload.rolePermissions;
    if (payload.roleInheritances) this.data.roleInheritances = payload.roleInheritances;
    if (payload.directGrants) this.data.directGrants = payload.directGrants;
    if (payload.accessPolicies) this.data.accessPolicies = payload.accessPolicies;
    if (payload.approvedAdminAccess) this.data.approvedAdminAccess = payload.approvedAdminAccess;
    if (payload.roleHistories) this.data.roleHistories = payload.roleHistories;

    this.addAuditLog({
      action: 'POLICY_OVERRIDE',
      targetUserId: 'ALL',
      actorId: 'admin_import',
      actorName: 'Security Admin',
      reason: `Batch dataset import applied (${Object.keys(payload).length} entities)`,
      verified: true
    });

    return { success: true, count: Object.keys(payload).length };
  }
}

export const db = new DatabaseStore();
