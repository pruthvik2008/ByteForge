/**
 * AccessGuard Sidebar Navigation
 * Team Byteforge (CBC090)
 */

import React from 'react';
import {
  ShieldAlert,
  LayoutDashboard,
  Users,
  GitBranch,
  Network,
  AlertTriangle,
  FlaskConical,
  Lock,
  History,
  UploadCloud,
  Award,
  ShieldCheck,
  Cpu
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  isNew?: boolean;
  badge?: number;
  badgeColor?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openFindingsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  openFindingsCount
}) => {
  const navSections: NavSection[] = [
    {
      title: 'General',
      items: [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'users', label: 'Users & Roles', icon: Users },
        { id: 'access-map', label: 'Effective Access Map', icon: GitBranch },
        { id: 'attack-intel', label: 'Attack Intelligence', icon: Network, isNew: true }
      ]
    },
    {
      title: 'Security & Remediation',
      items: [
        {
          id: 'findings',
          label: 'Risk Findings',
          icon: AlertTriangle,
          badge: openFindingsCount > 0 ? openFindingsCount : undefined,
          badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
        },
        { id: 'simulator', label: 'What-If Simulator', icon: FlaskConical },
        { id: 'cryptography', label: 'E2E Encryption', icon: Lock },
        { id: 'audit-logs', label: 'Audit Trail', icon: History }
      ]
    },
    {
      title: 'System & Benchmark',
      items: [
        { id: 'import', label: 'Import Access Data', icon: UploadCloud },
        { id: 'team', label: 'Team Byteforge', icon: Award }
      ]
    }
  ];

  return (
    <aside className="w-64 bg-[#0d1322] border-r border-slate-800/80 flex flex-col h-screen select-none shrink-0 z-30">
      {/* Brand Header */}
      <div className="p-5 flex items-center gap-3 border-b border-slate-800/60">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
          <ShieldAlert className="w-6 h-6 text-slate-950 stroke-[2.5]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-lg tracking-tight text-white">Access<span className="text-teal-400">Guard</span></span>
          </div>
          <div className="text-[10px] font-medium text-slate-400 flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Byteforge • CBC090</span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navSections.map((section, sIdx) => (
          <div key={sIdx}>
            <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              {section.title}
            </div>
            <div className="space-y-1">
              {section.items.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-teal-500/20 to-teal-500/5 text-teal-300 border border-teal-500/30 shadow-sm shadow-teal-500/10'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.isNew && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-wide">
                          Graph
                        </span>
                      )}
                      {item.badge !== undefined && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Safeguards Card */}
      <div className="p-4 border-t border-slate-800/60 bg-[#0a0f1d]">
        <div className="p-3 rounded-xl bg-gradient-to-b from-slate-900 to-[#10182b] border border-slate-800">
          <div className="flex items-center gap-2 mb-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-slate-200">Safeguards Active</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Admin break-glass access safeguarded. Destructive operations require authenticated confirmation.
          </p>
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <Cpu className="w-3 h-3 text-teal-400" /> Engine v2.4
            </span>
            <span className="text-emerald-400 font-mono">SOX/GDPR Ready</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
