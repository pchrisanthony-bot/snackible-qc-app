"use client";

import { useAnalysis } from "../../context/AnalysisContext";
import StatusBadge from "../../components/shared/StatusBadge";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2, XCircle, AlertTriangle, Package,
  Shield, ScanSearch, TrendingUp, ArrowRight,
} from "lucide-react";
import { cn } from "../../lib/utils";
import EmptyState from "../../components/shared/EmptyState";

// ── Nutrient comparison row ───────────────────────────────────────────────────
function NutrientRow({
  label,
  master,
  label_val,
  unit,
  severity,
}: {
  label: string;
  master: number | null;
  label_val: number | null;
  unit: string;
  severity: "MATCH" | "WARNING" | "CRITICAL" | "NO_DATA";
}) {
  const colors = {
    MATCH:    "bg-green-50 text-green-700",
    WARNING:  "bg-amber-50 text-amber-700",
    CRITICAL: "bg-red-50 text-red-700",
    NO_DATA:  "bg-gray-50 text-gray-400",
  };
  const icons = {
    MATCH:    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />,
    WARNING:  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />,
    CRITICAL: <XCircle className="w-3.5 h-3.5 text-red-500" />,
    NO_DATA:  <span className="w-3.5 h-3.5 text-gray-300">—</span>,
  };

  return (
    <tr className={cn("border-b border-[#F0F4F2] text-xs", severity === "CRITICAL" && "bg-red-50/40")}>
      <td className="py-2 pl-3 font-medium text-[#1A2B22]">{label}</td>
      <td className="py-2 px-2 font-mono text-[#1A2B22] text-right">
        {master != null ? `${master}${unit}` : "—"}
      </td>
      <td className="py-2 px-2 font-mono text-right">
        {label_val != null ? (
          <span className={cn("px-1.5 py-0.5 rounded font-semibold", colors[severity])}>
            {label_val}{unit}
          </span>
        ) : (
          <span className="text-gray-400 italic">not read</span>
        )}
      </td>
      <td className="py-2 pr-3 text-center">{icons[severity]}</td>
    </tr>
  );
}

export default function DashboardPage() {
  const { state } = useAnalysis();
  const router = useRouter();
  const { fssaiResult, qcResult, intelligenceResult, productMeta, comparisonPackG, masterAtPack, ocrAtPack, ocrServingG } = state;

  if (!state.hasAnalysis) {
    return <EmptyState message="No product loaded yet." />;
  }

  const hasCriticalQC =
    (qcResult?.mismatches.filter((m) => m.severity === "CRITICAL").length ?? 0) > 0 ||
    (qcResult?.allergen_alerts.filter((a) => !a.declared_in_artwork).length ?? 0) > 0;
  const hasComplianceFailure = fssaiResult?.overall_status === "NON_COMPLIANT";
  const canApprove = !hasCriticalQC && !hasComplianceFailure;

  // Use per-pack values for display (exact match to what's on the label)
  const ocr = ocrAtPack as Record<string, number | null> | undefined;
  const master = (masterAtPack ?? {}) as unknown as Record<string, number>;

  type Row = { label: string; key: string; unit: string };
  const ROWS: Row[] = [
    { label: "Energy",        key: "energy_kcal",     unit: " kcal" },
    { label: "Protein",       key: "protein_g",       unit: "g" },
    { label: "Total Fat",     key: "total_fat_g",     unit: "g" },
    { label: "Saturated Fat", key: "saturated_fat_g", unit: "g" },
    { label: "Trans Fat",     key: "trans_fat_g",     unit: "g" },
    { label: "Carbohydrates", key: "carbohydrates_g", unit: "g" },
    { label: "Total Sugar",   key: "total_sugar_g",   unit: "g" },
    { label: "Dietary Fibre", key: "dietary_fibre_g", unit: "g" },
    { label: "Sodium",        key: "sodium_mg",       unit: "mg" },
    { label: "Calcium",       key: "calcium_mg",      unit: "mg" },
    { label: "Cholesterol",      key: "cholesterol_mg",    unit: "mg" },
    { label: "Unsaturated Fat",  key: "unsaturated_fat_g", unit: "g"  },
  ];

  const ABS_FLOOR: Record<string, number> = {
    energy_kcal: 1, protein_g: 0.05, total_fat_g: 0.05, saturated_fat_g: 0.05,
    trans_fat_g: 0.05, carbohydrates_g: 0.05, total_sugar_g: 0.05, added_sugar_g: 0.05,
    dietary_fibre_g: 0.05, sodium_mg: 1, calcium_mg: 1, cholesterol_mg: 1, unsaturated_fat_g: 0.05,
  };

  function getSeverity(key: string): "MATCH" | "WARNING" | "CRITICAL" | "NO_DATA" {
    if (!ocr) return "NO_DATA";
    const mv = master[key];
    const ov = ocr[key];
    if (ov == null || ov === undefined) return "NO_DATA";
    if (mv == null || mv === 0) return "MATCH";
    const absDiff = Math.abs(mv - ov);
    if (absDiff <= (ABS_FLOOR[key] ?? 0.05)) return "MATCH";
    const diff = absDiff / mv;
    if (diff > 0.15) return "CRITICAL";
    if (diff > 0.001) return "WARNING";
    return "MATCH";
  }

  const hasOCR = !!ocrAtPack;
  const criticalCount = qcResult?.mismatches.filter((m) => m.severity === "CRITICAL").length ?? 0;
  const warningCount  = qcResult?.mismatches.filter((m) => m.severity === "WARNING").length ?? 0;

  return (
    <div className="space-y-4">

      {/* ── Top status bar ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#DCE8E0] p-4 shadow-sm flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <Package className="w-5 h-5 text-[#2D6A4F] flex-shrink-0" />
          <div className="min-w-0">
            <p className="font-bold text-[#1A2B22] truncate" style={{ fontFamily: "Raleway, sans-serif" }}>
              {productMeta.product_name}
            </p>
            <p className="text-xs text-[#7A9186] font-mono">
              {productMeta.sku} · {productMeta.pack_weight_g}g · ₹{productMeta.mrp}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] text-[#7A9186] uppercase font-semibold">FSSAI</span>
            {fssaiResult ? <StatusBadge status={fssaiResult.overall_status} size="sm" /> : <span className="text-xs text-gray-400">—</span>}
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] text-[#7A9186] uppercase font-semibold">QC</span>
            {qcResult ? <StatusBadge status={qcResult.overall_status} size="sm" /> : <span className="text-xs text-gray-400">—</span>}
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] text-[#7A9186] uppercase font-semibold">SI Score</span>
            <span className="text-sm font-bold text-[#2D6A4F] font-mono">
              {intelligenceResult ? `${intelligenceResult.si_score.toFixed(1)}/5` : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Main 60/40 split ────────────────────────────────────────────── */}
      <div className="grid grid-cols-5 gap-4">

        {/* LEFT 60%: QC Nutrition Comparison ── the hero */}
        <div className="col-span-3 bg-white rounded-xl border border-[#DCE8E0] shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#DCE8E0] bg-[#F8FBF9]">
            <div className="flex items-center gap-2">
              <ScanSearch className="w-4 h-4 text-[#2D6A4F]" />
              <span className="font-bold text-sm text-[#1A2B22]" style={{ fontFamily: "Raleway, sans-serif" }}>
                QC: Label vs Master Data
              </span>
            </div>
            <div className="flex items-center gap-2">
              {criticalCount > 0 && (
                <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                  {criticalCount} critical
                </span>
              )}
              {warningCount > 0 && (
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                  {warningCount} warning
                </span>
              )}
              {qcResult && <StatusBadge status={qcResult.overall_status} size="xs" />}
            </div>
          </div>

          {!hasOCR ? (
            <div className="p-6 text-center">
              <ScanSearch className="w-10 h-10 text-[#C5DFAC] mx-auto mb-3" />
              <p className="text-sm font-semibold text-[#4A6358]">No label uploaded</p>
              <p className="text-xs text-[#7A9186] mt-1 mb-4">
                Upload a label PDF or image on the Upload page to run OCR comparison
              </p>
              <button onClick={() => router.push("/upload")}
                className="px-4 py-2 bg-[#2D6A4F] text-white text-xs font-bold rounded-xl hover:bg-[#1E4D39]">
                Upload Label →
              </button>
            </div>
          ) : (
            <>
              {ocrServingG != null && Math.abs(ocrServingG - comparisonPackG) >= 1 && (
                <div className="mx-3 mt-3 mb-1 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-700">
                    Label prints nutrition per <strong>{ocrServingG}g serving</strong> — scaled to {comparisonPackG}g for comparison.
                    If the label uses a different serving than the pack weight, select the matching pack size in the selector.
                  </p>
                </div>
              )}
              <div className="px-3 pt-1 pb-0">
                <table className="w-full">
                  <thead>
                    <tr className="text-[10px] text-[#7A9186] uppercase font-semibold">
                      <th className="text-left py-2 pl-2">Nutrient</th>
                      <th className="text-right py-2 px-2">Master (per {comparisonPackG}g)</th>
                      <th className="text-right py-2 px-2">Label (per {comparisonPackG}g)</th>
                      <th className="py-2 pr-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {ROWS.map((r) => (
                      <NutrientRow
                        key={r.key}
                        label={r.label}
                        master={master[r.key] ?? null}
                        label_val={ocr?.[r.key] ?? null}
                        unit={r.unit}
                        severity={getSeverity(r.key)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Allergen row */}
              {qcResult?.allergen_alerts.some((a) => !a.declared_in_artwork) && (
                <div className="mx-3 mb-3 mt-1 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <p className="text-xs font-bold text-red-700">⚠ Allergen not declared on label:</p>
                  {qcResult.allergen_alerts.filter((a) => !a.declared_in_artwork).map((a, i) => (
                    <p key={i} className="text-xs text-red-600 mt-0.5">· {a.allergen} found in ingredients but missing from artwork</p>
                  ))}
                </div>
              )}

              <div className="px-4 pb-3 pt-1">
                <Link href="/qc" className="text-xs text-[#2D6A4F] font-semibold hover:underline flex items-center gap-1">
                  View full QC report <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </>
          )}
        </div>

        {/* RIGHT 40%: FSSAI + SI ────────────────────────────────────────── */}
        <div className="col-span-2 space-y-4">

          {/* FSSAI Compliance */}
          <div className="bg-white rounded-xl border border-[#DCE8E0] shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#DCE8E0] bg-[#F8FBF9]">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#2D6A4F]" />
                <span className="font-bold text-sm text-[#1A2B22]" style={{ fontFamily: "Raleway, sans-serif" }}>FSSAI</span>
              </div>
              {fssaiResult && <StatusBadge status={fssaiResult.overall_status} size="xs" />}
            </div>
            <div className="p-4 space-y-1.5">
              {fssaiResult ? (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#4A6358]">Energy Cross-Check</span>
                    <StatusBadge status={fssaiResult.energy_check.status} size="xs" />
                  </div>
                  {fssaiResult.claim_validations.map((cv, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-[#4A6358] truncate mr-2 max-w-[140px]">{cv.claim}</span>
                      <StatusBadge status={cv.status} size="xs" />
                    </div>
                  ))}
                  {fssaiResult.sodium_flag && (
                    <div className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 rounded px-2 py-1 mt-1">
                      <AlertTriangle className="w-3 h-3" /> High sodium (&gt;800mg/100g)
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-[#7A9186]">Run analysis to see results</p>
              )}
              <Link href="/compliance" className="block mt-2 pt-2 border-t border-[#DCE8E0] text-xs text-[#2D6A4F] font-semibold hover:underline">
                Full compliance report →
              </Link>
            </div>
          </div>

          {/* Mandatory checklist quick view */}
          {qcResult && hasOCR && (
            <div className="bg-white rounded-xl border border-[#DCE8E0] shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[#DCE8E0] bg-[#F8FBF9]">
                <CheckCircle2 className="w-4 h-4 text-[#2D6A4F]" />
                <span className="font-bold text-sm text-[#1A2B22]" style={{ fontFamily: "Raleway, sans-serif" }}>
                  Mandatory Fields
                </span>
              </div>
              <div className="p-3 grid grid-cols-2 gap-1.5">
                {qcResult.mandatory_checklist.map((item, i) => (
                  <div key={i} className={cn("flex items-center gap-1.5 text-xs rounded px-2 py-1",
                    item.status === "FOUND" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                  )}>
                    {item.status === "FOUND"
                      ? <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                      : <XCircle className="w-3 h-3 flex-shrink-0" />
                    }
                    <span className="truncate">{item.item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SI Score pill */}
          {intelligenceResult && (
            <div className="bg-white rounded-xl border border-[#DCE8E0] shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-[#2D6A4F]" />
                <span className="font-bold text-sm text-[#1A2B22]" style={{ fontFamily: "Raleway, sans-serif" }}>Market Intelligence</span>
              </div>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-3xl font-bold text-[#2D6A4F]" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                  {intelligenceResult.si_score.toFixed(1)}
                </span>
                <span className="text-sm text-[#7A9186] mb-1">/5</span>
              </div>
              <p className="text-xs text-[#4A6358]">Cluster: <strong>{intelligenceResult.cluster}</strong></p>
              <p className="text-xs text-[#7A9186] mt-0.5">{intelligenceResult.alignment} alignment · {intelligenceResult.confidence} confidence</p>
              <Link href="/intelligence" className="block mt-2 pt-2 border-t border-[#DCE8E0] text-xs text-[#2D6A4F] font-semibold hover:underline">
                Full intelligence report →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Approve / Reject ────────────────────────────────────────────── */}
      <div className={cn(
        "rounded-xl border p-4 shadow-sm flex items-center justify-between gap-4",
        canApprove ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
      )}>
        <div className="flex items-center gap-3">
          {canApprove
            ? <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            : <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          }
          <div>
            <p className="text-sm font-bold text-[#1A2B22]">
              {canApprove ? "All critical checks passed — ready for approval" : "Critical issues require resolution before approval"}
            </p>
            <p className="text-xs text-[#7A9186] mt-0.5">
              {hasCriticalQC && `${criticalCount} critical QC mismatch${criticalCount !== 1 ? "es" : ""}. `}
              {hasComplianceFailure && "FSSAI claim failed. "}
              {canApprove && "Artwork matches master data within acceptable tolerance."}
            </p>
          </div>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <button onClick={() => alert("Artwork rejected. Team notified.")}
            className="px-5 py-2.5 rounded-xl border-2 border-red-400 text-red-600 text-sm font-bold hover:bg-red-100 transition-colors">
            Reject
          </button>
          <div className="relative group">
            <button disabled={!canApprove} onClick={() => alert("Artwork approved for print! ✓")}
              className={cn("px-5 py-2.5 rounded-xl text-sm font-bold transition-colors",
                canApprove ? "bg-[#2D6A4F] hover:bg-[#1E4D39] text-white" : "bg-gray-200 text-gray-400 cursor-not-allowed"
              )}>
              Approve for Print ✓
            </button>
            {!canApprove && (
              <div className="absolute bottom-full mb-2 right-0 bg-[#1A2B22] text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Resolve all critical issues first
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
