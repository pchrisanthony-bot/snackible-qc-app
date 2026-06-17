"use client";

import { FSSAIResult } from "../../lib/types";
import StatusBadge from "../shared/StatusBadge";
import { CheckCircle2, XCircle, MinusCircle } from "lucide-react";
import { cn } from "../../lib/utils";

interface Props {
  result: FSSAIResult;
}

const ICON = {
  VALID: <CheckCircle2 className="w-5 h-5 text-green-600" />,
  INVALID: <XCircle className="w-5 h-5 text-red-600" />,
  NOT_CLAIMED: <MinusCircle className="w-5 h-5 text-gray-400" />,
};

export default function ClaimValidator({ result }: Props) {
  if (result.claim_validations.length === 0) {
    return (
      <p className="text-sm text-[#7A9186] py-4 text-center">No claims declared on pack.</p>
    );
  }

  return (
    <div className="space-y-2">
      {result.claim_validations.map((cv, i) => (
        <div
          key={i}
          className={cn(
            "flex items-center gap-4 p-4 rounded-xl border",
            cv.status === "VALID"
              ? "bg-green-50 border-green-200"
              : cv.status === "INVALID"
              ? "bg-red-50 border-red-200"
              : "bg-gray-50 border-gray-200"
          )}
        >
          <div className="flex-shrink-0">{ICON[cv.status]}</div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[#1A2B22] text-sm">{cv.claim}</p>
            <p className="text-xs text-[#4A6358] mt-0.5">
              Threshold: {cv.threshold}
              {cv.actual_value > 0 && (
                <span className="ml-2 font-mono font-semibold">
                  Actual: {cv.actual_value}
                </span>
              )}
            </p>
          </div>
          <StatusBadge status={cv.status} />
        </div>
      ))}
    </div>
  );
}
