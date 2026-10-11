/**
 * AccessGuard Attack Intelligence: Interactive Graph
 * Built with @xyflow/react
 * Visualizes User -> Assigned Roles -> Inherited Roles -> Permissions -> Resources.
 * Highlights dangerous access paths, SoD violations, and excessive privileges.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  Handle,
  Position,
  NodeProps
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import {
  ShieldAlert,
  User as UserIcon,
  Layers,
  Key,
  Database,
  Search,
  Filter,
  AlertTriangle,
  Info,
  Wrench,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { api } from '../services/api';
import { Finding } from '../types';

// Custom User Node
const CustomUserNode = ({ data }: NodeProps) => {
  return (
    <div
      className={`px-4 py-3 rounded-xl border shadow-xl bg-[#0f172a] min-w-[220px] transition-all ${
        data.hasCritical
          ? 'border-rose-500/80 shadow-rose-500/20 ring-1 ring-rose-500/50'
          : data.hasHigh
          ? 'border-amber-500/70 shadow-amber-500/10'
          : 'border-slate-800'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-300 font-bold text-xs">
            <UserIcon className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white tracking-tight leading-tight">
              {data.label as string}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              {data.id as string}
            </div>
          </div>
        </div>
        {Boolean(data.findingsCount) && Number(data.findingsCount) > 0 && (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
            {String(data.findingsCount)} Risky
          </span>
        )}
      </div>
      <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
        <span>{data.dept as string}</span>
        <span className="text-slate-500">{data.title as string}</span>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-teal-400 !w-2.5 !h-2.5" />
    </div>
  );
};

// Custom Role Node
const CustomRoleNode = ({ data }: NodeProps) => {
  return (
    <div
      className={`px-3.5 py-2.5 rounded-xl border shadow-md bg-[#111827] min-w-[190px] ${
        data.isDangerous
          ? 'border-rose-500/60 bg-rose-950/20'
          : 'border-slate-800 bg-[#111827]'
      }`}
    >
      <Handle type="target" position={Position.Left} className="!bg-teal-400 !w-2 !h-2" />
      <div className="flex items-center gap-2">
        <Layers className={`w-3.5 h-3.5 ${data.isDangerous ? 'text-rose-400' : 'text-purple-400'}`} />
        <div className="text-xs font-semibold text-slate-200">
          {data.name as string}
        </div>
      </div>
      <div className="mt-1 text-[10px] text-slate-400 flex items-center justify-between">
        <span className="font-mono">{data.id as string}</span>
        <span className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-bold ${
          data.riskTier === 'critical' ? 'text-rose-400' : data.riskTier === 'high' ? 'text-orange-400' : 'text-slate-400'
        }`}>
          {data.riskTier as string}
        </span>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-purple-400 !w-2 !h-2" />
    </div>
  );
};

// Custom Permission Node
const CustomPermissionNode = ({ data }: NodeProps) => {
  const isDestructive = Boolean(data.isDestructive || data.isDangerous);
  return (
    <div
      className={`px-3.5 py-2.5 rounded-xl border shadow-md bg-[#090d16] min-w-[200px] ${
        isDestructive
          ? 'border-rose-500/70 bg-rose-950/30 ring-1 ring-rose-500/30'
          : 'border-slate-800'
      }`}
    >
      <Handle type="target" position={Position.Left} className="!bg-purple-400 !w-2 !h-2" />
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5">
          <Key className={`w-3.5 h-3.5 ${isDestructive ? 'text-rose-400' : 'text-sky-400'}`} />
          <span className="text-xs font-mono font-bold text-slate-200">
            {data.name as string}
          </span>
        </div>
      </div>
      <div className="mt-1 text-[10px] text-slate-400 flex items-center justify-between">
        <span className="capitalize">{data.action as string} action</span>
        {isDestructive && (
          <span className="text-[9px] font-extrabold text-rose-400 uppercase">
            Destructive
          </span>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="!bg-sky-400 !w-2 !h-2" />
    </div>
  );
};

// Custom Resource Node
const CustomResourceNode = ({ data }: NodeProps) => {
  return (
    <div className="px-4 py-3 rounded-xl border border-emerald-500/40 bg-[#0f172a] shadow-lg min-w-[240px]">
      <Handle type="target" position={Position.Left} className="!bg-sky-400 !w-2.5 !h-2.5" />
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
          <Database className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xs font-bold text-emerald-200 leading-tight">
            {data.name as string}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            {data.classification as string}
          </div>
        </div>
      </div>
    </div>
  );
};

const nodeTypes = {
  customUser: CustomUserNode,
  customRole: CustomRoleNode,
  customPermission: CustomPermissionNode,
  customResource: CustomResourceNode
};

interface AttackGraphProps {
  onSelectFinding?: (f: Finding) => void;
  onOpenSimulator?: (userId: string, roleId?: string) => void;
}

export const AttackGraph: React.FC<AttackGraphProps> = ({
  onSelectFinding,
  onOpenSimulator
}) => {
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterUser, setFilterUser] = useState<string>('all');
  const [users, setUsers] = useState<any[]>([]);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);

  useEffect(() => {
    loadGraph();
  }, [filterUser]);

  const loadGraph = async () => {
    setLoading(true);
    try {
      const graphData = await api.getAttackGraph(filterUser === 'all' ? undefined : filterUser);
      setNodes(graphData.nodes);
      setEdges(graphData.edges);

      const userList = await api.getUsers();
      setUsers(userList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleNodeClick = (_: any, node: any) => {
    setSelectedNode(node);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] bg-[#0b0f19] text-slate-100 overflow-hidden">
      {/* Top Graph Controls Bar */}
      <div className="h-14 px-6 border-b border-slate-800/80 bg-[#0d1322] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Attack Intelligence Path Graph
            </span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Filter Identity:</span>
            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
            >
              <option value="all">All Enterprise Identities</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.department})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Legend */}
        <div className="hidden lg:flex items-center gap-4 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400"></span>
            <span>Identity</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-purple-400"></span>
            <span>Role</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-sky-400"></span>
            <span>Permission</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-400"></span>
            <span>Resource</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-rose-500 rounded"></span>
            <span className="text-rose-400 font-semibold">Attack Path</span>
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 relative flex">
        <div className="flex-1 h-full relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-[#0b0f19]">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-slate-400">Rendering attack paths...</span>
              </div>
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodeClick={handleNodeClick}
              fitView
              className="bg-[#0b0f19]"
            >
              <Background color="#1e293b" gap={20} size={1} />
              <Controls className="!bg-slate-900 !border-slate-800 !text-white" />
              <MiniMap
                nodeColor={(node) => {
                  if (node.type === 'customUser') return '#14b8a6';
                  if (node.type === 'customRole') return '#a855f7';
                  if (node.type === 'customPermission') return '#38bdf8';
                  return '#10b981';
                }}
                className="!bg-slate-950 !border-slate-800"
              />
            </ReactFlow>
          )}
        </div>

        {/* Node Inspector Side Panel */}
        {selectedNode && (
          <div className="w-80 border-l border-slate-800 bg-[#0d1322] p-5 overflow-y-auto shrink-0 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-teal-400" />
                  Path Inspector
                </span>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-slate-500 hover:text-white text-xs"
                >
                  Close
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block mb-0.5">Node Type</span>
                  <span className="font-mono text-teal-300 font-semibold">{selectedNode.type}</span>
                </div>

                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block mb-0.5">Label / Title</span>
                  <span className="font-bold text-white text-sm">
                    {selectedNode.data.label || selectedNode.data.name || selectedNode.data.id}
                  </span>
                </div>

                {selectedNode.data.hasCritical && (
                  <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                    <div className="font-bold flex items-center gap-1 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> High Risk Detected
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      This node participates in a dangerous access chain violating corporate separation-of-duties or minimum privilege boundaries.
                    </p>
                  </div>
                )}

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5 text-[11px]">
                  {Object.entries(selectedNode.data).map(([key, val]) => {
                    if (['label', 'name'].includes(key)) return null;
                    return (
                      <div key={key} className="flex justify-between items-center text-slate-400">
                        <span className="capitalize">{key}:</span>
                        <span className="text-slate-200 font-mono text-[10px] truncate max-w-[140px]">
                          {String(val)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 space-y-2">
              {onOpenSimulator && selectedNode.type === 'customUser' && (
                <button
                  onClick={() => onOpenSimulator(selectedNode.data.id)}
                  className="w-full py-2 px-3 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Launch What-If Simulator</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
