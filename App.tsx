/**
 * AccessGuard — Secure Role & Permission Misconfiguration Detector
 * Developed by Team Byteforge (CBC090) — Global Academy of Technology
 * Main Application Shell
 */

import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { OverviewTab } from './components/OverviewTab';
import { UsersTab } from './components/UsersTab';
import { EffectiveAccessMapTab } from './components/EffectiveAccessMapTab';
import { AttackGraph } from './components/AttackGraph';
import { FindingsTab } from './components/FindingsTab';
import { WhatIfSimulatorTab } from './components/WhatIfSimulatorTab';
import { EncryptionTab } from './components/EncryptionTab';
import { AuditLogsTab } from './components/AuditLogsTab';
import { DataImportTab } from './components/DataImportTab';
import { TeamTab } from './components/TeamTab';
import { WhyIsThisRiskyModal } from './components/WhyIsThisRiskyModal';
import { RemediationModal } from './components/RemediationModal';
import { VoiceSecurityCopilot } from './components/VoiceSecurityCopilot';

import { api } from './services/api';
import { DashboardSummary, Finding } from './types';
import { Mic, ShieldCheck, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentRiskyAccess, setRecentRiskyAccess] = useState<any[]>([]);
  const [highPriorityActions, setHighPriorityActions] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals & Assistant
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [copilotContextFinding, setCopilotContextFinding] = useState<Finding | null>(null);
  const [whyRiskyFinding, setWhyRiskyFinding] = useState<Finding | null>(null);
  const [remediationFinding, setRemediationFinding] = useState<Finding | null>(null);
  const [simulatorUserId, setSimulatorUserId] = useState<string | undefined>();

  // Toast Notification
  const [toast, setToast] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const showToast = (type: 'success' | 'info' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const loadDashboardData = async () => {
    try {
      const data = await api.getDashboard();
      setSummary(data.summary);
      setRecentRiskyAccess(data.recentRiskyAccess);
      setHighPriorityActions(data.highPriorityActions);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    }
  };

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const res = await api.runRiskAnalysis();
      setSummary(res.summary);
      await loadDashboardData();
      showToast('success', `Risk Analysis complete. ${res.findings.length} findings evaluated across 7 security rules.`);
    } catch (err: any) {
      showToast('error', err.message || 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleResetData = async () => {
    try {
      const res = await api.resetDataset();
      setSummary(res.summary);
      await loadDashboardData();
      showToast('info', 'Database reset to CBC090 benchmark scenarios (Scenarios 1-4 loaded).');
    } catch (err: any) {
      showToast('error', err.message || 'Reset failed');
    }
  };

  const handleOpenWhyRisky = (finding: Finding) => {
    setWhyRiskyFinding(finding);
  };

  const handleOpenRemediation = (finding: Finding) => {
    setRemediationFinding(finding);
  };

  const handleRemediationSuccess = (result: any) => {
    showToast(
      'success',
      `Remediation verified! ${result.actionTaken}. Risk Score reduced from ${result.riskScoreBefore} to ${result.riskScoreAfter} (↓ ${result.riskReduction} pts).`
    );
    loadDashboardData();
  };

  const handleAskCopilot = (finding: Finding) => {
    setCopilotContextFinding(finding);
    setIsCopilotOpen(true);
  };

  const handleOpenSimulator = (userId: string) => {
    setSimulatorUserId(userId);
    setActiveTab('simulator');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0b0f19] text-slate-100 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openFindingsCount={summary?.openFindingsCount || 0}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <Header
          onRunAnalysis={handleRunAnalysis}
          onResetData={handleResetData}
          isAnalyzing={isAnalyzing}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          openCopilot={() => setIsCopilotOpen(true)}
          lastScanTime={summary?.lastScanTimestamp}
        />

        {/* Tab Content Body */}
        <main className="flex-1 overflow-y-auto bg-[#0b0f19]">
          {activeTab === 'overview' && (
            <OverviewTab
              summary={summary}
              recentRiskyAccess={recentRiskyAccess}
              highPriorityActions={highPriorityActions}
              onRunAnalysis={handleRunAnalysis}
              isAnalyzing={isAnalyzing}
              onOpenFinding={(fId) => {
                api.getFindingById(fId).then(f => handleOpenWhyRisky(f)).catch(console.error);
              }}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'users' && (
            <UsersTab
              onOpenFinding={(fId) => {
                api.getFindingById(fId).then(f => handleOpenWhyRisky(f)).catch(console.error);
              }}
              onOpenSimulator={handleOpenSimulator}
            />
          )}

          {activeTab === 'access-map' && <EffectiveAccessMapTab />}

          {activeTab === 'attack-intel' && (
            <AttackGraph
              onSelectFinding={handleOpenWhyRisky}
              onOpenSimulator={handleOpenSimulator}
            />
          )}

          {activeTab === 'findings' && (
            <FindingsTab
              onOpenWhyRisky={handleOpenWhyRisky}
              onOpenRemediation={handleOpenRemediation}
              onAskCopilot={handleAskCopilot}
            />
          )}

          {activeTab === 'simulator' && (
            <WhatIfSimulatorTab
              initialUserId={simulatorUserId}
              onOpenRemediationModal={handleOpenRemediation}
            />
          )}

          {activeTab === 'cryptography' && <EncryptionTab />}

          {activeTab === 'audit-logs' && <AuditLogsTab />}

          {activeTab === 'import' && (
            <DataImportTab
              onResetSampleData={handleResetData}
              onImportSuccess={loadDashboardData}
            />
          )}

          {activeTab === 'team' && <TeamTab />}
        </main>
      </div>

      {/* Floating Microphone Button for Voice Copilot */}
      {!isCopilotOpen && (
        <button
          onClick={() => setIsCopilotOpen(true)}
          className="fixed bottom-6 right-6 z-40 group p-4 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-slate-950 shadow-2xl shadow-teal-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 font-bold"
          title="Open Voice Security Copilot"
        >
          <div className="relative">
            <Mic className="w-5 h-5 stroke-[2.5]" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-purple-600 animate-ping"></span>
          </div>
          <span className="text-xs tracking-tight font-extrabold pr-1">Voice Copilot</span>
        </button>
      )}

      {/* Voice-Powered Security Copilot Panel */}
      <VoiceSecurityCopilot
        isOpen={isCopilotOpen}
        onClose={() => {
          setIsCopilotOpen(false);
          setCopilotContextFinding(null);
        }}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          setIsCopilotOpen(false);
        }}
        onOpenFinding={(findingId) => {
          api.getFindingById(findingId).then(f => {
            handleOpenWhyRisky(f);
            setIsCopilotOpen(false);
          }).catch(console.error);
        }}
        onOpenRemediationModal={(f) => {
          setRemediationFinding(f);
        }}
        initialContextFinding={copilotContextFinding}
      />

      {/* "Why Is This Risky?" Explainability Modal */}
      <WhyIsThisRiskyModal
        finding={whyRiskyFinding}
        onClose={() => setWhyRiskyFinding(null)}
        onRemediate={(f) => {
          setWhyRiskyFinding(null);
          setRemediationFinding(f);
        }}
        onAskCopilot={(f) => {
          setWhyRiskyFinding(null);
          handleAskCopilot(f);
        }}
      />

      {/* Verified Remediation Confirmation Modal */}
      <RemediationModal
        finding={remediationFinding}
        onClose={() => setRemediationFinding(null)}
        onSuccess={handleRemediationSuccess}
      />

      {/* Toast Notification Alert */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[#0f172a] border border-teal-500/40 text-white shadow-2xl shadow-black text-xs animate-bounce">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : toast.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <Sparkles className="w-4 h-4 text-teal-400 shrink-0" />
          )}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
