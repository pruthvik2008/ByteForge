/**
 * Explainable Security Findings: "Why Is This Risky?" Modal
 * Clearly explains what is wrong, why it is risky, affected identity, exposed resource,
 * exact permission path, technical evidence, potential impact, and recommended remediation.
 */

import React from 'react';
import {
  X,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Lock,
  Layers,
  HelpCircle,
  MessageSquare,
  Wrench,
  ShieldCheck
} from 'lucide-react';
import { Finding } from '../types';

interface WhyIsThisRiskyModalProps {
  finding: Finding | null;
  onClose: () => void;
  onRemediate: (finding: Finding) => void;
  onAskCopilot: (finding: Finding) => void;
}

export const WhyIsThisRiskyModal: React.FC<WhyIsThisRiskyModalProps> = ({
  finding,
  onClose,
  onRemediate,
  onAskCopilot
}) => {
  if (!finding) return null;

  const getSeverityStyle = (s: string) => {
    switch (s) {
      case 'CRITICAL':
        return {
          bg: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
          dot: 'bg-rose-500',
          titleColor: 'text-rose-400'
        };
      case 'HIGH':
        return {
          bg: 'bg-orange-500/10 text-orange-300 border-orange-500/30',
          dot: 'bg-orange-500',
          titleColor: 'text-orange-400'
        };
      case 'MEDIUM':
        return {
          bg: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
          dot: 'bg-amber-500',
          titleColor: 'text-amber-400'
        };
      default:
        return {
          bg: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
          dot: 'bg-blue-500',
          titleColor: 'text-blue-400'
        };
    }
  };

  const sev = getSeverityStyle(finding.severity);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-black/80 flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-start justify-between">
          <div className="flex items-start gap-3.5">
            <div className={`p-2.5 rounded-xl border ${sev.bg} shrink-0`}>
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${sev.bg}`}>
                  {finding.severity}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {finding.id}
                </span>
                {finding.isApprovedAdmin && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Legitimate Admin Safeguard
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {finding.title}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs text-slate-300 flex-1">
          {/* Plain Language Explanation */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center gap-2 text-teal-400 font-bold mb-1.5 text-xs">
              <HelpCircle className="w-4 h-4" />
              <span>What Is Happening? (Plain Language Explanation)</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-sm">
              {finding.description}
            </p>
          </div>

          {/* Exact Permission Path Trace */}
          <div>
            <div className="flex items-center gap-2 text-slate-300 font-semibold mb-2">
              <Layers className="w-4 h-4 text-purple-400" />
              <span>Exact Permission Path (User → Role → Permission → Resource)</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#090d16] border border-slate-800 font-mono text-[11px] overflow-x-auto">
              <div className="flex items-center gap-2 text-slate-400 flex-wrap">
                {finding.permissionPath.path.map((step, idx) => (
                  <React.Fragment key={idx}>
                    <span className="px-2.5 py-1 rounded bg-slate-800/80 text-teal-300 border border-slate-700/60 font-semibold">
                      {step}
                    </span>
                    {idx < finding.permissionPath.path.length - 1 && (
                      <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* Technical Evidence & Policy */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-slate-400 font-semibold mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Supporting Evidence</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                {finding.evidence}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-slate-400 font-semibold mb-1 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>Potential Security Impact</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                {finding.potentialImpact}
              </p>
            </div>
          </div>

          {/* Recommended Least-Privilege Remediation */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/30 to-teal-950/20 border border-teal-500/30">
            <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Recommended Least-Privilege Remediation</span>
            </div>
            <p className="text-slate-200 leading-relaxed mb-3">
              {finding.recommendedFix}
            </p>
            <div className="text-[11px] text-slate-400">
              Target Resource: <span className="font-mono text-teal-300 font-semibold">{finding.affectedResourceId}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer with Actions */}
        <div className="p-5 border-t border-slate-800 bg-slate-900/50 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => {
              onClose();
              onAskCopilot(finding);
            }}
            className="px-3.5 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-semibold flex items-center gap-2 transition-all"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Ask Copilot About This Finding</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Close
            </button>
            {finding.reviewStatus !== 'Resolved' && !finding.isApprovedAdmin && (
              <button
                onClick={() => {
                  onClose();
                  onRemediate(finding);
                }}
                className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-teal-500/20 active:scale-95 transition-all"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Remediate Misconfiguration</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
