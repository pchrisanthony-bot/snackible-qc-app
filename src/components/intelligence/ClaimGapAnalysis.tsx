"use client";

import { Lightbulb } from "lucide-react";

interface Props {
  opportunities: string[];
}

export default function ClaimGapAnalysis({ opportunities }: Props) {
  return (
    <div className="flex flex-wrap gap-3">
      {opportunities.map((opp, i) => (
        <div
          key={i}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#FEF3D8] border border-[#FBAE25]/40 rounded-full text-sm font-medium text-[#1A2B22] hover:bg-[#FBAE25]/20 transition-colors cursor-default"
        >
          <Lightbulb className="w-4 h-4 text-[#FBAE25] flex-shrink-0" />
          {opp}
        </div>
      ))}
    </div>
  );
}
