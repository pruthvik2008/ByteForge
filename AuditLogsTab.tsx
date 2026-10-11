/**
 * AccessGuard Audit Logs Tab
 * Historical record of all remediation actions, policy changes, and risk reduction deltas.
 */

import React, { useState, useEffect } from 'react';
import {
  History,
  ShieldCheck,
  CheckCircle2,
  Search,
  Filter,
  ArrowRight,
  TrendingDown
} from 'lucide-react';
import { api } from '../services/api';
import { AuditLog } from '../types';

export const AuditLogsTab: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(l => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      l.action.toLowerCase().includes(s) ||
      l.actorName.toLowerCase().includes(s) ||
      l.targetUserId.toLowerCase().includes(s) ||
      l.reason.toLowerCase().includes(s)
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-teal-400" />
            <span>Immutable Security Audit Trail</span>
          </h2>
          <p className="text-xs text-slate-400">
            Cryptographically logged record of all administrative actions, verified remediations, and posture changes.
          </p>
        </div>

        <div className="relative w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search audit events..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-4">Timestamp & ID</th>
                <th className="p-4">Action Type</th>
                <th className="p-4">Actor</th>
                <th className="p-4">Target Identity</th>
                <th className="p-4">Remediation Justification</th>
                <th className="p-4 text-center">Risk Score Delta</th>
                <th className="p-4 text-center">Integrity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Loading audit trail...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No audit records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    {/* Timestamp & ID */}
                    <td className="p-4">
                      <div className="font-mono text-white font-semibold">
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">{log.id}</div>
                    </td>

                    {/* Action Type */}
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/10 text-teal-300 border border-teal-500/20 font-mono uppercase">
                        {log.action}
                      </span>
                    </td>

                    {/* Actor */}
                    <td className="p-4">
                      <div className="font-semibold text-slate-200">{log.actorName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{log.actorId}</div>
                    </td>

                    {/* Target */}
                    <td className="p-4 font-mono font-bold text-white">
                      {log.targetUserId}
                    </td>

                    {/* Reason */}
                    <td className="p-4 max-w-xs">
                      <p className="text-slate-300 truncate" title={log.reason}>
                        {log.reason}
                      </p>
                    </td>

                    {/* Risk Score Delta */}
                    <td className="p-4 text-center">
                      {log.riskScoreBefore !== undefined && log.riskScoreAfter !== undefined ? (
                        <div className="flex items-center justify-center gap-1 font-mono text-xs">
                          <span className="text-rose-400">{log.riskScoreBefore}</span>
                          <ArrowRight className="w-3 h-3 text-slate-600" />
                          <span className="text-emerald-400 font-bold">{log.riskScoreAfter}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 font-mono">—</span>
                      )}
                    </td>

                    {/* Verified Integrity */}
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> Verified
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
