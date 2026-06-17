"use client";

import { IntelligenceResult } from "../../lib/types";
import StatusBadge from "../shared/StatusBadge";

interface Props {
  result: IntelligenceResult;
}

export default function SIScoreCard({ result }: Props) {
  const pct = ((result.si_score - 1) / 4) * 100;
  const color = result.si_score >= 4 ? "#2D6A4F" : result.si_score >= 3 ? "#FBAE25" : "#EF4444";

  return (
    <div className="bg-white rounded-xl border border-[#DCE8E0] p-6 shadow-sm">
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-xs text-[#7A9186] font-medium uppercase tracking-wide mb-1">
            Snackible Intelligence Score
          </p>
          <div className="flex items-end gap-2">
            <span
              className="text-6xl font-bold"
              style={{ fontFamily: "JetBrains Mono, monospace", color }}
            >
              {result.si_score.toFixed(2)}
            </span>
            <span className="text-xl text-[#7A9186] mb-2">/5</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <StatusBadge status={result.alignment} customLabel={`Alignment: ${result.alignment}`} size="sm" />
            <StatusBadge status={result.confidence} customLabel={`Confidence: ${result.confidence}`} size="sm" />
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#EAF3DE] text-[#2D6A4F]">
              Cluster: {result.cluster}
            </span>
          </div>
        </div>

        {/* Score arc visual */}
        <div className="flex-shrink-0 w-24 h-24 relative">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#EAF3DE" strokeWidth="10" />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke={color}
              strokeWidth="10"
              strokeDasharray={`${2 * Math.PI * 40 * (pct / 100)} ${2 * Math.PI * 40}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-[#1A2B22]">{Math.round(pct)}%</span>
          </div>
        </div>
      </div>

      {/* Score bar */}
      <div className="mt-4">
        <div className="flex justify-between text-[10px] text-[#7A9186] mb-1">
          <span>1.0</span>
          <span>2.0</span>
          <span>3.0</span>
          <span>4.0</span>
          <span>5.0</span>
        </div>
        <div className="relative h-2 bg-gray-100 rounded-full">
          <div
            className="absolute h-full rounded-full transition-all"
            style={{ width: `${pct}%`, background: color }}
          />
          <div
            className="absolute w-3 h-3 rounded-full bg-white border-2 top-1/2 -translate-y-1/2 shadow"
            style={{ left: `calc(${pct}% - 6px)`, borderColor: color }}
          />
        </div>
      </div>
    </div>
  );
}
