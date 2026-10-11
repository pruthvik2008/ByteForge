/**
 * AccessGuard API Service
 * Team Byteforge (CBC090)
 */

import {
  DashboardSummary,
  User,
  UserEffectiveAccess,
  Role,
  Permission,
  Resource,
  Finding,
  AuditLog,
  SimulationResult
} from '../types';

export const api = {
  // Dashboard Overview
  async getDashboard(): Promise<{
    summary: DashboardSummary;
    recentRiskyAccess: any[];
    highPriorityActions: any[];
    recentAuditLogs: AuditLog[];
    encryptionStatus: any;
  }> {
    const res = await fetch('/api/dashboard');
    if (!res.ok) throw new Error('Failed to load dashboard metrics');
    return res.json();
  },

  // Users
  async getUsers(): Promise<User[]> {
    const res = await fetch('/api/users');
    if (!res.ok) throw new Error('Failed to load users');
    const data = await res.json();
    return data.users;
  },

  async getUserAccess(id: string): Promise<UserEffectiveAccess> {
    const res = await fetch(`/api/users/${id}/access`);
    if (!res.ok) throw new Error(`Failed to load user access for ${id}`);
    return res.json();
  },

  // Roles & Permissions
  async getRoles(): Promise<{ roles: Role[]; inheritances: any[] }> {
    const res = await fetch('/api/roles');
    if (!res.ok) throw new Error('Failed to load roles');
    return res.json();
  },

  async getPermissions(): Promise<Permission[]> {
    const res = await fetch('/api/permissions');
    if (!res.ok) throw new Error('Failed to load permissions');
    const data = await res.json();
    return data.permissions;
  },

  async getResources(): Promise<Resource[]> {
    const res = await fetch('/api/resources');
    if (!res.ok) throw new Error('Failed to load resources');
    const data = await res.json();
    return data.resources;
  },

  // Findings
  async getFindings(filters?: {
    severity?: string;
    status?: string;
    userId?: string;
    resourceId?: string;
    search?: string;
  }): Promise<Finding[]> {
    const params = new URLSearchParams();
    if (filters?.severity) params.set('severity', filters.severity);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.userId) params.set('userId', filters.userId);
    if (filters?.resourceId) params.set('resourceId', filters.resourceId);
    if (filters?.search) params.set('search', filters.search);

    const res = await fetch(`/api/findings?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to load findings');
    const data = await res.json();
    return data.findings;
  },

  async getFindingById(id: string): Promise<Finding> {
    const res = await fetch(`/api/findings/${id}`);
    if (!res.ok) throw new Error(`Failed to load finding ${id}`);
    const data = await res.json();
    return data.finding;
  },

  async updateFindingStatus(id: string, status: string, reason?: string): Promise<Finding> {
    const res = await fetch(`/api/findings/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reason, reviewer: 'Security Officer' })
    });
    if (!res.ok) throw new Error('Failed to update finding status');
    const data = await res.json();
    return data.finding;
  },

  // Run Analysis Engine
  async runRiskAnalysis(): Promise<{ findings: Finding[]; summary: DashboardSummary }> {
    const res = await fetch('/api/analysis/run', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to run risk analysis engine');
    return res.json();
  },

  // What-If Simulator
  async simulateRemoval(params: {
    userId: string;
    roleIdToRemove?: string;
    grantIdToRemove?: string;
    permissionIdToRemove?: string;
  }): Promise<SimulationResult> {
    const res = await fetch('/api/simulator/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) throw new Error('Simulation failed');
    return res.json();
  },

  // Verified Remediation
  async executeRemediation(params: {
    userId: string;
    roleIdToRemove?: string;
    grantIdToRemove?: string;
    reason: string;
    reviewerName?: string;
  }): Promise<{
    success: boolean;
    actionTaken: string;
    riskReduction: number;
    riskScoreBefore: number;
    riskScoreAfter: number;
    newSummary: DashboardSummary;
  }> {
    const res = await fetch('/api/remediation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) throw new Error('Remediation action failed');
    return res.json();
  },

  // Attack Graph
  async getAttackGraph(userId?: string): Promise<{ nodes: any[]; edges: any[] }> {
    const url = userId ? `/api/graph?userId=${encodeURIComponent(userId)}` : '/api/graph';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load attack graph data');
    return res.json();
  },

  // Voice Copilot
  async queryCopilot(query: string, activeContext?: any): Promise<any> {
    const res = await fetch('/api/copilot/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, activeContext })
    });
    if (!res.ok) throw new Error('Failed to communicate with copilot');
    return res.json();
  },

  // Audit Logs & Cryptography
  async getAuditLogs(): Promise<AuditLog[]> {
    const res = await fetch('/api/audit-logs');
    if (!res.ok) throw new Error('Failed to load audit logs');
    const data = await res.json();
    return data.auditLogs;
  },

  async getEncryptionStatus(): Promise<any> {
    const res = await fetch('/api/encryption/status');
    if (!res.ok) throw new Error('Failed to load encryption status');
    return res.json();
  },

  // Import & Reset
  async importData(payload: any): Promise<any> {
    const res = await fetch('/api/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.errors?.join(', ') || 'Import failed');
    }
    return res.json();
  },

  async resetDataset(): Promise<{ success: boolean; summary: DashboardSummary }> {
    const res = await fetch('/api/dataset/reset', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset dataset');
    return res.json();
  }
};
