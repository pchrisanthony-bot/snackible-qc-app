"use client";

import { AlternativeClaim } from "../../lib/types";
import StatusBadge from "../shared/StatusBadge";
import { TrendingUp } from "lucide-react";

interface Props {
  claims: AlternativeClaim[];
}

export default function AlternativeClaimsPanel({ claims }: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {claims.map((c, i) => (
        <div key={i} className="bg-white rounded-xl border border-[#DCE8E0] p-4 shadow-sm hover:border-[#2D6A4F] transition-colors">
          <div className="flex items-start justify-between gap-2 mb-3">
            <p className="font-semibold text-[#1A2B22] text-sm leading-tight">"{c.text}"</p>
            <div className="flex-shrink-0">
              <StatusBadge status={c.alignment} size="xs" />
            </div>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-[#2D6A4F]" />
            <span className="text-xs text-[#7A9186]">Projected SI</span>
            <span
              className="font-bold text-[#2D6A4F]"
              style={{ fontFamily: "JetBrains Mono, monospace" }}
            >
              {c.projected_si.toFixed(1)}
            </span>
          </div>
          <p className="text-xs text-[#4A6358] leading-relaxed">{c.rationale}</p>
        </div>
      ))}
    </div>
  );
}
