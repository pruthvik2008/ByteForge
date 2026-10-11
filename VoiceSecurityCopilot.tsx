/**
 * AccessGuard Voice-Powered Security Copilot Component
 * Team Byteforge (CBC090)
 * Uses browser Web Speech API for recognition and SpeechSynthesis for spoken answers,
 * with text-input fallback, safety confirmation safeguards, and What-If simulation links.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Sparkles,
  X,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  Play,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import { Finding } from '../types';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedActions?: any[];
  isProposedRemediation?: boolean;
  dataPayload?: any;
}

interface VoiceSecurityCopilotProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: string) => void;
  onOpenFinding?: (findingId: string) => void;
  onOpenRemediationModal?: (finding: any) => void;
  initialContextFinding?: Finding | null;
}

export const VoiceSecurityCopilot: React.FC<VoiceSecurityCopilotProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onOpenFinding,
  onOpenRemediationModal,
  initialContextFinding
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg_welcome',
      sender: 'assistant',
      text: "Hello! I am your AccessGuard Security Copilot. You can speak or type cybersecurity questions regarding high-risk permissions, separation-of-duties conflicts, effective access paths, or remediation simulations.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedActions: [
        { label: 'Summarize security posture', actionType: 'SECURITY_BRIEFING' },
        { label: 'Show high-risk findings', actionType: 'GET_HIGH_RISK_FINDINGS' },
        { label: 'Which users have excessive access?', actionType: 'EXPLAIN_EXCESSIVE_PERMISSIONS' },
        { label: 'What happens if I remove DB delete?', actionType: 'SIMULATE_CHANGE' }
      ]
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechMuted, setSpeechMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Handle incoming initialContextFinding
  useEffect(() => {
    if (initialContextFinding && isOpen) {
      handleUserSubmit(`Explain why finding ${initialContextFinding.title} for user ${initialContextFinding.userId} is risky.`);
    }
  }, [initialContextFinding, isOpen]);

  // Initialize SpeechRecognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setInputText(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setErrorMessage('Microphone access denied. Please allow microphone permissions or type your query.');
        } else if (event.error !== 'no-speech') {
          setErrorMessage(`Speech recognition error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      stopSpeaking();
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setErrorMessage('Speech recognition is not supported in this browser. Please use text input below.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        stopSpeaking();
        recognitionRef.current.start();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const speakText = (text: string) => {
    if (speechMuted || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      // Clean markdown tags for spoken audio
      const cleanText = text
        .replace(/#{1,6}\s?/g, '')
        .replace(/\*\*|\*|`/g, '')
        .replace(/\[.*?\]/g, '')
        .replace(/\(.*?\)/g, '');

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'en-US';
      utterance.rate = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('Speech synthesis error:', err);
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const handleUserSubmit = async (queryText?: string) => {
    const textToSend = queryText || inputText;
    if (!textToSend.trim()) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const userMsg: Message = {
      id: `msg_user_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await api.queryCopilot(textToSend);

      const botMsg: Message = {
        id: `msg_bot_${Date.now()}`,
        sender: 'assistant',
        text: response.answerText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: response.suggestedActions,
        isProposedRemediation: response.isProposedRemediation,
        dataPayload: response.dataPayload
      };

      setMessages(prev => [...prev, botMsg]);
      speakText(response.speechText || response.answerText);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to process voice query');
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = (action: any) => {
    if (action.actionType === 'NAVIGATE' && onNavigateTab) {
      onNavigateTab(action.payload?.tab || 'overview');
    } else if (action.actionType === 'OPEN_FINDING' && onOpenFinding) {
      onOpenFinding(action.payload?.findingId);
    } else if (action.actionType === 'RUN_SIMULATION') {
      handleUserSubmit(`What happens if I remove ${action.payload?.roleIdToRemove || action.payload?.grantIdToRemove}?`);
    } else if (action.actionType === 'PROPOSE_REMEDIATION') {
      if (onOpenRemediationModal) {
        onOpenRemediationModal({
          userId: action.payload?.userId,
          affectedRoleId: action.payload?.roleIdToRemove,
          sourceGrantType: action.payload?.roleIdToRemove ? 'role' : 'direct',
          title: `Remediate ${action.payload?.userName} Access`
        });
      }
    } else if (action.actionType === 'FILTER_USER' && onNavigateTab) {
      onNavigateTab('attack-intel');
    } else {
      handleUserSubmit(action.label);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-full max-w-md bg-[#0d1322] border border-slate-800 rounded-2xl shadow-2xl shadow-black flex flex-col h-[580px] overflow-hidden">
      {/* Copilot Header */}
      <div className="p-4 border-b border-slate-800/80 bg-gradient-to-r from-[#0d1322] via-[#111827] to-[#141b2e] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            {isSpeaking && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-teal-400 animate-ping"></span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Security Copilot</h3>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                Voice AI
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Byteforge CBC090 Rule-Grounded Assistant</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Mute/Unmute Speech Toggle */}
          <button
            onClick={() => {
              if (!speechMuted) stopSpeaking();
              setSpeechMuted(!speechMuted);
            }}
            title={speechMuted ? 'Unmute voice output' : 'Mute voice output'}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            {speechMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-teal-400" />}
          </button>

          {/* Close Panel */}
          <button
            onClick={() => {
              stopSpeaking();
              if (isListening && recognitionRef.current) recognitionRef.current.stop();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Voice Status Indicator when Listening */}
      {isListening && (
        <div className="bg-rose-950/40 border-b border-rose-500/30 px-4 py-2 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2 text-rose-300 text-xs font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
            <span>Listening to speech... Speak your security command</span>
          </div>
          <button
            onClick={toggleListening}
            className="text-[10px] text-rose-400 hover:underline font-bold"
          >
            Stop
          </button>
        </div>
      )}

      {/* Conversation Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`p-3.5 rounded-2xl max-w-[90%] leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-teal-600 text-white rounded-br-none shadow-md shadow-teal-500/10'
                  : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-md'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.text}</div>

              {/* Proposed Remediation Safeguard Card */}
              {msg.isProposedRemediation && (
                <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-teal-500/40 space-y-2">
                  <div className="flex items-center gap-1.5 text-teal-400 font-bold text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Safe Proposed Remediation</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Voice commands cannot alter access directly. To commit this change, confirm via the authenticated modal.
                  </p>
                </div>
              )}

              {/* Quick Action Chips */}
              {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap gap-1.5">
                  {msg.suggestedActions.map((act, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleActionClick(act)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-semibold border border-slate-700 transition-all flex items-center gap-1"
                    >
                      <span>{act.label}</span>
                      <ArrowRight className="w-2.5 h-2.5 text-teal-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-slate-400 text-xs p-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-400" />
            <span>Analyzing security database & rules...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="px-4 py-2 bg-rose-500/10 border-t border-rose-500/20 text-rose-300 text-[11px] flex items-center justify-between">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 font-bold ml-2">×</button>
        </div>
      )}

      {/* Input Bar */}
      <div className="p-3 border-t border-slate-800 bg-[#0a0f1d] flex items-center gap-2">
        {/* Animated Mic Toggle Button */}
        <button
          onClick={toggleListening}
          className={`p-2.5 rounded-xl transition-all ${
            isListening
              ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/30'
              : 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/40'
          }`}
          title={isListening ? 'Stop Listening' : 'Speak Voice Command'}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        {/* Text Input Fallback */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUserSubmit()}
            placeholder={isListening ? 'Listening...' : 'Type or speak command (e.g. "high-risk findings")...'}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-teal-500/70"
          />
        </div>

        {/* Send Button */}
        <button
          onClick={() => handleUserSubmit()}
          disabled={!inputText.trim() || isLoading}
          className="p-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold disabled:opacity-30 transition-all shadow-md shadow-teal-500/20"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
