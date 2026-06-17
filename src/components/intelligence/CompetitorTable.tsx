"use client";

import { useState } from "react";
import { CompetitorData } from "../../lib/types";
import StatusBadge from "../shared/StatusBadge";
import { X, Star } from "lucide-react";
import { cn } from "../../lib/utils";

interface Props {
  competitors: CompetitorData[];
}

const PLATFORM_COLORS: Record<string, string> = {
  Zepto: "bg-purple-100 text-purple-700",
  Blinkit: "bg-yellow-100 text-yellow-800",
  Amazon: "bg-orange-100 text-orange-700",
};

export default function CompetitorTable({ competitors }: Props) {
  const [slideOver, setSlideOver] = useState<CompetitorData | null>(null);

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-[#DCE8E0]">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="bg-[#EAF3DE] border-b border-[#DCE8E0]">
              {["Brand", "Product", "Platform", "Price", "Rating", "Claims", "Sentiment"].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-bold text-[#2D6A4F] uppercase tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {competitors.map((c, i) => (
              <tr key={i} className="border-b border-[#DCE8E0] last:border-0 bg-white hover:bg-[#EAF3DE] transition-colors">
                <td className="px-4 py-3 font-semibold text-[#1A2B22]">{c.brand}</td>
                <td className="px-4 py-3 text-[#4A6358] text-xs max-w-[180px]">{c.product}</td>
                <td className="px-4 py-3">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold", PLATFORM_COLORS[c.platform] || "bg-gray-100 text-gray-600")}>
                    {c.platform}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono font-semibold text-[#1A2B22]">₹{c.price}</td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1 font-mono text-sm font-bold text-[#FBAE25]">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    {c.rating}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {c.claims.map((cl, j) => (
                      <span key={j} className="px-1.5 py-0.5 bg-[#EAF3DE] text-[#2D6A4F] rounded text-[10px] font-medium whitespace-nowrap">
                        {cl}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setSlideOver(c)}
                    className="flex gap-1"
                  >
                    {["positive", "negative", "neutral"]
                      .filter((s) => c.sample_reviews.some((r) => r.sentiment === s))
                      .map((s) => (
                        <StatusBadge key={s} status={s} size="xs" customLabel={
                          `${c.sample_reviews.filter(r => r.sentiment === s).length} ${s}`
                        } />
                      ))}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Slide-over drawer */}
      {slideOver && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSlideOver(null)}>
          <div
            className="w-full max-w-md bg-white shadow-2xl h-full overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-[#DCE8E0] px-6 py-4 flex items-center justify-between">
              <div>
                <p className="font-bold text-[#1A2B22]" style={{ fontFamily: "Raleway, sans-serif" }}>
                  {slideOver.brand}
                </p>
                <p className="text-xs text-[#7A9186]">{slideOver.product}</p>
              </div>
              <button
                onClick={() => setSlideOver(null)}
                className="p-2 hover:bg-[#EAF3DE] rounded-lg"
              >
                <X className="w-4 h-4 text-[#7A9186]" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-xs font-bold text-[#7A9186] uppercase tracking-wide">Consumer Reviews</p>
              {slideOver.sample_reviews.map((r, i) => (
                <div
                  key={i}
                  className={cn(
                    "p-3 rounded-xl border text-sm",
                    r.sentiment === "positive"
                      ? "bg-green-50 border-green-200 text-green-800"
                      : r.sentiment === "negative"
                      ? "bg-red-50 border-red-200 text-red-800"
                      : "bg-gray-50 border-gray-200 text-gray-700"
                  )}
                >
                  <StatusBadge status={r.sentiment} size="xs" />
                  <p className="mt-1.5">"{r.text}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
