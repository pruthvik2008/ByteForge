/**
 * Risk Score Gauge Component
 * Inspired by reference design (semi-circular radial gauge 0 - 1000)
 */

import React from 'react';

interface RiskGaugeProps {
  score: number; // 0 to 1000
  tier: string;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({ score, tier }) => {
  const normalizedScore = Math.min(1000, Math.max(0, score));
  // Angle: -180 deg to 0 deg (or 0 to 180)
  const percentage = normalizedScore / 1000;
  
  // Circumference for semi-circle r=75
  const radius = 75;
  const circumference = Math.PI * radius; // ~235.6
  const strokeDashoffset = circumference * (1 - percentage);

  const getTierColor = (t: string) => {
    switch (t.toLowerCase()) {
      case 'critical':
        return { stroke: '#f43f5e', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
      case 'high':
        return { stroke: '#fb923c', bg: 'bg-orange-500/20 text-orange-300 border-orange-500/30' };
      case 'medium':
        return { stroke: '#eab308', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
      default:
        return { stroke: '#10b981', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
    }
  };

  const style = getTierColor(tier);

  return (
    <div className="flex flex-col items-center justify-center relative">
      <div className="relative w-48 h-28 flex items-end justify-center">
        <svg viewBox="0 0 180 100" className="w-full h-full overflow-visible">
          {/* Background Arc */}
          <path
            d="M 15 90 A 75 75 0 0 1 165 90"
            fill="none"
            stroke="#1e293b"
            strokeWidth="16"
            strokeLinecap="round"
          />
          {/* Active Gradient Arc */}
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#f43f5e" />
            </linearGradient>
          </defs>
          <path
            d="M 15 90 A 75 75 0 0 1 165 90"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center score readout */}
        <div className="absolute inset-x-0 bottom-1 flex flex-col items-center">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Score</span>
          <span className="text-3xl font-extrabold text-white tracking-tight font-mono">{normalizedScore}</span>
        </div>
      </div>

      {/* Min / Max Labels and Tier badge */}
      <div className="w-48 flex justify-between items-center text-[11px] text-slate-500 px-2 mt-1">
        <span>0</span>
        <div className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style.bg}`}>
          {tier}
        </div>
        <span>1000</span>
      </div>
    </div>
  );
};
