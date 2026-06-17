"use client";

import { FSSAIResult } from "../../lib/types";
import StatusBadge from "../shared/StatusBadge";
import { AlertTriangle, Zap } from "lucide-react";

interface Props {
  result: FSSAIResult;
}

export default function FSSAIChecklist({ result }: Props) {
  return (
    <div className="space-y-3">
      {/* Energy Check */}
      <div className="flex items-center justify-between p-3 rounded-lg border border-[#DCE8E0] bg-white">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#FBAE25]" />
          <div>
            <p className="text-sm font-medium text-[#1A2B22]">Energy Cross-Check</p>
            <p className="text-xs text-[#7A9186]">
              Reported {result.energy_check.reported} kcal vs Calculated {result.energy_check.calculated} kcal
              {" "}({result.energy_check.deviation_pct}% deviation)
            </p>
          </div>
        </div>
        <StatusBadge status={result.energy_check.status} />
      </div>

      {/* Claim summary */}
      {result.claim_validations.map((cv, i) => (
        <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-[#DCE8E0] bg-white">
          <p className="text-sm text-[#1A2B22]">{cv.claim}</p>
          <StatusBadge status={cv.status} />
        </div>
      ))}

      {/* Sodium flag */}
      {result.sodium_flag && (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-amber-200 bg-amber-50">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            High Sodium flag — sodium exceeds 800mg/100g internal threshold
          </p>
        </div>
      )}
    </div>
  );
}
