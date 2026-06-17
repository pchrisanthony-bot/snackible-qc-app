"use client";

import { FSSAIResult } from "../../lib/types";
import { cn } from "../../lib/utils";

interface Props {
  result: FSSAIResult;
}

export default function RDATable({ result }: Props) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#DCE8E0]">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#EAF3DE] border-b border-[#DCE8E0]">
            {["Nutrient", "Per 100g", "Per Serving", "Per Pack", "%RDA"].map((h) => (
              <th key={h} className="px-4 py-2.5 text-left text-xs font-bold text-[#2D6A4F] uppercase tracking-wide">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.rda_table.map((row, i) => {
            const isEnergy = row.nutrient === "Energy";
            const isSodiumHigh = row.nutrient === "Sodium" && result.sodium_flag;
            return (
              <tr
                key={i}
                className={cn(
                  "border-b border-[#DCE8E0] last:border-0",
                  isSodiumHigh ? "bg-amber-50" : i % 2 === 0 ? "bg-white" : "bg-[#FAFCFA]"
                )}
              >
                <td className="px-4 py-3 font-medium text-[#1A2B22]">
                  {row.nutrient}
                  {isSodiumHigh && (
                    <span className="ml-2 text-xs text-amber-600 font-semibold">⚠ High</span>
                  )}
                  {isEnergy && (
                    <div className="text-[11px] text-[#7A9186] mt-0.5">
                      Reported: {result.energy_check.reported} | Calc: {result.energy_check.calculated}
                      {result.energy_check.status === "FAIL" && (
                        <span className="text-red-600 ml-1">({result.energy_check.deviation_pct}% deviation)</span>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-[#1A2B22]">{row.per_100g}</td>
                <td className="px-4 py-3 font-mono text-[#1A2B22]">{row.per_serving}</td>
                <td className="px-4 py-3 font-mono text-[#1A2B22]">{row.per_pack}</td>
                <td className="px-4 py-3">
                  {row.rda_pct > 0 ? (
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            row.rda_pct > 30 ? "bg-amber-400" : "bg-[#2D6A4F]"
                          )}
                          style={{ width: `${Math.min(row.rda_pct, 100)}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs text-[#4A6358]">{row.rda_pct}%</span>
                    </div>
                  ) : (
                    <span className="text-[#7A9186] text-xs">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
