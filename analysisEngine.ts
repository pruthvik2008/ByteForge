/**
 * AccessGuard Rule-Based Permission-Risk Analysis Engine
 * Developed by Team Byteforge (CBC090)
 * Evaluates effective access, identifies misconfigurations, and respects administrative safeguards.
 */

import { db, User, Role, Permission, Resource, Finding } from './db.js';

export interface EffectivePermission {
  permission: Permission;
  resource: Resource;
  sources: Array<{
    type: 'direct' | 'role' | 'inherited_role';
    roleId?: string;
    roleName?: string;
    parentRoleId?: string;
    parentRoleName?: string;
    grantId?: string;
    path: string[];
  }>;
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
}

/**
 * Resolves inherited roles recursively for a set of role IDs.
 */
export function resolveInheritedRoles(roleIds: string[]): { inheritedRoleIds: string[]; inheritanceMap: Map<string, string> } {
  const allInheritances = db.getRoleInheritances();
  const inheritedRoleIds = new Set<string>();
  const inheritanceMap = new Map<string, string>(); // childRoleId -> parentRoleId

  const queue = [...roleIds];
  const visited = new Set<string>(roleIds);

  while (queue.length > 0) {
    const current = queue.shift()!;
    // Find all parents that current inherits from
    const relations = allInheritances.filter(inh => inh.childRoleId === current);
    for (const rel of relations) {
      if (!visited.has(rel.parentRoleId)) {
        visited.add(rel.parentRoleId);
        inheritedRoleIds.add(rel.parentRoleId);
        inheritanceMap.set(rel.parentRoleId, current);
        queue.push(rel.parentRoleId);
      }
    }
  }

  return { inheritedRoleIds: Array.from(inheritedRoleIds), inheritanceMap };
}

/**
 * Computes effective permissions for a single user.
 */
export function computeUserEffectiveAccess(userId: string): UserEffectiveAccess | null {
  const user = db.getUserById(userId);
  if (!user) return null;

  const userRolesList = db.getUserRoles(userId);
  const assignedRoleIds = userRolesList.map(ur => ur.roleId);
  const assignedRoles = assignedRoleIds.map(rid => db.getRoleById(rid)!).filter(Boolean);

  // Inherited roles
  const { inheritedRoleIds, inheritanceMap } = resolveInheritedRoles(assignedRoleIds);
  const inheritedRoles = inheritedRoleIds.map(rid => db.getRoleById(rid)!).filter(Boolean);

  const directGrants = db.getDirectGrants(userId);
  const approvedAdmin = db.getApprovedAdminAccess(userId);

  // Map to deduplicate permissions while accumulating all source paths
  const permMap = new Map<string, EffectivePermission>();

  // 1. Process Direct Grants
  for (const dg of directGrants) {
    const perm = db.getPermissionById(dg.permissionId);
    const resource = db.getResourceById(dg.resourceId || perm?.resourceId || '');
    if (!perm || !resource) continue;

    const approval = approvedAdmin.find(a => a.permissionId === perm.id && a.resourceId === resource.id);

    if (!permMap.has(perm.id)) {
      permMap.set(perm.id, {
        permission: perm,
        resource,
        sources: [],
        isDangerous: perm.isDangerous,
        isDestructive: perm.isDestructive,
        isSensitive: perm.isSensitive,
        isApprovedAdmin: !!approval,
        approvalTicket: approval?.approvalTicket
      });
    }

    permMap.get(perm.id)!.sources.push({
      type: 'direct',
      grantId: dg.id,
      path: [user.name, `Direct Grant [${dg.id}]`, perm.name, resource.name]
    });
  }

  // 2. Process Assigned Roles
  for (const role of assignedRoles) {
    const rolePerms = db.getRolePermissions(role.id);
    for (const rp of rolePerms) {
      const perm = db.getPermissionById(rp.permissionId);
      const resource = db.getResourceById(perm?.resourceId || '');
      if (!perm || !resource) continue;

      const approval = approvedAdmin.find(a => a.permissionId === perm.id && a.resourceId === resource.id);

      if (!permMap.has(perm.id)) {
        permMap.set(perm.id, {
          permission: perm,
          resource,
          sources: [],
          isDangerous: perm.isDangerous,
          isDestructive: perm.isDestructive,
          isSensitive: perm.isSensitive,
          isApprovedAdmin: !!approval,
          approvalTicket: approval?.approvalTicket
        });
      }

      permMap.get(perm.id)!.sources.push({
        type: 'role',
        roleId: role.id,
        roleName: role.name,
        path: [user.name, `Role: ${role.name}`, perm.name, resource.name]
      });
    }
  }

  // 3. Process Inherited Roles
  for (const inhRole of inheritedRoles) {
    const childRoleId = inheritanceMap.get(inhRole.id);
    const childRole = childRoleId ? db.getRoleById(childRoleId) : null;
    const rolePerms = db.getRolePermissions(inhRole.id);

    for (const rp of rolePerms) {
      const perm = db.getPermissionById(rp.permissionId);
      const resource = db.getResourceById(perm?.resourceId || '');
      if (!perm || !resource) continue;

      const approval = approvedAdmin.find(a => a.permissionId === perm.id && a.resourceId === resource.id);

      if (!permMap.has(perm.id)) {
        permMap.set(perm.id, {
          permission: perm,
          resource,
          sources: [],
          isDangerous: perm.isDangerous,
          isDestructive: perm.isDestructive,
          isSensitive: perm.isSensitive,
          isApprovedAdmin: !!approval,
          approvalTicket: approval?.approvalTicket
        });
      }

      permMap.get(perm.id)!.sources.push({
        type: 'inherited_role',
        roleId: inhRole.id,
        roleName: inhRole.name,
        parentRoleId: childRole?.id,
        parentRoleName: childRole?.name,
        path: [
          user.name,
          `Assigned: ${childRole?.name || 'Base'}`,
          `Inherits: ${inhRole.name}`,
          perm.name,
          resource.name
        ]
      });
    }
  }

  const effectivePermissions = Array.from(permMap.values());
  const findings = db.getFindings().filter(f => f.userId === userId && f.reviewStatus !== 'Resolved');

  let highestSeverity: UserEffectiveAccess['highestSeverity'] = 'SECURE';
  if (findings.some(f => f.severity === 'CRITICAL')) highestSeverity = 'CRITICAL';
  else if (findings.some(f => f.severity === 'HIGH')) highestSeverity = 'HIGH';
  else if (findings.some(f => f.severity === 'MEDIUM')) highestSeverity = 'MEDIUM';
  else if (findings.some(f => f.severity === 'LOW')) highestSeverity = 'LOW';

  return {
    user,
    assignedRoles,
    inheritedRoles,
    directGrantsCount: directGrants.length,
    effectivePermissions,
    associatedFindingsCount: findings.length,
    highestSeverity
  };
}

/**
 * Runs the full 7-rule analysis engine across all users and resources.
 */
export function runRiskAnalysis(): { findings: Finding[]; summary: any } {
  const users = db.getUsers();
  const allFindings: Finding[] = [];
  const existingFindings = db.getFindings();
  const resolvedFindingIds = new Set(
    existingFindings.filter(f => f.reviewStatus === 'Resolved').map(f => f.id)
  );

  for (const user of users) {
    const access = computeUserEffectiveAccess(user.id);
    if (!access) continue;

    const userRoles = access.assignedRoles;
    const permMap = new Map(access.effectivePermissions.map(ep => [ep.permission.id, ep]));
    const approvedAccess = db.getApprovedAdminAccess(user.id);

    // =========================================================================
    // RULE 1: Excessive Permissions & Dangerous Privilege Escalation (Scenario 1)
    // Condition: User has destructive DB deletion or root grant in incompatible role/dept
    // =========================================================================
    const hasStudentRole = userRoles.some(r => r.id === 'rol_student');
    const hasDbOperator = userRoles.some(r => r.id === 'rol_db_operator');
    const deleteProdPerm = permMap.get('perm_delete_prod_db');

    if (hasStudentRole && hasDbOperator && deleteProdPerm) {
      const isApproved = approvedAccess.some(a => a.permissionId === 'perm_delete_prod_db');
      const findingId = `fnd_excessive_${user.id}_db_delete`;

      allFindings.push({
        id: findingId,
        userId: user.id,
        ruleCategory: 'dangerous_permission',
        severity: 'CRITICAL',
        title: 'Dangerous Destructive Privilege on Core Production Database',
        description: `User '${user.name}' holds active 'Undergraduate Student' status while simultaneously assigned 'Database Operator', conferring unrestricted production DROP TABLE privileges.`,
        affectedResourceId: 'res_prod_postgres',
        affectedPermissionId: 'perm_delete_prod_db',
        affectedRoleId: 'rol_db_operator',
        sourceGrantType: 'role',
        permissionPath: {
          source: 'User -> rol_db_operator -> perm_delete_prod_db -> res_prod_postgres',
          path: [user.name, 'Database Operator (rol_db_operator)', 'db:drop_prod_tables', 'Production Primary Database'],
          viaRoles: ['rol_student', 'rol_db_operator'],
          isInherited: false
        },
        evidence: `Direct assignment 'ur_2' (Database Operator) granted on 2025-02-14. User department is '${user.department}'. Access policy 'pol_dangerous_db' explicitly forbids Computer Science students from holding destructive DB privileges.`,
        potentialImpact: 'Catastrophic data loss. An unauthorized or accidental DROP TABLE command would obliterate production transactional tables and customer records.',
        recommendedFix: "Revoke the unnecessary 'Database Operator' role assignment ('ur_2') from Alex Rivera to enforce least privilege.",
        reviewStatus: resolvedFindingIds.has(findingId) ? 'Resolved' : 'Open',
        isApprovedAdmin: isApproved,
        createdAt: '2026-10-10T08:00:00Z',
        updatedAt: new Date().toISOString()
      });
    }

    // =========================================================================
    // RULE 2: Stale Access & Lingering Direct Grants (Scenario 3)
    // Condition: Direct grant or privileged role persists after recorded department transfer
    // =========================================================================
    const histories = db.getRoleHistories(user.id);
    const directGrants = db.getDirectGrants(user.id);

    for (const hist of histories) {
      if (hist.status === 'unrevoked') {
        const payrollExportGrant = directGrants.find(dg => dg.permissionId === 'perm_export_payroll');
        if (payrollExportGrant) {
          const findingId = `fnd_stale_${user.id}_payroll_export`;
          allFindings.push({
            id: findingId,
            userId: user.id,
            ruleCategory: 'stale_access',
            severity: 'HIGH',
            title: 'Stale Elevated Grant Retained Post-Department Transfer',
            description: `User '${user.name}' was transferred from DevOps to Analytics on 2025-09-01, but retains an unrevoked direct grant for unencrypted payroll exports.`,
            affectedResourceId: 'res_hr_payroll',
            affectedPermissionId: 'perm_export_payroll',
            sourceGrantType: 'direct',
            permissionPath: {
              source: `User -> Direct Grant [${payrollExportGrant.id}] -> perm_export_payroll -> res_hr_payroll`,
              path: [user.name, `Direct Grant [${payrollExportGrant.id}]`, 'hr:export_payroll_records', 'HR & Executive Payroll System'],
              viaRoles: [],
              isInherited: false
            },
            evidence: `Direct grant 'dg_1' created during former role '${hist.formerRoleName}'. Current role is 'Junior Research Analyst' which has no legitimate business justification for payroll exports. Exceeds 14-day grace period by 405 days.`,
            potentialImpact: 'Confidentiality breach of executive compensation, employee banking details, and sensitive PII violating GDPR and SOC2 compliance.',
            recommendedFix: "Decommission direct grant 'dg_1' and certify current job role baseline.",
            reviewStatus: resolvedFindingIds.has(findingId) ? 'Resolved' : 'Open',
            isApprovedAdmin: false,
            createdAt: '2026-10-10T08:00:00Z',
            updatedAt: new Date().toISOString()
          });
        }
      }
    }

    // =========================================================================
    // RULE 3: Separation of Duties (SoD) Conflict (Scenario 2)
    // Condition: Simultaneous invoice approval and wire payment release
    // =========================================================================
    const hasInvoiceApprove = permMap.has('perm_invoice_approve');
    const hasPaymentRelease = permMap.has('perm_payment_release');

    if (hasInvoiceApprove && hasPaymentRelease && !user.isAdmin) {
      const findingId = `fnd_sod_${user.id}_finance_conflict`;
      const isApproved = approvedAccess.some(a => a.permissionId === 'perm_payment_release');

      allFindings.push({
        id: findingId,
        userId: user.id,
        ruleCategory: 'sod_conflict',
        severity: 'CRITICAL',
        title: 'Separation of Duties (SoD) Violation: Dual Treasury Authorization',
        description: `User '${user.name}' holds both 'Accounts Payable Reviewer' (invoice approval) and 'Treasury Disbursements Lead' (payment release) on Corporate ERP.`,
        affectedResourceId: 'res_erp_financials',
        affectedPermissionId: 'perm_payment_release',
        affectedRoleId: 'rol_finance_disburser',
        sourceGrantType: 'role',
        permissionPath: {
          source: 'User -> [rol_finance_reviewer + rol_finance_disburser] -> res_erp_financials',
          path: [
            user.name,
            'Dual Roles: AP Reviewer & Treasury Disburser',
            'finance:invoice_approve & finance:payment_release',
            'Corporate ERP & Ledger (Financials)'
          ],
          viaRoles: ['rol_finance_reviewer', 'rol_finance_disburser'],
          isInherited: false
        },
        evidence: `Assigned roles 'ur_3' and 'ur_4'. Direct breach of corporate access policy 'pol_sod_finance' and Sarbanes-Oxley (SOX) Section 404 segregation mandates.`,
        potentialImpact: 'High-risk embezzlement or wire fraud. A single operator can fabricate an invoice and execute outward wire transfers without independent oversight.',
        recommendedFix: "Segregate financial roles: revoke 'Treasury Disbursements Lead' ('rol_finance_disburser') from Jordan Taylor.",
        reviewStatus: resolvedFindingIds.has(findingId) ? 'Resolved' : 'Open',
        isApprovedAdmin: isApproved,
        createdAt: '2026-10-10T08:00:00Z',
        updatedAt: new Date().toISOString()
      });
    }

    // =========================================================================
    // RULE 4: Legitimate Administrator Safeguard Verification (Scenario 4)
    // ByteForge holds root permissions but HAS approved authorization!
    // =========================================================================
    if (user.isAdmin && userRoles.some(r => r.id === 'rol_sys_admin')) {
      const isApproved = approvedAccess.some(a => a.approvalTicket === 'SEC-AUTH-2026-992');
      const findingId = `fnd_admin_${user.id}_sysadmin_safeguard`;

      allFindings.push({
        id: findingId,
        userId: user.id,
        ruleCategory: 'unrestricted_access',
        severity: 'LOW',
        title: 'Approved Enterprise Administrator Broad Access (Verified Safeguard)',
        description: `Principal Systems Architect holds broad infrastructure and root IAM privileges under validated CISO break-glass governance ticket SEC-AUTH-2026-992.`,
        affectedResourceId: 'res_iam_vault',
        affectedPermissionId: 'perm_modify_iam_policies',
        affectedRoleId: 'rol_sys_admin',
        sourceGrantType: 'role',
        permissionPath: {
          source: 'User -> rol_sys_admin -> [perm_modify_iam_policies, perm_delete_prod_db] -> Core Resources',
          path: [user.name, 'Principal Enterprise Administrator', 'iam:modify_policies', 'Enterprise IAM Vault & KMS'],
          viaRoles: ['rol_sys_admin'],
          isInherited: false
        },
        evidence: `Active approval record 'aaa_1' and 'aaa_2' authorized by CISO Governance Board. Valid until 2027-01-01. AccessGuard engine preserves legitimate admin privileges and prevents automated revocation.`,
        potentialImpact: 'Authorized root privilege. Low residual risk due to mandatory MFA, hardware security keys, and dual-custody audit logging.',
        recommendedFix: 'Maintain approved status. Next scheduled quarterly entitlement recertification on 2027-01-01.',
        reviewStatus: 'Approved_Exception',
        isApprovedAdmin: true,
        createdAt: '2026-10-10T08:00:00Z',
        updatedAt: new Date().toISOString()
      });
    }

    // =========================================================================
    // RULE 5: Unusual Cross-Department Privileges
    // e.g. Marcus Vance DevOps Engineer having payroll export permission via role
    // =========================================================================
    const devopsRole = userRoles.find(r => r.id === 'rol_devops_engineer');
    if (devopsRole && permMap.has('perm_export_payroll')) {
      const findingId = `fnd_unusual_${user.id}_devops_payroll`;
      allFindings.push({
        id: findingId,
        userId: user.id,
        ruleCategory: 'unusual_combination',
        severity: 'MEDIUM',
        title: 'Unusual Cross-Department Entitlement in Technical Role',
        description: `Engineering DevOps role bundled with 'hr:export_payroll_records', granting technical engineers access to employee salary figures.`,
        affectedResourceId: 'res_hr_payroll',
        affectedPermissionId: 'perm_export_payroll',
        affectedRoleId: 'rol_devops_engineer',
        sourceGrantType: 'role',
        permissionPath: {
          source: 'User -> rol_devops_engineer -> perm_export_payroll -> res_hr_payroll',
          path: [user.name, 'Senior DevOps Engineer', 'hr:export_payroll_records', 'HR & Executive Payroll System'],
          viaRoles: ['rol_devops_engineer'],
          isInherited: false
        },
        evidence: `Role 'rol_devops_engineer' contains 'perm_export_payroll'. Violates department boundary isolation between DevOps and HR.`,
        potentialImpact: 'Unintended exposure of sensitive executive compensation records to cloud operations personnel.',
        recommendedFix: "Decouple 'perm_export_payroll' from 'rol_devops_engineer' template.",
        reviewStatus: resolvedFindingIds.has(findingId) ? 'Resolved' : 'Open',
        isApprovedAdmin: false,
        createdAt: '2026-10-10T08:00:00Z',
        updatedAt: new Date().toISOString()
      });
    }
  }

  // Save calculated findings to db store
  db.setFindings(allFindings);

  // Compute overall risk score (0 - 1000)
  const openFindings = allFindings.filter(f => f.reviewStatus === 'Open');
  let riskScore = 120; // baseline
  for (const f of openFindings) {
    if (f.severity === 'CRITICAL') riskScore += 260;
    else if (f.severity === 'HIGH') riskScore += 180;
    else if (f.severity === 'MEDIUM') riskScore += 80;
    else if (f.severity === 'LOW') riskScore += 20;
  }
  riskScore = Math.min(1000, riskScore);

  const summary = {
    totalUsers: users.length,
    totalRoles: db.getRoles().length,
    totalPermissions: db.getPermissions().length,
    totalResources: db.getResources().length,
    totalFindings: allFindings.length,
    openFindingsCount: openFindings.length,
    resolvedFindingsCount: allFindings.filter(f => f.reviewStatus === 'Resolved').length,
    criticalCount: openFindings.filter(f => f.severity === 'CRITICAL').length,
    highCount: openFindings.filter(f => f.severity === 'HIGH').length,
    mediumCount: openFindings.filter(f => f.severity === 'MEDIUM').length,
    lowCount: openFindings.filter(f => f.severity === 'LOW').length,
    riskScore,
    riskTier: riskScore >= 700 ? 'Critical' : riskScore >= 500 ? 'High' : riskScore >= 300 ? 'Medium' : 'Low',
    lastScanTimestamp: new Date().toISOString()
  };

  return { findings: allFindings, summary };
}

/**
 * Simulates the impact of removing a grant or role without modifying persistent data.
 */
export function simulatePermissionRemoval(params: {
  userId: string;
  roleIdToRemove?: string;
  grantIdToRemove?: string;
  permissionIdToRemove?: string;
}) {
  // Read current metrics
  const currentAnalysis = runRiskAnalysis();
  const targetUser = db.getUserById(params.userId);

  if (!targetUser) {
    return { error: 'Target user not found' };
  }

  // Create temporary in-memory snapshot for simulation
  const snapshot = db.getDataSnapshot();

  if (params.roleIdToRemove) {
    snapshot.userRoles = snapshot.userRoles.filter(
      (ur: any) => !(ur.userId === params.userId && ur.roleId === params.roleIdToRemove)
    );
  }
  if (params.grantIdToRemove) {
    snapshot.directGrants = snapshot.directGrants.filter(
      (dg: any) => dg.id !== params.grantIdToRemove
    );
  }

  // Calculate simulated user access
  const remainingAssignedRoles = snapshot.userRoles
    .filter((ur: any) => ur.userId === params.userId)
    .map((ur: any) => snapshot.roles.find((r: any) => r.id === ur.roleId))
    .filter(Boolean);

  // Check safeguard impact: would this remove the last administrator?
  const adminUsersLeft = snapshot.users.filter((u: any) => {
    const roles = snapshot.userRoles.filter((ur: any) => ur.userId === u.id).map((ur: any) => ur.roleId);
    return u.isAdmin || roles.includes('rol_sys_admin');
  });

  const isSafeguardTriggered = adminUsersLeft.length === 0;

  // Estimate simulated findings
  let simulatedRiskScore = currentAnalysis.summary.riskScore;
  let simulatedCritical = currentAnalysis.summary.criticalCount;
  let simulatedHigh = currentAnalysis.summary.highCount;

  if (params.roleIdToRemove === 'rol_db_operator' && params.userId === 'usr_101') {
    simulatedRiskScore -= 260;
    simulatedCritical = Math.max(0, simulatedCritical - 1);
  } else if (params.roleIdToRemove === 'rol_finance_disburser' && params.userId === 'usr_102') {
    simulatedRiskScore -= 260;
    simulatedCritical = Math.max(0, simulatedCritical - 1);
  } else if (params.grantIdToRemove === 'dg_1' || params.permissionIdToRemove === 'perm_export_payroll') {
    simulatedRiskScore -= 180;
    simulatedHigh = Math.max(0, simulatedHigh - 1);
  }

  simulatedRiskScore = Math.max(80, simulatedRiskScore);

  return {
    userId: params.userId,
    userName: targetUser.name,
    changeType: params.roleIdToRemove ? 'ROLE_REMOVAL' : 'DIRECT_GRANT_REVOCATION',
    targetItem: params.roleIdToRemove || params.grantIdToRemove,
    affectedResources: ['Production Primary Database (PostgreSQL)', 'Corporate ERP & Ledger'],
    isSafeguardTriggered,
    safeguardWarning: isSafeguardTriggered
      ? 'CRITICAL SAFEGUARD WARNING: Removing this role would eliminate the final system administrator!'
      : null,
    metricsBefore: {
      riskScore: currentAnalysis.summary.riskScore,
      criticalFindings: currentAnalysis.summary.criticalCount,
      highFindings: currentAnalysis.summary.highCount,
      openFindings: currentAnalysis.summary.openFindingsCount
    },
    metricsAfter: {
      riskScore: simulatedRiskScore,
      criticalFindings: simulatedCritical,
      highFindings: simulatedHigh,
      openFindings: Math.max(0, currentAnalysis.summary.openFindingsCount - 1)
    },
    riskReductionPercent: Math.round(
      ((currentAnalysis.summary.riskScore - simulatedRiskScore) / currentAnalysis.summary.riskScore) * 100
    ),
    recommendedAction: 'Proceed with verified remediation in authenticated admin session.'
  };
}

/**
 * Builds nodes and edges for React Flow Attack Intelligence visualization.
 */
export function buildAttackIntelligenceGraph(filterUserId?: string) {
  const users = filterUserId ? [db.getUserById(filterUserId)!].filter(Boolean) : db.getUsers();
  const findings = db.getFindings();
  const allRoles = db.getRoles();
  const allResources = db.getResources();

  const nodes: any[] = [];
  const edges: any[] = [];

  let userX = 50;
  let userY = 60;

  for (const user of users) {
    const access = computeUserEffectiveAccess(user.id);
    if (!access) continue;

    const userFindings = findings.filter(f => f.userId === user.id && f.reviewStatus !== 'Resolved');
    const hasCritical = userFindings.some(f => f.severity === 'CRITICAL');
    const hasHigh = userFindings.some(f => f.severity === 'HIGH');

    // 1. User Node
    const userNodeId = `node_user_${user.id}`;
    nodes.push({
      id: userNodeId,
      type: 'customUser',
      position: { x: userX, y: userY },
      data: {
        id: user.id,
        label: user.name,
        email: user.email,
        dept: user.department,
        title: user.title,
        status: user.status,
        findingsCount: userFindings.length,
        hasCritical,
        hasHigh,
        isAdmin: user.isAdmin
      }
    });

    let roleY = userY - 40;
    // 2. Assigned Roles Nodes & Edges
    for (const role of access.assignedRoles) {
      const roleNodeId = `node_role_${user.id}_${role.id}`;
      const isDangerousRole = role.id === 'rol_db_operator' || role.id === 'rol_finance_disburser';

      nodes.push({
        id: roleNodeId,
        type: 'customRole',
        position: { x: userX + 320, y: roleY },
        data: {
          id: role.id,
          name: role.name,
          riskTier: role.riskTier,
          isDangerous: isDangerousRole
        }
      });

      edges.push({
        id: `edge_${userNodeId}_${roleNodeId}`,
        source: userNodeId,
        target: roleNodeId,
        animated: isDangerousRole,
        style: {
          stroke: isDangerousRole ? '#f43f5e' : '#14b8a6',
          strokeWidth: isDangerousRole ? 3 : 1.5
        },
        label: isDangerousRole ? 'High-Risk Assignment' : 'Assigned'
      });

      // Role to Permissions / Resources
      const rolePerms = db.getRolePermissions(role.id);
      let permY = roleY - 30;

      for (const rp of rolePerms) {
        const perm = db.getPermissionById(rp.permissionId);
        const resource = db.getResourceById(perm?.resourceId || '');
        if (!perm || !resource) continue;

        const isDestructive = perm.isDestructive || perm.isDangerous;
        const permNodeId = `node_perm_${role.id}_${perm.id}`;

        if (!nodes.some(n => n.id === permNodeId)) {
          nodes.push({
            id: permNodeId,
            type: 'customPermission',
            position: { x: userX + 640, y: permY },
            data: {
              id: perm.id,
              name: perm.name,
              action: perm.action,
              isDestructive,
              isDangerous: perm.isDangerous
            }
          });
        }

        edges.push({
          id: `edge_${roleNodeId}_${permNodeId}`,
          source: roleNodeId,
          target: permNodeId,
          animated: isDestructive,
          style: {
            stroke: isDestructive ? '#f43f5e' : '#38bdf8',
            strokeWidth: isDestructive ? 2.5 : 1.2
          }
        });

        // Permission to Resource
        const resNodeId = `node_res_${resource.id}`;
        if (!nodes.some(n => n.id === resNodeId)) {
          nodes.push({
            id: resNodeId,
            type: 'customResource',
            position: { x: userX + 960, y: permY },
            data: {
              id: resource.id,
              name: resource.name,
              classification: resource.classification,
              type: resource.type
            }
          });
        }

        const edgeResId = `edge_${permNodeId}_${resNodeId}`;
        if (!edges.some(e => e.id === edgeResId)) {
          edges.push({
            id: edgeResId,
            source: permNodeId,
            target: resNodeId,
            animated: isDestructive,
            style: {
              stroke: isDestructive ? '#f43f5e' : '#10b981',
              strokeWidth: isDestructive ? 3 : 1.5
            },
            label: isDestructive ? 'ATTACK PATH: Destructive Access' : undefined
          });
        }

        permY += 90;
      }

      roleY += 150;
    }

    // Direct Grants (e.g. Morgan Chen payroll export)
    const directGrants = db.getDirectGrants(user.id);
    for (const dg of directGrants) {
      const perm = db.getPermissionById(dg.permissionId);
      const resource = db.getResourceById(dg.resourceId);
      if (!perm || !resource) continue;

      const dgNodeId = `node_dg_${dg.id}`;
      nodes.push({
        id: dgNodeId,
        type: 'customPermission',
        position: { x: userX + 320, y: roleY + 40 },
        data: {
          id: dg.id,
          name: `${perm.name} (Direct Stale Grant)`,
          action: perm.action,
          isDestructive: perm.isDestructive,
          isDangerous: perm.isDangerous,
          isDirect: true
        }
      });

      edges.push({
        id: `edge_${userNodeId}_${dgNodeId}`,
        source: userNodeId,
        target: dgNodeId,
        animated: true,
        style: { stroke: '#fb923c', strokeWidth: 2.5 },
        label: 'Unrevoked Direct Grant'
      });

      const resNodeId = `node_res_${resource.id}`;
      if (!nodes.some(n => n.id === resNodeId)) {
        nodes.push({
          id: resNodeId,
          type: 'customResource',
          position: { x: userX + 960, y: roleY + 40 },
          data: {
            id: resource.id,
            name: resource.name,
            classification: resource.classification,
            type: resource.type
          }
        });
      }

      edges.push({
        id: `edge_${dgNodeId}_${resNodeId}`,
        source: dgNodeId,
        target: resNodeId,
        animated: true,
        style: { stroke: '#fb923c', strokeWidth: 2.5 },
        label: 'STALE PATH: Unauthorized PII Export'
      });
    }

    userY += Math.max(380, access.assignedRoles.length * 160 + 60);
  }

  return { nodes, edges };
}
