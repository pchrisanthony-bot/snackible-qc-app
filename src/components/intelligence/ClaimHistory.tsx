"use client";

import { Clock, Trash2, ChevronRight } from "lucide-react";
import { MarketIntelResult } from "./MarketSearch";

interface Props {
  history: MarketIntelResult[];
  onSelect: (item: MarketIntelResult) => void;
  onClear: () => void;
}

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function ClaimHistory({ history, onSelect, onClear }: Props) {
  if (history.length === 0) return null;

  return (
    <div className="bg-white border border-[#DCE8E0] rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#7A9186]" />
          <h3 className="text-sm font-bold text-[#1A2B22]">Search History</h3>
        </div>
        <button
          onClick={onClear}
          className="flex items-center gap-1 text-xs text-[#7A9186] hover:text-red-500 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
          Clear
        </button>
      </div>
      <div className="space-y-1.5">
        {history.map((item, i) => (
          <button
            key={i}
            onClick={() => onSelect(item)}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#F5FAF7] transition-colors text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-[#EAF3DE] flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-[#2D6A4F]">{item.competitors.length}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#1A2B22] truncate">"{item.keyword}"</p>
              <p className="text-xs text-[#7A9186]">
                {item.category} · {item.region} · {timeAgo(item.timestamp)}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-[#B0C4BB] group-hover:text-[#2D6A4F] transition-colors flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
