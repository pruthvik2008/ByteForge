/**
 * Team Byteforge (CBC090) Project Information & Presentation Overview
 * Global Academy of Technology - CBC 2.0 Hackathon
 */

import React from 'react';
import {
  Award,
  Shield,
  CheckCircle2,
  Cpu,
  Layers,
  Sparkles,
  ExternalLink,
  Code2
} from 'lucide-react';

export const TeamTab: React.FC = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#111827] via-[#142340] to-[#111827] border border-teal-500/30 shadow-2xl flex flex-wrap items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40">
              Team Byteforge • CBC090
            </span>
            <span className="text-xs text-slate-400">Cybersecurity Domain</span>
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            AccessGuard: Secure Role & Permission Misconfiguration Detector
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Global Academy of Technology • CBC 2.0 Hackathon Submission
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Team ID</span>
            <span className="font-mono font-bold text-teal-300 text-sm">CBC090</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Engine</span>
            <span className="font-mono font-bold text-purple-300 text-sm">v2.4 Explainable</span>
          </div>
        </div>
      </div>

      {/* 4 Demonstration Scenarios Card Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Core Demonstration Scenarios
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Scenario 1 */}
          <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm">Scenario 1: Student Excessive Access</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300">
                Critical
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Alex Rivera holds standard undergraduate student status while simultaneously assigned Database Operator privileges, conferring unrestricted production DROP TABLE privileges.
            </p>
            <div className="text-[11px] text-teal-400 font-mono">
              Tested: Verified remediation removes role assignment and drops risk score.
            </div>
          </div>

          {/* Scenario 2 */}
          <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm">Scenario 2: Finance SoD Conflict</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300">
                Critical
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Jordan Taylor simultaneously possesses invoice authorization and outward bank wire disbursement rights on Corporate ERP, breaching SOX 404 segregation of duties.
            </p>
            <div className="text-[11px] text-teal-400 font-mono">
              Tested: Segregation alert explains potential single-operator wire fraud.
            </div>
          </div>

          {/* Scenario 3 */}
          <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm">Scenario 3: Former Role Stale Access</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-300">
                High
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Morgan Chen transferred from DevOps to Analytics, yet an unrevoked direct grant for bulk unencrypted payroll export lingered past the 14-day policy grace period.
            </p>
            <div className="text-[11px] text-teal-400 font-mono">
              Tested: Role history correlates transition date with dormant grant.
            </div>
          </div>

          {/* Scenario 4 */}
          <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm">Scenario 4: Legitimate Administrator</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                Safeguard
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              ByteForge holds broad system admin permissions backed by valid CISO break-glass ticket SEC-AUTH-2026-992. AccessGuard safeguards legitimate administrative access.
            </p>
            <div className="text-[11px] text-teal-400 font-mono">
              Tested: Safeguard prevents automated false-flagging and accidental revocation.
            </div>
          </div>
        </div>
      </div>

      {/* Architecture Highlights */}
      <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Code2 className="w-4 h-4 text-purple-400" />
          <span>Technology Stack & Verification Safeguards</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 font-semibold block mb-1">Frontend & Visualization</span>
            <p className="text-slate-300">
              React SPA with Tailwind CSS, animated motion effects, and interactive React Flow (<code className="text-teal-300">@xyflow/react</code>) attack graphs.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 font-semibold block mb-1">Backend & Analysis Engine</span>
            <p className="text-slate-300">
              Node.js + Express REST API running a 7-rule explainable risk engine with recursive role-inheritance resolution.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 font-semibold block mb-1">Voice Security Copilot</span>
            <p className="text-slate-300">
              Browser Web Speech recognition and SpeechSynthesis, with read-only voice commands and authenticated remediation confirmations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
