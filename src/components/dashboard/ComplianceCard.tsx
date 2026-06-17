"use client";

import { FSSAIResult, QCResult } from "../../lib/types";
import StatusBadge from "../shared/StatusBadge";
import { Shield, ScanSearch, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

interface Props {
  fssai: FSSAIResult | null;
  qc: QCResult | null;
}

export default function ComplianceCard({ fssai, qc }: Props) {
  const criticalQC = qc?.mismatches.filter((m) => m.severity === "CRITICAL").length ?? 0;

  return (
    <div className="space-y-4">
      {/* FSSAI Block */}
      <div className="bg-white rounded-xl border border-[#DCE8E0] p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#2D6A4F]" />
            <span className="font-semibold text-sm text-[#1A2B22]">FSSAI Compliance</span>
          </div>
          {fssai && <StatusBadge status={fssai.overall_status} />}
        </div>
        {fssai ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#4A6358]">Energy Cross-Check</span>
              <StatusBadge status={fssai.energy_check.status} size="xs" />
            </div>
            {fssai.claim_validations.map((cv, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-[#4A6358] truncate mr-2">{cv.claim}</span>
                <StatusBadge status={cv.status} size="xs" />
              </div>
            ))}
            {fssai.sodium_flag && (
              <div className="flex items-center gap-1 text-xs text-amber-700 mt-1">
                ⚠ High sodium ({">"}800mg/100g)
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-[#7A9186]">Run analysis to see results</p>
        )}
        <Link href="/compliance" className="block mt-3 text-xs text-[#2D6A4F] font-semibold hover:underline">
          View full compliance report →
        </Link>
      </div>

      {/* QC Block */}
      <div className="bg-white rounded-xl border border-[#DCE8E0] p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ScanSearch className="w-4 h-4 text-[#2D6A4F]" />
            <span className="font-semibold text-sm text-[#1A2B22]">Packaging QC</span>
          </div>
          {qc && <StatusBadge status={qc.overall_status} />}
        </div>
        {qc ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#4A6358]">Mismatches Found</span>
              <span className={`font-mono font-bold ${qc.mismatches.length > 0 ? "text-red-600" : "text-green-600"}`}>
                {qc.mismatches.length}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#4A6358]">Critical Issues</span>
              <span className={`font-mono font-bold ${criticalQC > 0 ? "text-red-600" : "text-green-600"}`}>
                {criticalQC}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#4A6358]">Allergen Alerts</span>
              <span className={`font-mono font-bold ${qc.allergen_alerts.length > 0 ? "text-red-600" : "text-green-600"}`}>
                {qc.allergen_alerts.length}
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-[#DCE8E0]">
              <div className="grid grid-cols-4 gap-1">
                {qc.mandatory_checklist.slice(0, 4).map((item, i) => (
                  <div key={i} className="flex flex-col items-center gap-0.5">
                    {item.status === "FOUND" ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-[9px] text-center text-[#7A9186] leading-tight">{item.item.split(" ")[0]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-[#7A9186]">Upload artwork to run QC</p>
        )}
        <Link href="/qc" className="block mt-3 text-xs text-[#2D6A4F] font-semibold hover:underline">
          View QC inspector →
        </Link>
      </div>
    </div>
  );
}
