/**
 * AccessGuard Top Header Component
 * Matches Figma cybersecurity design with greeting, search, and instant scan execution.
 */

import React from 'react';
import { Search, Play, RefreshCw, Bell, Shield, UserCheck } from 'lucide-react';

interface HeaderProps {
  onRunAnalysis: () => void;
  onResetData: () => void;
  isAnalyzing: boolean;
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  openCopilot: () => void;
  lastScanTime?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onRunAnalysis,
  onResetData,
  isAnalyzing,
  searchTerm,
  setSearchTerm,
  openCopilot,
  lastScanTime
}) => {
  return (
    <header className="h-20 bg-[#0d1322]/80 backdrop-blur-md border-b border-slate-800/80 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Greeting & Subtitle */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-teal-500/30 to-purple-500/30 border border-teal-500/40 flex items-center justify-center text-teal-300 font-bold text-sm">
            BF
          </div>
          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-[#0d1322]"></span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-white tracking-tight">
              Welcome! ByteForge
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <UserCheck className="w-3 h-3" /> SecOps Lead
            </span>
          </div>
          <p className="text-xs text-slate-400 italic">
            &ldquo;Security is a process, not a product.&rdquo;
          </p>
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="flex-1 max-w-md mx-6">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search users, roles, resources, or findings (e.g. Alex, DB, SoD)..."
            className="w-full bg-[#111827] border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/40 transition-all"
          />
        </div>
      </div>

      {/* Actions: Scan, Reset, Voice trigger */}
      <div className="flex items-center gap-3">
        {/* Reset Dataset Button */}
        <button
          onClick={onResetData}
          title="Reset database to default hackathon scenarios"
          className="px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/40 hover:bg-slate-800 border border-slate-700/60 transition-all flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset Demo</span>
        </button>

        {/* Primary Run Risk Analysis Button */}
        <button
          onClick={onRunAnalysis}
          disabled={isAnalyzing}
          className="relative group overflow-hidden px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 hover:shadow-teal-500/35 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <Play className={`w-3.5 h-3.5 fill-current ${isAnalyzing ? 'animate-spin' : ''}`} />
          <span>{isAnalyzing ? 'Analyzing Rules...' : 'Run Risk Analysis'}</span>
        </button>

        {/* Voice Copilot Button */}
        <button
          onClick={openCopilot}
          className="px-3 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
        >
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping"></span>
          <span>Copilot</span>
        </button>
      </div>
    </header>
  );
};
