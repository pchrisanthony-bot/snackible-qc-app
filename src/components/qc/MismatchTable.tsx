"use client";

import { QCMismatch } from "../../lib/types";
import StatusBadge from "../shared/StatusBadge";
import { cn } from "../../lib/utils";

interface Props {
  mismatches: QCMismatch[];
  activeField?: string | null;
  onSelect?: (field: string) => void;
}

export default function MismatchTable({ mismatches, activeField, onSelect }: Props) {
  if (mismatches.length === 0) {
    return (
      <div className="text-center py-6 text-[#7A9186] text-sm">
        ✓ No mismatches detected
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[#DCE8E0]">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#EAF3DE] border-b border-[#DCE8E0]">
            {["Field", "Master (Sheet)", "Artwork (OCR)", "Severity"].map((h) => (
              <th key={h} className="px-4 py-2.5 text-left text-xs font-bold text-[#2D6A4F] uppercase tracking-wide">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {mismatches.map((mm, i) => (
            <tr
              key={i}
              onClick={() => onSelect?.(mm.field)}
              className={cn(
                "border-b border-[#DCE8E0] last:border-0 transition-all",
                onSelect && "cursor-pointer",
                mm.severity === "CRITICAL"
                  ? "bg-red-50 border-l-2 border-red-400"
                  : mm.severity === "WARNING"
                  ? "bg-amber-50 border-l-2 border-amber-300"
                  : "bg-white",
                activeField === mm.field && "ring-2 ring-inset ring-[#2D6A4F]"
              )}
            >
              <td className="px-4 py-3 font-semibold text-[#1A2B22]">{mm.field}</td>
              <td className="px-4 py-3 font-mono text-green-700">{String(mm.master_value)}</td>
              <td className="px-4 py-3 font-mono text-red-600">{String(mm.artwork_value)}</td>
              <td className="px-4 py-3">
                <StatusBadge status={mm.severity} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
