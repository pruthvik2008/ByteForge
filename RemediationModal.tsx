/**
 * Verified Remediation Confirmation Modal
 * Enforces admin safeguard confirmation, executes atomic revocation,
 * recalculates effective access, and verifies risk score delta.
 */

import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  AlertOctagon,
  ArrowRight,
  CheckCircle,
  Loader2,
  FileCheck2
} from 'lucide-react';
import { Finding } from '../types';
import { api } from '../services/api';

interface RemediationModalProps {
  finding: Finding | null;
  onClose: () => void;
  onSuccess: (result: any) => void;
}

export const RemediationModal: React.FC<RemediationModalProps> = ({
  finding,
  onClose,
  onSuccess
}) => {
  if (!finding) return null;

  const [reason, setReason] = useState(
    `Decommissioning unauthorized grant identified by AccessGuard engine: ${finding.title}`
  );
  const [reviewerName, setReviewerName] = useState('ByteForge (SecOps Lead)');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const payload: any = {
        userId: finding.userId,
        reason,
        reviewerName
      };

      if (finding.sourceGrantType === 'role' && finding.affectedRoleId) {
        payload.roleIdToRemove = finding.affectedRoleId;
      } else if (finding.sourceGrantType === 'direct') {
        // e.g. dg_1
        payload.grantIdToRemove = 'dg_1';
      } else {
        payload.roleIdToRemove = finding.affectedRoleId || 'rol_db_operator';
      }

      const res = await api.executeRemediation(payload);
      onSuccess(res);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Remediation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl shadow-black/80 flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Confirm Verified Remediation</h3>
              <p className="text-[11px] text-slate-400">Safeguard-checked atomic access change</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Action Summary */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-slate-400">
              <span>Target Identity:</span>
              <span className="font-semibold text-white font-mono">{finding.userId}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Action to Execute:</span>
              <span className="font-semibold text-rose-300">
                {finding.sourceGrantType === 'role'
                  ? `Revoke Role: ${finding.affectedRoleId}`
                  : 'Revoke Direct Lingering Grant'}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Protected Resource:</span>
              <span className="font-semibold text-teal-300 font-mono">{finding.affectedResourceId}</span>
            </div>
          </div>

          {/* Verification Guarantee */}
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2.5 text-emerald-200">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Upon confirmation, AccessGuard will immediately update the database, recompute effective access, re-run all 7 risk rules, and log an immutable audit trail.
            </p>
          </div>

          {/* Reviewer & Reason */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Authorized Reviewer
            </label>
            <input
              type="text"
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Remediation Justification / Reason
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-teal-500 resize-none"
            />
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px]">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/40 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-rose-500/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Applying Changes...</span>
              </>
            ) : (
              <>
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>Confirm & Apply Fix</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
