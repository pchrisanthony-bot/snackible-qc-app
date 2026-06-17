"use client";

import { useAnalysis } from "../../context/AnalysisContext";
import StatusBadge from "../../components/shared/StatusBadge";
import RDATable from "../../components/compliance/RDATable";
import ClaimValidator from "../../components/compliance/ClaimValidator";
import FSSAIChecklist from "../../components/compliance/FSSAIChecklist";
import NutritionCalculator from "../../components/compliance/NutritionCalculator";
import MetricCard from "../../components/shared/MetricCard";
import { Shield, DollarSign, AlertTriangle } from "lucide-react";
import EmptyState from "../../components/shared/EmptyState";

export default function CompliancePage() {
  const { state } = useAnalysis();
  const { fssaiResult, productMeta, nutrition } = state;

  if (!fssaiResult) {
    return <EmptyState message="No compliance data yet." />;
  }

  return (
    <div className="space-y-5">
      {/* Status row */}
      <div className="flex items-center gap-4 bg-white rounded-xl border border-[#DCE8E0] p-4 shadow-sm">
        <Shield className="w-8 h-8 text-[#2D6A4F]" />
        <div className="flex-1">
          <p className="text-xs text-[#7A9186] uppercase tracking-wide font-semibold">Overall FSSAI Status</p>
          <p className="text-lg font-bold text-[#1A2B22]" style={{ fontFamily: "Raleway, sans-serif" }}>
            {productMeta.product_name}
          </p>
        </div>
        <StatusBadge status={fssaiResult.overall_status} size="md" />
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          title="Cost per Gram"
          value={`₹${fssaiResult.cost_per_gram}`}
          subtitle={`${productMeta.mrp}₹ / ${productMeta.pack_weight_g}g`}
          icon={<DollarSign className="w-5 h-5" />}
        />
        <MetricCard
          title="Claims Validated"
          value={fssaiResult.claim_validations.filter((c) => c.status === "VALID").length}
          subtitle={`of ${fssaiResult.claim_validations.length} declared`}
          accent={
            fssaiResult.claim_validations.some((c) => c.status === "INVALID")
              ? "red"
              : "green"
          }
        />
        <MetricCard
          title="Energy Deviation"
          value={`${fssaiResult.energy_check.deviation_pct}%`}
          subtitle="Reported vs Calculated"
          accent={fssaiResult.energy_check.status === "FAIL" ? "red" : "green"}
        />
        <MetricCard
          title="Sodium Level"
          value={`${nutrition.sodium_mg} mg`}
          subtitle="per 100g"
          accent={fssaiResult.sodium_flag ? "amber" : "green"}
          icon={fssaiResult.sodium_flag ? <AlertTriangle className="w-5 h-5 text-amber-500" /> : undefined}
        />
      </div>

      {/* Checklist summary */}
      <div className="bg-white rounded-xl border border-[#DCE8E0] p-5 shadow-sm">
        <h3 className="font-bold text-[#1A2B22] mb-4" style={{ fontFamily: "Raleway, sans-serif" }}>
          Compliance Checklist
        </h3>
        <FSSAIChecklist result={fssaiResult} />
      </div>

      {/* Energy calculator */}
      <div className="bg-white rounded-xl border border-[#DCE8E0] p-5 shadow-sm">
        <h3 className="font-bold text-[#1A2B22] mb-4" style={{ fontFamily: "Raleway, sans-serif" }}>
          Energy Calculation Verification
        </h3>
        <NutritionCalculator result={fssaiResult} />
      </div>

      {/* Claim matrix */}
      <div className="bg-white rounded-xl border border-[#DCE8E0] p-5 shadow-sm">
        <h3 className="font-bold text-[#1A2B22] mb-4" style={{ fontFamily: "Raleway, sans-serif" }}>
          Claim Validation Matrix
        </h3>
        <ClaimValidator result={fssaiResult} />
      </div>

      {/* RDA table */}
      <div className="bg-white rounded-xl border border-[#DCE8E0] p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[#1A2B22]" style={{ fontFamily: "Raleway, sans-serif" }}>
            Nutritional Information Table
          </h3>
          <div className="text-xs text-[#7A9186]">
            Serving: {productMeta.serving_size_g}g &bull; Pack: {productMeta.pack_weight_g}g
          </div>
        </div>
        <RDATable result={fssaiResult} />
      </div>

      {/* Sodium flag */}
      {fssaiResult.sodium_flag && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800 text-sm">High Sodium Warning</p>
            <p className="text-xs text-amber-700 mt-1">
              Sodium content ({nutrition.sodium_mg}mg/100g) exceeds the Snackible internal benchmark of 800mg/100g.
              Consider reformulation or adding a sodium disclosure on pack.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
