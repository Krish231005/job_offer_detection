/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

interface GaugeMeterProps {
  score: number;
}

export default function GaugeMeter({ score }: GaugeMeterProps) {
  // Map score (0-100) to rotation angle in degrees for the gauge needle (-90 to 90)
  const angle = (score / 100) * 180 - 90;

  // Determine dynamic risk descriptions and colors with crisp light design accents
  let colorClass = "text-emerald-700 border-emerald-200 bg-emerald-50 shadow-sm";
  let label = "Genuine Profile";
  let description = "Low risk. Offer shows professional verification standards.";
  let bgClass = "bg-emerald-500";

  if (score > 25 && score <= 50) {
    colorClass = "text-amber-700 border-amber-200 bg-amber-50 shadow-sm";
    label = "Suspicious Profile";
    description = "Moderate risk. Anomalies detected; check official references.";
    bgClass = "bg-amber-500";
  } else if (score > 50 && score <= 75) {
    colorClass = "text-orange-700 border-orange-200 bg-orange-50 shadow-sm";
    label = "High Threat Level";
    description = "Significant threat. High overlap with FTC scam indicators.";
    bgClass = "bg-orange-500";
  } else if (score > 75) {
    colorClass = "text-rose-700 border-rose-200 bg-rose-50 shadow-sm";
    label = "Critical Scam Alert";
    description = "Active fraud match. Highly dangerous offer. Do not share financial info.";
    bgClass = "bg-rose-500";
  }

  return (
    <div id="gauge-meter-container" className="flex flex-col items-center justify-center p-6 border border-slate-200/80 rounded-2xl bg-white shadow-md shadow-slate-100">
      <h3 id="gauge-title" className="text-xs font-display font-bold tracking-wider text-slate-500 uppercase mb-4">
        Risk Gauge Meter
      </h3>
      
      {/* SVG Semi-Circle Gauge */}
      <div id="gauge-svg-wrapper" className="relative flex items-center justify-center w-52 h-28 overflow-hidden">
        <svg className="w-48 h-24 overflow-visible" viewBox="0 0 100 50">
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" /> {/* Green */}
              <stop offset="35%" stopColor="#f59e0b" /> {/* Yellow */}
              <stop offset="70%" stopColor="#f97316" /> {/* Orange */}
              <stop offset="100%" stopColor="#f43f5e" /> {/* Red */}
            </linearGradient>
            <filter id="needleGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="1" floodColor="#6366f1" floodOpacity="0.3" />
            </filter>
          </defs>
          
          {/* Gauge Background Track (Clean Light Slate) */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="10"
            strokeLinecap="round"
          />
          
          {/* Colored Gradient Track */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="10"
            strokeLinecap="round"
            opacity="0.9"
          />

          {/* Needle Base Pin */}
          <circle cx="50" cy="50" r="4.5" fill="#4f46e5" />
          <circle cx="50" cy="50" r="2" fill="#ffffff" />

          {/* Gauge Needle Pointer */}
          <g transform={`rotate(${angle} 50 50)`} filter="url(#needleGlow)">
            <path
              d="M 48.5 50 L 50 12 L 51.5 50 Z"
              fill="#4f46e5"
            />
          </g>
        </svg>

        {/* Live Risk Score Text Overlay */}
        <div id="gauge-score-overlay" className="absolute bottom-0 flex flex-col items-center">
          <span className="text-4xl font-display font-black tracking-tight text-slate-800 leading-none">
            {score}
          </span>
          <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase mt-1">
            Risk Score
          </span>
        </div>
      </div>

      {/* Dynamic Status Card */}
      <div id="gauge-status-card" className={`w-full border rounded-xl p-3.5 text-center mt-6 transition-all duration-350 ${colorClass}`}>
        <h4 className="text-sm font-display font-bold tracking-wide">{label}</h4>
        <p className="text-xs mt-1.5 font-medium leading-relaxed opacity-90">{description}</p>
      </div>
    </div>
  );
}
