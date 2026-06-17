"use client";

import { useState } from "react";
import { useAnalysis } from "../../context/AnalysisContext";
import ArtworkViewer from "../../components/qc/ArtworkViewer";
import MismatchTable from "../../components/qc/MismatchTable";
import AllergenAlert from "../../components/qc/AllergenAlert";
import BarcodeValidator from "../../components/qc/BarcodeValidator";
import StatusBadge from "../../components/shared/StatusBadge";
import { CheckCircle2, XCircle, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";
import EmptyState from "../../components/shared/EmptyState";

function AccordionSection({
  title,
  defaultOpen = false,
  badge,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-[#DCE8E0] rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-[#EAF3DE] transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-[#1A2B22]">{title}</span>
          {badge}
        </div>
        {open ? (
          <ChevronDown className="w-4 h-4 text-[#7A9186]" />
        ) : (
          <ChevronRight className="w-4 h-4 text-[#7A9186]" />
        )}
      </button>
      {open && <div className="p-4 bg-white border-t border-[#DCE8E0]">{children}</div>}
    </div>
  );
}

export default function QCPage() {
  const { state } = useAnalysis();
  const { qcResult, productMeta, artworkFile } = state;
  const [activeField, setActiveField] = useState<string | null>(null);

  if (!qcResult) {
    return <EmptyState message="No QC results yet." />;
  }

  const criticalCount = qcResult.mismatches.filter((m) => m.severity === "CRITICAL").length +
    qcResult.allergen_alerts.filter((a) => !a.declared_in_artwork).length;

  return (
    <div className="space-y-4">
      {/* Status bar */}
      <div className="flex items-center gap-4 bg-white rounded-xl border border-[#DCE8E0] p-4 shadow-sm">
        <div className="flex-1">
          <p className="text-xs text-[#7A9186] uppercase font-semibold tracking-wide">QC Inspection Result</p>
          <p className="font-bold text-[#1A2B22]" style={{ fontFamily: "Raleway, sans-serif" }}>
            {productMeta.product_name} — {productMeta.sku}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#4A6358]">
            {criticalCount} critical {criticalCount === 1 ? "issue" : "issues"}
          </span>
          <StatusBadge status={qcResult.overall_status} size="md" />
        </div>
      </div>

      {/* Main split */}
      <div className="grid grid-cols-2 gap-5">
        {/* Left: Artwork viewer */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-[#7A9186] uppercase tracking-wide">Artwork Preview</h3>
          <ArtworkViewer
            artworkUrl={artworkFile}
            mismatches={qcResult.mismatches}
            activeField={activeField}
          />
          <p className="text-xs text-[#7A9186] text-center">
            Click a mismatch row to highlight the corresponding artwork region
          </p>
        </div>

        {/* Right: Validation report */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-[#7A9186] uppercase tracking-wide">Validation Report</h3>

          {/* Nutrition Verification */}
          <AccordionSection
            title="Nutrition Table Verification"
            defaultOpen
            badge={
              qcResult.mismatches.filter((m) => m.field !== "Allergen Declaration").length > 0 ? (
                <StatusBadge status="WARNING" size="xs" customLabel={`${qcResult.mismatches.filter(m => m.field !== "Allergen Declaration").length} mismatch`} />
              ) : (
                <StatusBadge status="PASS" size="xs" />
              )
            }
          >
            <MismatchTable
              mismatches={qcResult.mismatches.filter((m) => m.field !== "Allergen Declaration" && m.field !== "Barcode")}
              activeField={activeField}
              onSelect={setActiveField}
            />
          </AccordionSection>

          {/* Barcode */}
          <AccordionSection
            title="Barcode Verification"
            defaultOpen
            badge={
              qcResult.ocr_extract?.barcode_number === productMeta.barcode ? (
                <StatusBadge status="PASS" size="xs" />
              ) : (
                <StatusBadge status="FAIL" size="xs" />
              )
            }
          >
            <BarcodeValidator master={productMeta} ocr={qcResult.ocr_extract} />
          </AccordionSection>

          {/* Allergen */}
          <AccordionSection
            title="Allergen Cross-Check"
            defaultOpen
            badge={
              qcResult.allergen_alerts.some((a) => !a.declared_in_artwork) ? (
                <StatusBadge status="CRITICAL" size="xs" />
              ) : (
                <StatusBadge status="PASS" size="xs" />
              )
            }
          >
            <AllergenAlert qcResult={qcResult} />
          </AccordionSection>

          {/* Mandatory checklist */}
          <AccordionSection
            title="Mandatory Information Checklist"
            defaultOpen={false}
            badge={
              qcResult.mandatory_checklist.some((i) => i.status === "MISSING") ? (
                <StatusBadge status="MISSING" size="xs" customLabel="Items missing" />
              ) : (
                <StatusBadge status="FOUND" size="xs" customLabel="All present" />
              )
            }
          >
            <div className="grid grid-cols-2 gap-2">
              {qcResult.mandatory_checklist.map((item, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-lg text-xs",
                    item.status === "FOUND" ? "bg-green-50" : "bg-red-50"
                  )}
                >
                  {item.status === "FOUND" ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  )}
                  <span className={item.status === "FOUND" ? "text-green-800" : "text-red-800"}>
                    {item.item}
                  </span>
                </div>
              ))}
            </div>
          </AccordionSection>
        </div>
      </div>
    </div>
  );
}
