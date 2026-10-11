/**
 * AccessGuard Data Import & Benchmark Dataset
 * Imports JSON/CSV with schema validation, plus one-click sample loader.
 */

import React, { useState } from 'react';
import {
  UploadCloud,
  FileJson,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Download,
  Database,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';

interface DataImportTabProps {
  onResetSampleData: () => void;
  onImportSuccess?: () => void;
}

export const DataImportTab: React.FC<DataImportTabProps> = ({
  onResetSampleData,
  onImportSuccess
}) => {
  const [jsonInput, setJsonInput] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [importing, setImporting] = useState(false);

  const sampleTemplate = {
    users: [
      {
        id: 'usr_201',
        name: 'Sarah Connor',
        email: 'sarah.c@byteforge.corp',
        department: 'Security',
        title: 'AppSec Lead',
        isAdmin: false
      }
    ],
    roles: [
      {
        id: 'rol_appsec_analyst',
        name: 'AppSec Analyst',
        department: 'Security',
        riskTier: 'medium'
      }
    ],
    userRoles: [
      {
        id: 'ur_201',
        userId: 'usr_201',
        roleId: 'rol_appsec_analyst',
        assignedBy: 'ciso_direct'
      }
    ]
  };

  const handleImport = async () => {
    if (!jsonInput.trim()) {
      setStatusMessage({ type: 'error', text: 'Please paste valid JSON dataset.' });
      return;
    }

    setImporting(true);
    setStatusMessage(null);

    try {
      const parsed = JSON.parse(jsonInput);
      const res = await api.importData(parsed);
      setStatusMessage({
        type: 'success',
        text: `Batch dataset successfully validated and imported (${res.count} entity types). Risk analysis engine recalculated.`
      });
      if (onImportSuccess) onImportSuccess();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Invalid JSON format or schema validation error.' });
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadSnapshot = async () => {
    try {
      const users = await api.getUsers();
      const roles = await api.getRoles();
      const resources = await api.getResources();
      const permissions = await api.getPermissions();
      const findings = await api.getFindings();

      const snapshot = {
        exportedAt: new Date().toISOString(),
        users,
        roles: roles.roles,
        resources,
        permissions,
        findings
      };

      const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `accessguard-snapshot-${Date.now()}.json`;
      a.click();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-teal-400" />
          <span>Access Data Import & Benchmark Dataset</span>
        </h2>
        <p className="text-xs text-slate-400">
          Load standard structured IAM feeds, HR directories, role definitions, or instant CBC090 benchmark scenarios.
        </p>
      </div>

      {/* Benchmark Demo Dataset Box */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#111827] via-[#141d33] to-[#111827] border border-teal-500/30 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
              Evaluator Quick-Start
            </span>
            <h3 className="text-sm font-bold text-white">Load CBC 2.0 Benchmark Scenarios</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
            Instantly seeds the 4 evaluation scenarios:
            <br />
            1. <strong>Alex Rivera:</strong> Student with excessive DB Operator & DROP TABLE privileges
            <br />
            2. <strong>Jordan Taylor:</strong> Finance SoD violation (Invoice Approve + Payment Release)
            <br />
            3. <strong>Morgan Chen:</strong> Stale unrevoked payroll export grant post-department transfer
            <br />
            4. <strong>ByteForge:</strong> Legitimate administrator with approved break-glass ticket
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onResetSampleData}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-teal-500/20 active:scale-95 transition-all flex items-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Load Sample Dataset</span>
          </button>

          <button
            onClick={handleDownloadSnapshot}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Snapshot</span>
          </button>
        </div>
      </div>

      {/* JSON Custom Import Section */}
      <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <FileJson className="w-4 h-4 text-purple-400" />
            <span>Custom JSON Batch Ingestion</span>
          </h3>
          <button
            onClick={() => setJsonInput(JSON.stringify(sampleTemplate, null, 2))}
            className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
          >
            Insert Schema Template
          </button>
        </div>

        <textarea
          rows={10}
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          placeholder="Paste JSON with users, roles, permissions, directGrants, and accessPolicies..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-200 focus:outline-none focus:border-teal-500"
        />

        {statusMessage && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleImport}
            disabled={importing}
            className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {importing ? 'Validating Schema...' : 'Validate & Import Data'}
          </button>
        </div>
      </div>
    </div>
  );
};
