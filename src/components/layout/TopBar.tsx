"use client";

import { usePathname } from "next/navigation";
import { useAnalysis } from "../../context/AnalysisContext";

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Unified Dashboard", subtitle: "Full analysis overview — compliance + QC + intelligence" },
  "/compliance": { title: "FSSAI Compliance", subtitle: "Layer 1 — Regulatory compliance engine (binary pass/fail)" },
  "/qc": { title: "Packaging QC", subtitle: "Layer 3 — Artwork validation & mismatch inspector" },
  "/intelligence": { title: "Market Intelligence", subtitle: "Layer 2 — Medha brand strategy engine" },
  "/upload": { title: "Run New Analysis", subtitle: "Ingest product data for full 3-layer analysis" },
};

export default function TopBar() {
  const pathname = usePathname();
  const { state } = useAnalysis();
  const meta = PAGE_META[pathname] || { title: "Snackible Platform", subtitle: "" };

  return (
    <header className="h-14 bg-white border-b border-[#DCE8E0] flex items-center px-6 justify-between flex-shrink-0">
      <div>
        <h1
          className="text-[15px] font-bold text-[#1A2B22] leading-tight"
          style={{ fontFamily: "Raleway, sans-serif" }}
        >
          {meta.title}
        </h1>
        <p className="text-[11px] text-[#7A9186]">{meta.subtitle}</p>
      </div>
      {state.hasAnalysis && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#7A9186]">Current SKU:</span>
          <span className="font-semibold text-[#1A2B22]">{state.productMeta.product_name}</span>
          <span className="bg-[#EAF3DE] text-[#2D6A4F] px-2 py-0.5 rounded-full font-semibold text-[11px]">
            {state.productMeta.sku}
          </span>
          {state.isDemo && (
            <span className="bg-[#FEF3D8] text-[#FBAE25] px-2 py-0.5 rounded-full font-semibold text-[11px]">
              Demo
            </span>
          )}
        </div>
      )}
    </header>
  );
}
