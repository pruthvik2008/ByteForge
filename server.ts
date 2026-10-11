/**
 * AccessGuard Backend Server & REST API
 * Developed by Team Byteforge (CBC090)
 * Mounts Express API routes, runs Vite middleware in dev, and enforces security safeguards.
 */

import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { db } from './server/db.js';
import {
  runRiskAnalysis,
  computeUserEffectiveAccess,
  simulatePermissionRemoval,
  buildAttackIntelligenceGraph
} from './server/analysisEngine.js';
import { processCopilotQuery } from './server/copilotEngine.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '10mb' }));

// Initial analysis run to hydrate baseline findings
runRiskAnalysis();

// ============================================================================
// REST API ENDPOINTS
// ============================================================================

// 1. Dashboard Overview
app.get('/api/dashboard', (_req: Request, res: Response) => {
  const analysis = runRiskAnalysis();
  const auditLogs = db.getAuditLogs().slice(0, 5);
  const users = db.getUsers();

  const recentRiskyAccess = analysis.findings
    .filter(f => f.reviewStatus !== 'Resolved')
    .slice(0, 5)
    .map(f => {
      const user = users.find(u => u.id === f.userId);
      return {
        id: f.id,
        user: user?.name || f.userId,
        department: user?.department || 'Unknown',
        title: f.title,
        severity: f.severity,
        resource: f.affectedResourceId,
        createdAt: f.createdAt
      };
    });

  const highPriorityActions = analysis.findings
    .filter(f => (f.severity === 'CRITICAL' || f.severity === 'HIGH') && f.reviewStatus === 'Open')
    .slice(0, 4)
    .map(f => ({
      findingId: f.id,
      title: f.title,
      user: users.find(u => u.id === f.userId)?.name || f.userId,
      action: f.recommendedFix,
      severity: f.severity
    }));

  res.json({
    summary: analysis.summary,
    recentRiskyAccess,
    highPriorityActions,
    recentAuditLogs: auditLogs,
    encryptionStatus: db.getEncryptionDetails()
  });
});

// 2. Users & Effective Access
app.get('/api/users', (_req: Request, res: Response) => {
  const users = db.getUsers();
  const findings = db.getFindings();

  const userList = users.map(user => {
    const access = computeUserEffectiveAccess(user.id);
    const userFindings = findings.filter(f => f.userId === user.id && f.reviewStatus !== 'Resolved');
    return {
      ...user,
      assignedRoles: access?.assignedRoles || [],
      inheritedRoles: access?.inheritedRoles || [],
      directGrantsCount: access?.directGrantsCount || 0,
      effectivePermissionsCount: access?.effectivePermissions.length || 0,
      associatedFindingsCount: userFindings.length,
      highestSeverity: access?.highestSeverity || 'SECURE'
    };
  });

  res.json({ users: userList });
});

app.get('/api/users/:id/access', (req: Request, res: Response) => {
  const access = computeUserEffectiveAccess(req.params.id);
  if (!access) {
    return res.status(404).json({ error: 'User not found' });
  }
  const findings = db.getFindings().filter(f => f.userId === req.params.id);
  res.json({ ...access, findings });
});

// 3. Roles, Permissions, Resources
app.get('/api/roles', (_req: Request, res: Response) => {
  const roles = db.getRoles();
  const userRoles = db.getUserRoles();
  const rolePerms = db.getRolePermissions();

  const enrichedRoles = roles.map(r => ({
    ...r,
    assignedUsersCount: userRoles.filter(ur => ur.roleId === r.id).length,
    permissionsCount: rolePerms.filter(rp => rp.roleId === r.id).length
  }));

  res.json({ roles: enrichedRoles, inheritances: db.getRoleInheritances() });
});

app.get('/api/permissions', (_req: Request, res: Response) => {
  res.json({ permissions: db.getPermissions() });
});

app.get('/api/resources', (_req: Request, res: Response) => {
  const resources = db.getResources();
  const findings = db.getFindings();

  const enriched = resources.map(resItem => {
    const resFindings = findings.filter(f => f.affectedResourceId === resItem.id && f.reviewStatus !== 'Resolved');
    return {
      ...resItem,
      openFindingsCount: resFindings.length,
      highestSeverity: resFindings.some(f => f.severity === 'CRITICAL')
        ? 'CRITICAL'
        : resFindings.some(f => f.severity === 'HIGH')
        ? 'HIGH'
        : resFindings.length > 0
        ? 'MEDIUM'
        : 'SECURE'
    };
  });

  res.json({ resources: enriched });
});

// 4. Run Risk Analysis Engine
app.post('/api/analysis/run', (_req: Request, res: Response) => {
  const result = runRiskAnalysis();
  db.addAuditLog({
    action: 'ANALYSIS_RUN',
    targetUserId: 'ALL',
    actorId: 'admin_session',
    actorName: 'Authorized Security Reviewer',
    reason: 'Manual execution of AccessGuard 7-Rule Risk Engine',
    verified: true,
    riskScoreAfter: result.summary.riskScore
  });
  res.json(result);
});

// 5. Findings
app.get('/api/findings', (req: Request, res: Response) => {
  let findings = db.getFindings();
  const { severity, status, userId, resourceId, search } = req.query;

  if (severity) findings = findings.filter(f => f.severity === severity);
  if (status) findings = findings.filter(f => f.reviewStatus === status);
  if (userId) findings = findings.filter(f => f.userId === userId);
  if (resourceId) findings = findings.filter(f => f.affectedResourceId === resourceId);
  if (search && typeof search === 'string') {
    const s = search.toLowerCase();
    findings = findings.filter(f =>
      f.title.toLowerCase().includes(s) ||
      f.description.toLowerCase().includes(s) ||
      f.userId.toLowerCase().includes(s)
    );
  }

  res.json({ findings });
});

app.get('/api/findings/:id', (req: Request, res: Response) => {
  const finding = db.getFindingById(req.params.id);
  if (!finding) return res.status(404).json({ error: 'Finding not found' });
  res.json({ finding });
});

app.patch('/api/findings/:id/status', (req: Request, res: Response) => {
  const { status, reason, reviewer } = req.body;
  if (!status) return res.status(400).json({ error: 'Status is required' });

  const updated = db.updateFindingStatus(req.params.id, status);
  if (!updated) return res.status(404).json({ error: 'Finding not found' });

  db.addAuditLog({
    action: 'POLICY_OVERRIDE',
    targetUserId: updated.userId,
    actorId: reviewer || 'admin_session',
    actorName: reviewer || 'Security Officer',
    reason: reason || `Updated finding ${updated.id} status to ${status}`,
    verified: true
  });

  res.json({ finding: updated });
});

// 6. What-If Simulation
app.post('/api/simulator/simulate', (req: Request, res: Response) => {
  const { userId, roleIdToRemove, grantIdToRemove, permissionIdToRemove } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  const result = simulatePermissionRemoval({
    userId,
    roleIdToRemove,
    grantIdToRemove,
    permissionIdToRemove
  });

  res.json(result);
});

// 7. Verified Remediation
app.post('/api/remediation', (req: Request, res: Response) => {
  const { userId, roleIdToRemove, grantIdToRemove, reason, reviewerName } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  const initialAnalysis = runRiskAnalysis();
  const riskScoreBefore = initialAnalysis.summary.riskScore;

  let success = false;
  let actionTaken = '';

  if (roleIdToRemove) {
    success = db.removeUserRole(userId, roleIdToRemove);
    actionTaken = `Revoked assigned role '${roleIdToRemove}' from user '${userId}'`;
  } else if (grantIdToRemove) {
    success = db.revokeDirectGrant(grantIdToRemove);
    actionTaken = `Decommissioned direct grant '${grantIdToRemove}' from user '${userId}'`;
  }

  if (!success) {
    return res.status(400).json({ error: 'Failed to find and remove requested grant or role.' });
  }

  // Recalculate access and re-run analysis
  const updatedAnalysis = runRiskAnalysis();
  const riskScoreAfter = updatedAnalysis.summary.riskScore;

  // Add audit log
  const auditLog = db.addAuditLog({
    action: roleIdToRemove ? 'REMOVE_ROLE' : 'REVOKE_GRANT',
    targetUserId: userId,
    targetRoleId: roleIdToRemove,
    targetGrantId: grantIdToRemove,
    actorId: 'auth_admin_user',
    actorName: reviewerName || 'Security Admin (ByteForge)',
    reason: reason || 'Remediated risky misconfiguration identified by AccessGuard engine',
    riskScoreBefore,
    riskScoreAfter,
    verified: true
  });

  res.json({
    success: true,
    actionTaken,
    auditLog,
    riskScoreBefore,
    riskScoreAfter,
    riskReduction: riskScoreBefore - riskScoreAfter,
    newSummary: updatedAnalysis.summary
  });
});

// 8. Attack Intelligence Graph Data for React Flow
app.get('/api/graph', (req: Request, res: Response) => {
  const filterUserId = req.query.userId as string | undefined;
  const graph = buildAttackIntelligenceGraph(filterUserId);
  res.json(graph);
});

// 9. Voice Security Copilot Query
app.post('/api/copilot/query', async (req: Request, res: Response) => {
  const { query, activeContext } = req.body;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Valid query text is required' });
  }

  try {
    const copilotResult = await processCopilotQuery(query, activeContext);
    res.json(copilotResult);
  } catch (err: any) {
    console.error('Copilot processing error:', err);
    res.status(500).json({
      answerText: 'An error occurred while evaluating your security request.',
      speechText: 'An internal error occurred while analyzing the security database.',
      intent: 'ERROR',
      confidence: 0
    });
  }
});

// 10. Audit Logs & Encryption Status
app.get('/api/audit-logs', (_req: Request, res: Response) => {
  res.json({ auditLogs: db.getAuditLogs() });
});

app.get('/api/encryption/status', (_req: Request, res: Response) => {
  res.json(db.getEncryptionDetails());
});

// 11. Dataset Import & Reset
app.post('/api/import', (req: Request, res: Response) => {
  const result = db.importDataset(req.body);
  if (!result.success) {
    return res.status(400).json(result);
  }
  const analysis = runRiskAnalysis();
  res.json({ ...result, updatedSummary: analysis.summary });
});

app.post('/api/dataset/reset', (_req: Request, res: Response) => {
  db.resetToSeed();
  const analysis = runRiskAnalysis();
  db.addAuditLog({
    action: 'POLICY_OVERRIDE',
    targetUserId: 'ALL',
    actorId: 'admin_demo',
    actorName: 'Demo Orchestrator',
    reason: 'Reset AccessGuard database to default synthetic benchmark scenarios',
    verified: true,
    riskScoreAfter: analysis.summary.riskScore
  });
  res.json({ success: true, summary: analysis.summary });
});

// ============================================================================
// VITE DEV SERVER / STATIC SERVING
// ============================================================================

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AccessGuard] Backend running on http://0.0.0.0:${PORT}`);
    console.log(`[AccessGuard] Developed by Team Byteforge (CBC090) - Global Academy of Technology`);
  });
}

startServer();
