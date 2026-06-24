"use client";

import { useEffect, useState } from "react";
import { Product, NutritionBlock, RDABlock } from "../../lib/types";
import { validateClaims, calcEnergy, ClaimResult, SODIUM_THRESHOLD } from "../../lib/fssai";

const NUTRIENT_ROWS: { label: string; key: keyof NutritionBlock; rdaKey?: keyof RDABlock; unit: string }[] = [
  { label: "Energy",        key: "energy_kcal",     rdaKey: "energy_pct",        unit: "kcal" },
  { label: "Protein",       key: "protein_g",       rdaKey: "protein_pct",       unit: "g"    },
  { label: "Carbohydrates", key: "carbohydrate_g",  rdaKey: undefined,           unit: "g"    },
  { label: "Total Sugar",   key: "total_sugar_g",   rdaKey: undefined,           unit: "g"    },
  { label: "Added Sugar",   key: "added_sugar_g",   rdaKey: "added_sugar_pct",   unit: "g"    },
  { label: "Dietary Fibre", key: "dietary_fibre_g", rdaKey: "dietary_fibre_pct", unit: "g"    },
  { label: "Total Fat",     key: "total_fat_g",     rdaKey: "total_fat_pct",     unit: "g"    },
  { label: "Saturated Fat", key: "saturated_fat_g", rdaKey: "saturated_fat_pct", unit: "g"    },
  { label: "Trans Fat",     key: "trans_fat_g",     rdaKey: "trans_fat_pct",     unit: "g"    },
  { label: "Sodium",        key: "sodium_mg",       rdaKey: "sodium_pct",        unit: "mg"   },
  { label: "Calcium",       key: "calcium_mg",      rdaKey: "calcium_pct",       unit: "mg"   },
];

function StatusChip({ status, label }: { status: "pass" | "fail" | "warning" | "neutral" | "factual" | "custom"; label?: string }) {
  const map = {
    pass:    { bg: "rgba(6,170,144,0.15)",   color: "#06AA90", text: label || "PASS" },
    fail:    { bg: "rgba(232,64,64,0.15)",   color: "#E84040", text: label || "FAIL" },
    warning: { bg: "rgba(255,192,0,0.15)",   color: "#FFC000", text: label || "WARNING" },
    neutral: { bg: "rgba(155,191,190,0.15)", color: "#9BBFBE", text: label || "INFO" },
    factual: { bg: "rgba(183,200,21,0.15)",  color: "#B7C815", text: label || "FACTUAL" },
    custom:  { bg: "rgba(255,192,0,0.15)",   color: "#FFC000", text: label || "CUSTOM" },
  };
  const s = map[status] || map.neutral;
  return (
    <span style={{ padding: "3px 10px", borderRadius: 4, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color }}>
      {s.text}
    </span>
  );
}

function fmtVal(val: number | null | undefined, unit: string): string {
  if (val === null || val === undefined) return "—";
  return `${Number(val.toFixed(2))}${unit}`;
}

export default function FSSAIClaimsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setProducts(data); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 20);

  // Get 100g nutrition block
  const n100 = selected?.nutrition.find((nb) => Math.abs(nb.grammage - 100) < 1);

  // Claim validation
  const claimResults: ClaimResult[] = selected && n100
    ? validateClaims(selected.brand_usp, n100)
    : [];

  // Compliance checks
  const reportedEnergy = n100?.energy_kcal ?? 0;
  const calculatedEnergy = n100 ? calcEnergy(n100) : 0;
  const energyDevPct = reportedEnergy !== 0
    ? Math.abs((reportedEnergy - calculatedEnergy) / reportedEnergy) * 100
    : 0;
  const energyStatus = energyDevPct <= 5 ? "pass" : "warning";

  const sodiumVal = n100?.sodium_mg ?? null;
  const sodiumStatus = sodiumVal !== null && sodiumVal > SODIUM_THRESHOLD ? "warning" : "pass";

  // Per-serving values
  const serving = selected?.serving_size_g ?? 100;
  const factor = serving / 100;

  // Find RDA block closest to serving size
  const rdaBlock = selected?.rda.reduce<RDABlock | undefined>((best, rb) => {
    if (!best) return rb;
    return Math.abs(rb.grammage - serving) < Math.abs(best.grammage - serving) ? rb : best;
  }, undefined);
  const rdaMatch = rdaBlock && Math.abs(rdaBlock.grammage - serving) < 5 ? rdaBlock : undefined;

  // Overall status
  const anyClaimFail = claimResults.some((r) => r.status === "fail");
  const needsReview = energyStatus === "warning" || sodiumStatus === "warning";
  const overallStatus = anyClaimFail ? "NON_COMPLIANT" : needsReview ? "REVIEW_REQUIRED" : "COMPLIANT";

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
        FSSAI Claims
      </h1>
      <p style={{ color: "var(--text-muted)", marginBottom: 28 }}>
        Validate brand USP claims against FSSAI nutrient thresholds and run compliance checks.
      </p>

      {/* Product selector */}
      <div style={{ maxWidth: 480, position: "relative", marginBottom: 32 }}>
        <input
          type="text"
          placeholder="Search product…"
          value={selected ? selected.name : search}
          onChange={(e) => { setSearch(e.target.value); setSelected(null); setShowDropdown(true); }}
          onFocus={() => setShowDropdown(true)}
          disabled={loading}
          style={{
            width: "100%", padding: "10px 14px", borderRadius: 8,
            border: "1px solid var(--border)", background: "var(--bg-elevated)",
            color: "var(--text-primary)", fontSize: 14, outline: "none",
          }}
        />
        {showDropdown && filtered.length > 0 && (
          <div style={{
            position: "absolute", top: "100%", left: 0, right: 0,
            background: "var(--bg-elevated)", border: "1px solid var(--border)",
            borderRadius: 8, zIndex: 100, maxHeight: 240, overflowY: "auto", marginTop: 4,
          }}>
            {filtered.map((p) => (
              <div
                key={p.id}
                onClick={() => { setSelected(p); setSearch(p.name); setShowDropdown(false); }}
                style={{ padding: "10px 14px", cursor: "pointer", color: "var(--text-primary)", fontSize: 13, borderBottom: "1px solid var(--border)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "var(--bg-surface)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
              >
                <span style={{ fontWeight: 500 }}>{p.name}</span>
                <span style={{ color: "var(--text-muted)", fontSize: 11, marginLeft: 8 }}>{p.sheet}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && !n100 && (
        <div style={{ background: "rgba(255,192,0,0.1)", border: "1px solid rgba(255,192,0,0.3)", borderRadius: 8, padding: 16, color: "var(--accent-amber)", marginBottom: 24 }}>
          No 100g nutrition block found for this product. Claims cannot be validated without per-100g values.
        </div>
      )}

      {selected && n100 && (
        <>
          {/* Overall Status Banner */}
          <div style={{
            borderRadius: 10, padding: "14px 20px", marginBottom: 28,
            background: overallStatus === "NON_COMPLIANT" ? "rgba(232,64,64,0.1)" :
                        overallStatus === "REVIEW_REQUIRED" ? "rgba(255,192,0,0.1)" :
                        "rgba(6,170,144,0.1)",
            border: `1px solid ${overallStatus === "NON_COMPLIANT" ? "rgba(232,64,64,0.3)" :
                                  overallStatus === "REVIEW_REQUIRED" ? "rgba(255,192,0,0.3)" :
                                  "rgba(6,170,144,0.3)"}`,
            color: overallStatus === "NON_COMPLIANT" ? "var(--accent-red)" :
                   overallStatus === "REVIEW_REQUIRED" ? "var(--accent-amber)" :
                   "var(--accent-teal)",
            fontWeight: 700, fontSize: 15,
          }}>
            {overallStatus === "NON_COMPLIANT" && "✗ NON-COMPLIANT — One or more claims fail FSSAI thresholds"}
            {overallStatus === "REVIEW_REQUIRED" && "⚠ REVIEW REQUIRED — Energy deviation or sodium flag detected"}
            {overallStatus === "COMPLIANT" && "✓ COMPLIANT — All claims validated, no flags raised"}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, alignItems: "start" }}>
            {/* LEFT: Claim Validation Matrix */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Claim Validation Matrix
              </div>
              {claimResults.length === 0 ? (
                <div style={{ color: "var(--text-muted)", fontSize: 13 }}>No USP claims found for this product.</div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr>
                      {["Claim", "Type", "Threshold", "Actual (100g)", "Status"].map((h) => (
                        <th key={h} style={{ padding: "7px 8px", textAlign: "left", color: "var(--text-muted)", fontWeight: 600, borderBottom: "1px solid var(--border)", fontSize: 11 }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {claimResults.map((r, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "8px 8px", color: "var(--text-primary)", fontWeight: 500 }}>{r.claim}</td>
                        <td style={{ padding: "8px 8px", color: "var(--text-secondary)" }}>{r.type}</td>
                        <td style={{ padding: "8px 8px", color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>
                          {r.threshold || (r.type === "factual" ? "Factual claim — verified by ingredients" : "Custom — manual review required")}
                        </td>
                        <td style={{ padding: "8px 8px", color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                          {r.actual || "—"}
                        </td>
                        <td style={{ padding: "8px 8px" }}>
                          <StatusChip status={r.status === "pass" ? "pass" : r.status === "fail" ? "fail" : r.status === "factual" ? "factual" : "custom"} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* RIGHT: Compliance Checks */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Energy Cross-Check */}
              <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Energy Cross-Check
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: "5px 0", color: "var(--text-secondary)" }}>Reported (100g)</td>
                      <td style={{ padding: "5px 0", textAlign: "right", color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{reportedEnergy} kcal</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "5px 0", color: "var(--text-secondary)" }}>Calculated (4C+4P+9F)</td>
                      <td style={{ padding: "5px 0", textAlign: "right", color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{calculatedEnergy.toFixed(1)} kcal</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "5px 0", color: "var(--text-secondary)" }}>Deviation</td>
                      <td style={{ padding: "5px 0", textAlign: "right", color: energyStatus === "warning" ? "var(--accent-amber)" : "var(--accent-teal)", fontVariantNumeric: "tabular-nums" }}>
                        {energyDevPct.toFixed(1)}%
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: "5px 0", color: "var(--text-secondary)" }}>Status</td>
                      <td style={{ padding: "5px 0", textAlign: "right" }}>
                        <StatusChip status={energyStatus} label={energyStatus === "pass" ? "PASS (≤5%)" : "WARNING (>5%)"} />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Sodium Check */}
              <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Sodium Check
                </div>
                <div style={{ fontSize: 11, color: "var(--accent-amber)", marginBottom: 10 }}>
                  ⚠ Snackible Internal Standard (not FSSAI regulation): flag if sodium &gt; {SODIUM_THRESHOLD}mg/100g
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: "5px 0", color: "var(--text-secondary)" }}>Value (per 100g)</td>
                      <td style={{ padding: "5px 0", textAlign: "right", color: sodiumStatus === "warning" ? "var(--accent-amber)" : "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                        {sodiumVal !== null ? `${sodiumVal} mg` : "—"}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: "5px 0", color: "var(--text-secondary)" }}>Threshold</td>
                      <td style={{ padding: "5px 0", textAlign: "right", color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>{SODIUM_THRESHOLD} mg</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "5px 0", color: "var(--text-secondary)" }}>Status</td>
                      <td style={{ padding: "5px 0", textAlign: "right" }}>
                        <StatusChip status={sodiumStatus} label={sodiumStatus === "pass" ? "PASS" : "WARNING"} />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Full Nutrition Table */}
          <div style={{ marginTop: 32 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Full Nutrition Table
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "var(--bg-elevated)" }}>
                  {[`Nutrient`, `Per 100g`, `Per Serving (${serving}g)`, `%RDA`].map((h) => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: h === "Nutrient" ? "left" : "right", color: "var(--text-muted)", fontWeight: 600, borderBottom: "1px solid var(--border)", fontSize: 11 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {NUTRIENT_ROWS.map(({ label, key, rdaKey, unit }, idx) => {
                  const val100 = n100[key] as number | null;
                  const valServing = val100 !== null ? val100 * factor : null;
                  const rdaPct = rdaKey && rdaMatch ? (rdaMatch[rdaKey] as number | null) : null;
                  const isSodiumHigh = key === "sodium_mg" && val100 !== null && val100 > SODIUM_THRESHOLD;
                  return (
                    <tr
                      key={key}
                      style={{
                        background: isSodiumHigh ? "rgba(255,192,0,0.06)" : idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      <td style={{ padding: "8px 12px", color: isSodiumHigh ? "var(--accent-amber)" : "var(--text-secondary)" }}>
                        {label}
                        {isSodiumHigh && <span style={{ marginLeft: 6, fontSize: 10 }}>⚠</span>}
                      </td>
                      <td style={{ padding: "8px 12px", textAlign: "right", color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                        {fmtVal(val100, unit)}
                      </td>
                      <td style={{ padding: "8px 12px", textAlign: "right", color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>
                        {fmtVal(valServing, unit)}
                      </td>
                      <td style={{ padding: "8px 12px", textAlign: "right", color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>
                        {rdaPct !== null && rdaPct !== undefined ? `${rdaPct}%` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!rdaMatch && (
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>
                No RDA block found matching serving size {serving}g. %RDA values not available from sheet.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
