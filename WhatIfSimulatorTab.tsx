/**
 * AccessGuard What-If Permission Simulator
 * Previews the impact of permission and role removal without touching live production data.
 * Checks administrative safeguards, alternative paths, and provides verified before/after deltas.
 */

import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Play,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  TrendingDown,
  Layers,
  Wrench
} from 'lucide-react';
import { api } from '../services/api';
import { User, SimulationResult } from '../types';

interface WhatIfSimulatorTabProps {
  initialUserId?: string;
  onOpenRemediationModal?: (finding: any) => void;
}

export const WhatIfSimulatorTab: React.FC<WhatIfSimulatorTabProps> = ({
  initialUserId,
  onOpenRemediationModal
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>(initialUserId || 'usr_101');
  const [userRoles, setUserRoles] = useState<any[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('rol_db_operator');
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      updateUserRoles(selectedUserId);
    }
  }, [selectedUserId, users]);

  const loadUsers = async () => {
    try {
      const list = await api.getUsers();
      setUsers(list);
    } catch (err) {
      console.error(err);
    }
  };

  const updateUserRoles = (uid: string) => {
    const user = users.find(u => u.id === uid);
    if (user && user.assignedRoles) {
      setUserRoles(user.assignedRoles);
      if (user.assignedRoles.length > 0) {
        setSelectedRoleId(user.assignedRoles[0].id);
      }
    }
  };

  const runSimulation = async () => {
    if (!selectedUserId) return;
    setSimulating(true);
    try {
      const res = await api.simulateRemoval({
        userId: selectedUserId,
        roleIdToRemove: selectedRoleId
      });
      setSimulationResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-purple-400" />
          <span>What-If Permission Simulator Workbench</span>
        </h2>
        <p className="text-xs text-slate-400">
          Simulate de-provisioning and role modifications in isolation. Preview risk reduction and verify administrator safeguards before committing changes.
        </p>
      </div>

      {/* Simulator Config Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Controls Card */}
        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-400" />
            <span>Select Simulation Target</span>
          </h3>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Enterprise Identity
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500 font-semibold"
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.department})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Assigned Role to Simulate Revoking
            </label>
            <select
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            >
              {userRoles.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.riskTier} risk)
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2">
            <button
              onClick={runSimulation}
              disabled={simulating}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-bold text-xs shadow-lg shadow-purple-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Play className={`w-3.5 h-3.5 fill-current ${simulating ? 'animate-spin' : ''}`} />
              <span>{simulating ? 'Computing What-If Impact...' : 'Run Simulation'}</span>
            </button>
          </div>
        </div>

        {/* Safeguard & Isolation Guarantee */}
        <div className="md:col-span-2 p-5 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Zero-Impact Sandbox Execution</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Simulations run entirely in memory against an isolated clone of the access database. No production credentials, PostgreSQL records, or IAM policies will be modified until an authorized administrator explicitly executes the change in the authenticated confirmation workflow.
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Disruption Guard</span>
                <span className="text-teal-300 font-semibold">Validates continuous access to vital systems</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Admin Protection</span>
                <span className="text-purple-300 font-semibold">Prevents accidental orphan root lockout</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Powered by AccessGuard Graph Engine</span>
            <span className="font-mono text-emerald-400">Sandbox Active</span>
          </div>
        </div>
      </div>

      {/* Simulation Result Presentation */}
      {simulationResult && (
        <div className="p-6 rounded-2xl bg-gradient-to-b from-[#111827] to-[#0f172a] border border-slate-800 shadow-2xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                What-If Simulation Results
              </span>
              <h3 className="text-base font-bold text-white mt-1">
                Projected Impact: Removing <span className="text-teal-400">{simulationResult.targetItem}</span> from <span className="text-white">{simulationResult.userName}</span>
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-emerald-400 font-mono">
                ↓ {simulationResult.riskReductionPercent}%
              </span>
              <span className="text-xs text-slate-400">Risk Reduction</span>
            </div>
          </div>

          {/* Safeguard Warning if triggered */}
          {simulationResult.isSafeguardTriggered ? (
            <div className="p-4 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{simulationResult.safeguardWarning}</span>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Safeguard check passed: Core administrator resilience and valid user dependencies preserved.</span>
            </div>
          )}

          {/* Before & After Metrics Comparison */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Risk Score */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Risk Score</span>
              <div className="flex items-center gap-2 text-lg font-mono font-bold">
                <span className="text-rose-400">{simulationResult.metricsBefore.riskScore}</span>
                <ArrowRight className="w-4 h-4 text-slate-600" />
                <span className="text-emerald-400">{simulationResult.metricsAfter.riskScore}</span>
              </div>
            </div>

            {/* Critical Findings */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Critical Findings</span>
              <div className="flex items-center gap-2 text-lg font-mono font-bold">
                <span className="text-rose-400">{simulationResult.metricsBefore.criticalFindings}</span>
                <ArrowRight className="w-4 h-4 text-slate-600" />
                <span className="text-emerald-400">{simulationResult.metricsAfter.criticalFindings}</span>
              </div>
            </div>

            {/* High Findings */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">High-Risk Findings</span>
              <div className="flex items-center gap-2 text-lg font-mono font-bold">
                <span className="text-orange-400">{simulationResult.metricsBefore.highFindings}</span>
                <ArrowRight className="w-4 h-4 text-slate-600" />
                <span className="text-emerald-400">{simulationResult.metricsAfter.highFindings}</span>
              </div>
            </div>

            {/* Open Findings */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Total Open</span>
              <div className="flex items-center gap-2 text-lg font-mono font-bold">
                <span className="text-slate-300">{simulationResult.metricsBefore.openFindings}</span>
                <ArrowRight className="w-4 h-4 text-slate-600" />
                <span className="text-emerald-400">{simulationResult.metricsAfter.openFindings}</span>
              </div>
            </div>
          </div>

          {/* Action Trigger */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Recommendation: {simulationResult.recommendedAction}
            </span>

            {onOpenRemediationModal && !simulationResult.isSafeguardTriggered && (
              <button
                onClick={() =>
                  onOpenRemediationModal({
                    userId: simulationResult.userId,
                    affectedRoleId: simulationResult.targetItem,
                    sourceGrantType: 'role',
                    title: `Decommission ${simulationResult.targetItem} from ${simulationResult.userName}`
                  })
                }
                className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-teal-500/20"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Apply This Remediation Now</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
