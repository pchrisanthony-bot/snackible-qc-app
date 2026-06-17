"use client";

import { QCMismatch } from "../../lib/types";
import { cn } from "../../lib/utils";

interface Props {
  artworkUrl: string | null;
  mismatches: QCMismatch[];
  activeField?: string | null;
}

const ANNOTATION_POSITIONS: Record<string, { top: string; left: string }> = {
  "Dietary Fibre":       { top: "42%", left: "60%" },
  "Allergen Declaration":{ top: "75%", left: "50%" },
  "Barcode":             { top: "85%", left: "20%" },
  "MRP":                 { top: "10%", left: "70%" },
};

export default function ArtworkViewer({ artworkUrl, mismatches, activeField }: Props) {
  return (
    <div className="relative bg-[#F4F7F5] rounded-xl border border-[#DCE8E0] overflow-hidden min-h-[400px] flex items-center justify-center">
      {artworkUrl ? (
        (() => {
          const isPdf = artworkUrl.startsWith("data:application/pdf") || artworkUrl.endsWith(".pdf");
          if (isPdf) {
            return (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 gap-4 min-h-[400px]">
                <embed
                  src={artworkUrl}
                  type="application/pdf"
                  className="w-full rounded-lg border border-[#DCE8E0] shadow-sm"
                  style={{ height: "480px" }}
                />
                <p className="text-xs text-[#7A9186] italic">PDF label preview</p>
              </div>
            );
          }
          return (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={artworkUrl} alt="Product artwork" className="w-full h-full object-contain" />
              {mismatches.map((mm, i) => {
                const pos = ANNOTATION_POSITIONS[mm.field];
                if (!pos) return null;
                const isActive = activeField === mm.field;
                return (
                  <div
                    key={i}
                    className={cn(
                      "absolute flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold shadow-md transition-all",
                      mm.severity === "CRITICAL"
                        ? "bg-red-500 text-white"
                        : "bg-amber-400 text-white",
                      isActive && "ring-2 ring-white scale-110"
                    )}
                    style={{ top: pos.top, left: pos.left, transform: "translate(-50%, -50%)" }}
                  >
                    <span className="w-2 h-2 rounded-full bg-white/70" />
                    {mm.field}
                  </div>
                );
              })}
            </>
          );
        })()
      ) : (
        <div className="text-center p-8">
          <div className="w-32 h-48 bg-white border-2 border-dashed border-[#C5DFAC] rounded-xl mx-auto mb-4 flex flex-col items-center justify-center">
            <div className="text-3xl mb-2">🌾</div>
            <p className="text-xs text-[#7A9186] font-medium">Ragi Chips</p>
            <p className="text-[10px] text-[#7A9186]">40g</p>
          </div>
          <p className="text-sm text-[#7A9186]">Demo artwork placeholder</p>
          {mismatches.length > 0 && (
            <div className="mt-4 space-y-2">
              {mismatches.map((mm, i) => (
                <div
                  key={i}
                  className={cn(
                    "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold mx-1",
                    mm.severity === "CRITICAL" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                  )}
                >
                  {mm.severity === "CRITICAL" ? "⚠" : "!"} {mm.field}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
