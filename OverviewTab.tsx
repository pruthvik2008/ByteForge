/**
 * AccessGuard Security Overview Dashboard
 * Figma-inspired cybersecurity SaaS interface matching the reference image.
 */

import React from 'react';
import {
  ShieldAlert,
  Users,
  Layers,
  Key,
  Database,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Activity,
  Lock,
  Play
} from 'lucide-react';
import { DashboardSummary, Finding } from '../types';
import { RiskGauge } from './RiskGauge';

interface OverviewTabProps {
  summary: DashboardSummary | null;
  recentRiskyAccess: any[];
  highPriorityActions: any[];
  onRunAnalysis: () => void;
  isAnalyzing: boolean;
  onOpenFinding: (findingId: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  summary,
  recentRiskyAccess,
  highPriorityActions,
  onRunAnalysis,
  isAnalyzing,
  onOpenFinding,
  onNavigateTab
}) => {
  if (!summary) return null;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Analysis Status */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#111827] via-[#151f38] to-[#111827] border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Access Misconfiguration Detector • Active Baseline
            </h2>
            <p className="text-xs text-slate-400">
              Last automated scan: <span className="font-mono text-teal-300">{new Date(summary.lastScanTimestamp).toLocaleTimeString()}</span> • Continuous SOX / Least-Privilege monitoring
            </p>
          </div>
        </div>

        <button
          onClick={onRunAnalysis}
          disabled={isAnalyzing}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-teal-500/20 active:scale-95 transition-all disabled:opacity-50"
        >
          <Play className={`w-3.5 h-3.5 fill-current ${isAnalyzing ? 'animate-spin' : ''}`} />
          <span>{isAnalyzing ? 'Evaluating 7 Risk Rules...' : 'Re-Run Risk Analysis'}</span>
        </button>
      </div>

      {/* Primary Metrics Grid & Risk Score Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 cols: Metric Cards */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Total Users */}
            <div className="p-4 rounded-2xl bg-[#0f172a] border border-slate-800/90 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Users</span>
                <Users className="w-4 h-4 text-teal-400" />
              </div>
              <div className="text-2xl font-black text-white font-mono">{summary.totalUsers}</div>
              <div className="text-[10px] text-teal-400 mt-1">Monitored Identities</div>
            </div>

            {/* Total Roles */}
            <div className="p-4 rounded-2xl bg-[#0f172a] border border-slate-800/90 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Roles</span>
                <Layers className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-black text-white font-mono">{summary.totalRoles}</div>
              <div className="text-[10px] text-purple-400 mt-1">Hierarchical Definitions</div>
            </div>

            {/* Total Permissions */}
            <div className="p-4 rounded-2xl bg-[#0f172a] border border-slate-800/90 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Permissions</span>
                <Key className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-2xl font-black text-white font-mono">{summary.totalPermissions}</div>
              <div className="text-[10px] text-sky-400 mt-1">Direct & Inherited</div>
            </div>

            {/* Total Resources */}
            <div className="p-4 rounded-2xl bg-[#0f172a] border border-slate-800/90 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Resources</span>
                <Database className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-white font-mono">{summary.totalResources}</div>
              <div className="text-[10px] text-emerald-400 mt-1">Classified Assets</div>
            </div>
          </div>

          {/* Severity Counters & Risk Distribution */}
          <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800/90 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                Active Misconfigurations By Severity
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                {summary.openFindingsCount} Open / {summary.resolvedFindingsCount} Resolved
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Critical */}
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <span className="text-[10px] uppercase font-bold text-rose-400 block mb-1">Critical</span>
                <div className="text-xl font-black text-rose-300 font-mono">{summary.criticalCount}</div>
                <div className="text-[10px] text-rose-400/80 mt-1">DB Drop / Treasury SoD</div>
              </div>

              {/* High */}
              <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
                <span className="text-[10px] uppercase font-bold text-orange-400 block mb-1">High</span>
                <div className="text-xl font-black text-orange-300 font-mono">{summary.highCount}</div>
                <div className="text-[10px] text-orange-400/80 mt-1">Stale Payroll Export</div>
              </div>

              {/* Medium */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-[10px] uppercase font-bold text-amber-400 block mb-1">Medium</span>
                <div className="text-xl font-black text-amber-300 font-mono">{summary.mediumCount}</div>
                <div className="text-[10px] text-amber-400/80 mt-1">Cross-Dept Privilege</div>
              </div>

              {/* Low */}
              <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <span className="text-[10px] uppercase font-bold text-blue-400 block mb-1">Low</span>
                <div className="text-xl font-black text-blue-300 font-mono">{summary.lowCount}</div>
                <div className="text-[10px] text-blue-400/80 mt-1">Audited Admin Grant</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right col: Risk Score Gauge (matching reference image) */}
        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800/90 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-400" />
              Aggregate Risk Score
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">0-1000 Index</span>
          </div>

          <div className="py-4">
            <RiskGauge score={summary.riskScore} tier={summary.riskTier} />
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="flex justify-between text-slate-300">
              <span>Risk Classification:</span>
              <span className="font-bold text-rose-400 font-mono">{summary.riskTier}</span>
            </div>
            <div className="flex justify-between">
              <span>Safeguarded Exceptions:</span>
              <span className="text-emerald-400 font-semibold font-mono">1 Active (SysAdmin)</span>
            </div>
            <div className="flex justify-between">
              <span>Engine Status:</span>
              <span className="text-teal-400 font-mono">Explainable Rule v2.4</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Section: Recently Detected Risky Access & Priority Remediation Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recently Detected Risky Access */}
        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800/90 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                Recently Detected Risky Access
              </h3>
              <button
                onClick={() => onNavigateTab('findings')}
                className="text-xs text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="divide-y divide-slate-800/80">
              {recentRiskyAccess.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => onOpenFinding(item.id)}
                  className="py-3 flex items-center justify-between hover:bg-slate-800/30 px-2 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-200 hover:text-teal-300 transition-colors">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                      <span className="text-white font-medium">{item.user}</span>
                      <span>•</span>
                      <span>{item.department}</span>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      item.severity === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        : item.severity === 'HIGH'
                        ? 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {item.severity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Highest-Priority Remediation Actions */}
        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800/90 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Highest-Priority Remediation Actions
              </h3>
              <button
                onClick={() => onNavigateTab('simulator')}
                className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
              >
                <span>What-If Simulator</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3">
              {highPriorityActions.map((action, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-teal-500/40 transition-all flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{action.user}</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-rose-500/20 text-rose-300">
                        {action.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {action.action}
                    </p>
                  </div>
                  <button
                    onClick={() => onOpenFinding(action.findingId)}
                    className="px-3 py-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30 text-[11px] font-bold shrink-0 transition-colors"
                  >
                    Review
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
