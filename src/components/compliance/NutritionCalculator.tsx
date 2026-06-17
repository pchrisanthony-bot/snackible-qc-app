"use client";

import { FSSAIResult } from "../../lib/types";
import { cn } from "../../lib/utils";

interface Props {
  result: FSSAIResult;
}

export default function NutritionCalculator({ result }: Props) {
  const { energy_check } = result;
  const deviation = energy_check.deviation_pct;

  return (
    <div
      className={cn(
        "p-4 rounded-xl border",
        energy_check.status === "FAIL"
          ? "bg-red-50 border-red-200"
          : "bg-green-50 border-green-200"
      )}
    >
      <p className="text-sm font-semibold text-[#1A2B22] mb-3">Energy Calculation Cross-Check</p>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-xs text-[#7A9186] mb-1">Reported</p>
          <p className="text-xl font-bold font-mono text-[#1A2B22]">{energy_check.reported}</p>
          <p className="text-xs text-[#7A9186]">kcal</p>
        </div>
        <div>
          <p className="text-xs text-[#7A9186] mb-1">Calculated</p>
          <p className="text-xl font-bold font-mono text-[#1A2B22]">{energy_check.calculated}</p>
          <p className="text-xs text-[#7A9186]">kcal</p>
        </div>
        <div>
          <p className="text-xs text-[#7A9186] mb-1">Deviation</p>
          <p className={cn("text-xl font-bold font-mono", energy_check.status === "FAIL" ? "text-red-600" : "text-green-600")}>
            {deviation}%
          </p>
          <p className="text-xs text-[#7A9186]">{energy_check.status === "FAIL" ? "&gt;5% limit" : "within 5%"}</p>
        </div>
      </div>
      <p className="text-xs text-[#4A6358] mt-3">
        Formula: (Carbs × 4) + (Protein × 4) + (Fat × 9) = {energy_check.calculated} kcal
      </p>
    </div>
  );
}
