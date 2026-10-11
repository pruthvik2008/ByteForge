/**
 * AccessGuard Users & Roles Component
 * Searchable user directory with detailed effective access drawer.
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  ShieldAlert,
  ArrowRight,
  Layers,
  Key,
  ShieldCheck,
  X,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  Lock
} from 'lucide-react';
import { User, UserEffectiveAccess } from '../types';
import { api } from '../services/api';

interface UsersTabProps {
  onOpenFinding?: (findingId: string) => void;
  onOpenSimulator?: (userId: string) => void;
}

export const UsersTab: React.FC<UsersTabProps> = ({
  onOpenFinding,
  onOpenSimulator
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [selectedUserAccess, setSelectedUserAccess] = useState<UserEffectiveAccess | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = async (user: User) => {
    setDrawerLoading(true);
    try {
      const access = await api.getUserAccess(user.id);
      setSelectedUserAccess(access);
    } catch (err) {
      console.error(err);
    } finally {
      setDrawerLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept =
      selectedDepartment === 'ALL' || user.department === selectedDepartment;

    return matchesSearch && matchesDept;
  });

  const departments = ['ALL', ...Array.from(new Set(users.map(u => u.department)))];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header & Search Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-400" />
            <span>Enterprise Identities & Roles Directory</span>
          </h2>
          <p className="text-xs text-slate-400">
            Map effective permissions, examine role inheritance, and detect excessive accumulation per identity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Department Filter */}
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
          >
            {departments.map(d => (
              <option key={d} value={d}>
                Dept: {d}
              </option>
            ))}
          </select>

          {/* Search Box */}
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search user name or ID..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-4">User ID & Name</th>
                <th className="p-4">Department & Title</th>
                <th className="p-4">Assigned Roles</th>
                <th className="p-4 text-center">Direct Grants</th>
                <th className="p-4 text-center">Effective Perms</th>
                <th className="p-4 text-center">Associated Findings</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Loading enterprise identities...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    onClick={() => handleSelectUser(user)}
                  >
                    {/* User ID & Name */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-teal-300 group-hover:border-teal-500/50 transition-colors">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{user.name}</span>
                            {user.isAdmin && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                Admin
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">{user.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Department & Title */}
                    <td className="p-4">
                      <div className="font-semibold text-slate-200">{user.department}</div>
                      <div className="text-[11px] text-slate-400">{user.title}</div>
                    </td>

                    {/* Assigned Roles */}
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {user.assignedRoles?.map(role => (
                          <span
                            key={role.id}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                              role.id === 'rol_db_operator' || role.id === 'rol_finance_disburser'
                                ? 'bg-rose-500/10 text-rose-300 border-rose-500/30 font-bold'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            {role.name}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Direct Grants */}
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                        (user.directGrantsCount || 0) > 0 ? 'bg-orange-500/20 text-orange-300' : 'text-slate-500'
                      }`}>
                        {user.directGrantsCount || 0}
                      </span>
                    </td>

                    {/* Effective Perms */}
                    <td className="p-4 text-center">
                      <span className="font-mono font-bold text-white">
                        {user.effectivePermissionsCount || 0}
                      </span>
                    </td>

                    {/* Associated Findings */}
                    <td className="p-4 text-center">
                      {(user.associatedFindingsCount || 0) > 0 ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          {user.associatedFindingsCount} Risky
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          Secure
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectUser(user);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-teal-500/20 text-slate-400 hover:text-teal-300 transition-colors"
                        title="Trace Access Map"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Effective Access Detail Drawer / Modal */}
      {selectedUserAccess && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-2xl bg-[#0f172a] border-l border-slate-800 h-full overflow-y-auto p-6 shadow-2xl flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-800 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center font-bold text-teal-300 text-lg">
                    {selectedUserAccess.user.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      {selectedUserAccess.user.name}
                      <span className="text-xs font-normal text-slate-400 font-mono">
                        ({selectedUserAccess.user.id})
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      {selectedUserAccess.user.department} • {selectedUserAccess.user.title}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUserAccess(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Roles & Inheritance Summary */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                    Assigned Roles ({selectedUserAccess.assignedRoles.length})
                  </span>
                  <div className="space-y-1">
                    {selectedUserAccess.assignedRoles.map(r => (
                      <div key={r.id} className="text-xs font-semibold text-teal-300">
                        • {r.name}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                    Inherited Roles ({selectedUserAccess.inheritedRoles.length})
                  </span>
                  <div className="space-y-1">
                    {selectedUserAccess.inheritedRoles.length === 0 ? (
                      <div className="text-xs text-slate-500 italic">None</div>
                    ) : (
                      selectedUserAccess.inheritedRoles.map(r => (
                        <div key={r.id} className="text-xs font-semibold text-purple-300">
                          • {r.name}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Effective Access Trace per Resource */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Key className="w-4 h-4 text-teal-400" />
                  <span>Effective Resource Grants & Provenance Paths</span>
                </h4>

                <div className="space-y-3">
                  {selectedUserAccess.effectivePermissions.map(ep => (
                    <div
                      key={ep.permission.id}
                      className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                        ep.isDestructive || ep.isDangerous
                          ? 'bg-rose-950/20 border-rose-500/40 ring-1 ring-rose-500/20'
                          : 'bg-slate-900/80 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white text-xs">
                            {ep.permission.name}
                          </span>
                          <span className="text-slate-400">→</span>
                          <span className="text-emerald-300 font-semibold">
                            {ep.resource.name}
                          </span>
                        </div>
                        {ep.isApprovedAdmin ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Approved Admin
                          </span>
                        ) : ep.isDestructive ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            Destructive
                          </span>
                        ) : null}
                      </div>

                      {/* Provenance Paths */}
                      <div className="space-y-1 pt-1.5 border-t border-slate-800/80">
                        {ep.sources.map((src, sIdx) => (
                          <div
                            key={sIdx}
                            className="text-[11px] text-slate-400 flex items-center gap-1.5 flex-wrap font-mono"
                          >
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-slate-800 text-slate-300 uppercase">
                              {src.type}
                            </span>
                            <span>Path: {src.path.join(' → ')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="pt-6 border-t border-slate-800 mt-6 flex items-center justify-between">
              {onOpenSimulator && (
                <button
                  onClick={() => {
                    const uid = selectedUserAccess.user.id;
                    setSelectedUserAccess(null);
                    onOpenSimulator(uid);
                  }}
                  className="px-4 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 font-bold text-xs transition-colors"
                >
                  Simulate Remediation on {selectedUserAccess.user.name}
                </button>
              )}

              <button
                onClick={() => setSelectedUserAccess(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs ml-auto"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
