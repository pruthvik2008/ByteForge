/**
 * AccessGuard Effective Access Map
 * Multi-tier visualization: User -> Assigned Roles -> Inherited Roles -> Effective Permissions -> Resources
 * Deduplicates effective permissions while preserving and explaining complete provenance paths.
 */

import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  Layers,
  Key,
  Database,
  Search,
  Filter,
  ShieldAlert,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';
import { User, UserEffectiveAccess, Role, Resource } from '../types';

export const EffectiveAccessMapTab: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('usr_101'); // default to Alex Rivera
  const [selectedResourceId, setSelectedResourceId] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [userAccess, setUserAccess] = useState<UserEffectiveAccess | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMeta();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      loadAccess(selectedUserId);
    }
  }, [selectedUserId]);

  const loadMeta = async () => {
    try {
      const uList = await api.getUsers();
      setUsers(uList);
      const rList = await api.getResources();
      setResources(rList);
      const rolesData = await api.getRoles();
      setRoles(rolesData.roles);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAccess = async (uid: string) => {
    setLoading(true);
    try {
      const data = await api.getUserAccess(uid);
      setUserAccess(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPermissions = userAccess?.effectivePermissions.filter(ep => {
    const matchesResource =
      selectedResourceId === 'ALL' || ep.resource.id === selectedResourceId;
    const matchesSearch =
      ep.permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ep.resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ep.sources.some(s => s.path.some(p => p.toLowerCase().includes(searchTerm.toLowerCase())));
    return matchesResource && matchesSearch;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-teal-400" />
            <span>Effective Access Provenance Map</span>
          </h2>
          <p className="text-xs text-slate-400">
            Multi-tier access resolution: User → Assigned Roles → Inherited Roles → Effective Permissions → Resources.
          </p>
        </div>

        {/* User Selector & Resource Filter */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Identity:</span>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500 font-semibold"
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.department})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Target Asset:</span>
            <select
              value={selectedResourceId}
              onChange={(e) => setSelectedResourceId(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
            >
              <option value="ALL">All Classified Assets</option>
              {resources.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Selected Identity Overview Card */}
      {userAccess && (
        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-300 font-bold text-base">
                {userAccess.user.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">{userAccess.user.name}</h3>
                  <span className="text-xs font-mono text-slate-400">({userAccess.user.id})</span>
                  {userAccess.user.isAdmin && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Enterprise Admin
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  {userAccess.user.department} • {userAccess.user.title} • {userAccess.user.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Assigned Roles</span>
                <span className="font-mono font-bold text-teal-300 text-sm">{userAccess.assignedRoles.length}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Inherited Roles</span>
                <span className="font-mono font-bold text-purple-300 text-sm">{userAccess.inheritedRoles.length}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Direct Grants</span>
                <span className="font-mono font-bold text-orange-300 text-sm">{userAccess.directGrantsCount}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Unique Perms</span>
                <span className="font-mono font-bold text-white text-sm">{userAccess.effectivePermissions.length}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multi-tier Mapping Flow Cards */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Resolving effective permission hierarchy...</div>
      ) : !userAccess || filteredPermissions?.length === 0 ? (
        <div className="p-12 text-center text-slate-400">No effective permissions found matching filter.</div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="font-semibold text-white">
              Resolved Effective Access ({filteredPermissions?.length} Permissions Deduplicated)
            </span>
            <span>Hover or inspect source paths to see provenance</span>
          </div>

          <div className="space-y-3">
            {filteredPermissions?.map((ep, idx) => {
              const isRisky = ep.isDestructive || ep.isDangerous;
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border transition-all ${
                    isRisky && !ep.isApprovedAdmin
                      ? 'bg-rose-950/20 border-rose-500/40 shadow-lg shadow-rose-950/30'
                      : ep.isApprovedAdmin
                      ? 'bg-emerald-950/20 border-emerald-500/30'
                      : 'bg-[#0f172a] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Top Bar: Permission & Resource */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-slate-800 text-sky-400 font-mono font-bold text-xs flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5" />
                        <span>{ep.permission.name}</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-600" />
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-300 font-semibold text-xs flex items-center gap-1.5 border border-emerald-500/20">
                        <Database className="w-3.5 h-3.5" />
                        <span>{ep.resource.name}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {ep.isApprovedAdmin ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Approved Legitimate Admin ({ep.approvalTicket})
                        </span>
                      ) : ep.isDestructive ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Dangerous / Destructive Grant
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                          Authorized Standard Access
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Provenance Explanations: Direct vs Multiple-Role vs Inherited */}
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80 space-y-2 text-xs">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Complete Provenance Chain ({ep.sources.length} {ep.sources.length === 1 ? 'Source' : 'Multiple Sources'} Detected)
                    </div>

                    <div className="space-y-1.5">
                      {ep.sources.map((src, sIdx) => (
                        <div
                          key={sIdx}
                          className="flex items-center gap-2 text-[11px] font-mono text-slate-300 flex-wrap"
                        >
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase ${
                              src.type === 'direct'
                                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                                : src.type === 'inherited_role'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                            }`}
                          >
                            {src.type === 'direct'
                              ? 'Direct Grant'
                              : src.type === 'inherited_role'
                              ? 'Inherited Role'
                              : 'Assigned Role'}
                          </span>

                          <span className="text-slate-400">
                            Path: {src.path.join(' → ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
