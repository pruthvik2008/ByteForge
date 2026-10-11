/**
 * AccessGuard Risk Findings Page
 * Search, filter, inspect "Why Is This Risky?", and execute verified remediation.
 */

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Search,
  Filter,
  ShieldAlert,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  Wrench,
  Clock,
  Layers,
  Key,
  Database
} from 'lucide-react';
import { api } from '../services/api';
import { Finding } from '../types';

interface FindingsTabProps {
  onOpenWhyRisky: (finding: Finding) => void;
  onOpenRemediation: (finding: Finding) => void;
  onAskCopilot: (finding: Finding) => void;
}

export const FindingsTab: React.FC<FindingsTabProps> = ({
  onOpenWhyRisky,
  onOpenRemediation,
  onAskCopilot
}) => {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  useEffect(() => {
    loadFindings();
  }, [selectedSeverity, selectedStatus]);

  const loadFindings = async () => {
    setLoading(true);
    try {
      const data = await api.getFindings({
        severity: selectedSeverity === 'ALL' ? undefined : selectedSeverity,
        status: selectedStatus === 'ALL' ? undefined : selectedStatus
      });
      setFindings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = findings.filter(f => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      f.title.toLowerCase().includes(s) ||
      f.description.toLowerCase().includes(s) ||
      f.userId.toLowerCase().includes(s) ||
      f.affectedResourceId.toLowerCase().includes(s)
    );
  });

  const getSeverityStyle = (s: string) => {
    switch (s) {
      case 'CRITICAL':
        return 'bg-rose-500/10 text-rose-300 border-rose-500/30';
      case 'HIGH':
        return 'bg-orange-500/10 text-orange-300 border-orange-500/30';
      case 'MEDIUM':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      default:
        return 'bg-blue-500/10 text-blue-300 border-blue-500/30';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <span>Security Misconfiguration Findings</span>
          </h2>
          <p className="text-xs text-slate-400">
            Explainable rule-based risk detections, supporting evidence, and verified least-privilege remediation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Severity Filter */}
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Approved_Exception">Approved Exception</option>
          </select>

          {/* Search Box */}
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search findings by user or title..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>
      </div>

      {/* Findings List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Scanning risk database...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No findings matching current filters.</div>
        ) : (
          filtered.map(finding => {
            const isResolved = finding.reviewStatus === 'Resolved';
            const isApproved = finding.isApprovedAdmin;

            return (
              <div
                key={finding.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isResolved
                    ? 'bg-slate-900/40 border-slate-800 opacity-70'
                    : isApproved
                    ? 'bg-emerald-950/10 border-emerald-500/30'
                    : finding.severity === 'CRITICAL'
                    ? 'bg-[#121626] border-rose-500/40 shadow-xl shadow-rose-950/20'
                    : 'bg-[#0f172a] border-slate-800'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getSeverityStyle(finding.severity)}`}>
                        {finding.severity}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">{finding.id}</span>
                      <span className="text-[11px] text-slate-500">•</span>
                      <span className="text-xs font-bold text-teal-300">Target Identity: {finding.userId}</span>
                      {isApproved && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Legitimate Admin Safeguard
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-white tracking-tight">
                      {finding.title}
                    </h3>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                      isResolved
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : isApproved
                        ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                        : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                    }`}
                  >
                    Status: {finding.reviewStatus}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  {finding.description}
                </p>

                {/* Path preview */}
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2 font-mono overflow-x-auto mb-4">
                  <span className="text-slate-500 shrink-0 font-semibold uppercase text-[10px]">Path:</span>
                  <span className="text-teal-300">{finding.permissionPath.path.join(' → ')}</span>
                </div>

                {/* Footer Buttons */}
                <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-400">
                    Protected Asset: <span className="font-mono text-slate-200">{finding.affectedResourceId}</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {/* "Why Is This Risky?" Button */}
                    <button
                      onClick={() => onOpenWhyRisky(finding)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 font-semibold text-xs border border-slate-700 flex items-center gap-1.5 transition-colors"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Why Is This Risky?</span>
                    </button>

                    {/* Ask Copilot */}
                    <button
                      onClick={() => onAskCopilot(finding)}
                      className="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 font-semibold text-xs border border-purple-500/30 flex items-center gap-1.5 transition-colors"
                    >
                      <span>Ask Copilot</span>
                    </button>

                    {/* Remediate Button */}
                    {!isResolved && !isApproved && (
                      <button
                        onClick={() => onOpenRemediation(finding)}
                        className="px-3.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs shadow-md shadow-rose-500/20 flex items-center gap-1.5 active:scale-95 transition-all"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Remediate Access</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
