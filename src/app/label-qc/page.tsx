"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Product, NutritionBlock } from "../../lib/types";

// ─── Types ──────────────────────────────────────────────────────────────────

type OCRResult = {
  nutrition_table: Partial<Record<string, number | null>>;
  serving_size_g: number;
  barcode: string | null;
  allergens_declared: string[];
  claims_on_pack: string[];
  fssai_license: string | null;
  mrp: string | null;
  net_weight: string | null;
};

type NutrientRow = {
  label: string;
  masterKey: keyof NutritionBlock;
  ocrKey: string;
  unit: string;
  absFloor: number;
};

const NUTRIENT_ROWS: NutrientRow[] = [
  { label: "Energy",        masterKey: "energy_kcal",     ocrKey: "energy_kcal",     unit: "kcal", absFloor: 1 },
  { label: "Protein",       masterKey: "protein_g",       ocrKey: "protein_g",       unit: "g",    absFloor: 0.05 },
  { label: "Carbohydrates", masterKey: "carbohydrate_g",  ocrKey: "carbohydrate_g",  unit: "g",    absFloor: 0.05 },
  { label: "Total Sugar",   masterKey: "total_sugar_g",   ocrKey: "total_sugar_g",   unit: "g",    absFloor: 0.05 },
  { label: "Added Sugar",   masterKey: "added_sugar_g",   ocrKey: "added_sugar_g",   unit: "g",    absFloor: 0.05 },
  { label: "Dietary Fibre", masterKey: "dietary_fibre_g", ocrKey: "dietary_fibre_g", unit: "g",    absFloor: 0.05 },
  { label: "Total Fat",     masterKey: "total_fat_g",     ocrKey: "total_fat_g",     unit: "g",    absFloor: 0.05 },
  { label: "Saturated Fat", masterKey: "saturated_fat_g", ocrKey: "saturated_fat_g", unit: "g",    absFloor: 0.05 },
  { label: "Trans Fat",     masterKey: "trans_fat_g",     ocrKey: "trans_fat_g",     unit: "g",    absFloor: 0.05 },
  { label: "Sodium",        masterKey: "sodium_mg",       ocrKey: "sodium_mg",       unit: "mg",   absFloor: 1 },
  { label: "Calcium",       masterKey: "calcium_mg",      ocrKey: "calcium_mg",      unit: "mg",   absFloor: 1 },
];

const ALLERGEN_KEYWORDS: { name: string; patterns: RegExp[] }[] = [
  { name: "Wheat / Gluten", patterns: [/wheat/i, /gluten/i, /maida/i, /atta/i] },
  { name: "Milk / Dairy",   patterns: [/milk/i, /dairy/i, /whey/i, /lactose/i, /butter/i, /cream/i, /cheese/i, /casein/i] },
  { name: "Soya / Soy",     patterns: [/soy/i, /soya/i] },
  { name: "Peanut",         patterns: [/peanut/i, /groundnut/i] },
  { name: "Tree Nuts",      patterns: [/almond/i, /cashew/i, /walnut/i, /pistachio/i, /hazelnut/i, /pecan/i, /macadamia/i] },
  { name: "Mustard",        patterns: [/mustard/i] },
  { name: "Sesame",         patterns: [/sesame/i, /til/i] },
  { name: "Celery",         patterns: [/celery/i] },
];

function detectAllergens(ingredients: string): string[] {
  return ALLERGEN_KEYWORDS
    .filter(({ patterns }) => patterns.some((p) => p.test(ingredients)))
    .map(({ name }) => name);
}

type CompStatus = "PASS" | "WARNING" | "CRITICAL";

function calcStatus(master: number, ocr: number, absFloor: number): CompStatus {
  const absDiff = Math.abs(master - ocr);
  if (absDiff <= absFloor) return "PASS";
  const deviation = master !== 0 ? (absDiff / Math.abs(master)) * 100 : 100;
  if (deviation > 15 && absDiff > absFloor) return "CRITICAL";
  if (deviation >= 2 && absDiff > absFloor) return "WARNING";
  return "PASS";
}

function StatusChip({ status }: { status: CompStatus | "PASS" }) {
  const map = {
    PASS: { bg: "rgba(6,170,144,0.15)", color: "#06AA90", label: "PASS" },
    WARNING: { bg: "rgba(255,192,0,0.15)", color: "#FFC000", label: "WARNING" },
    CRITICAL: { bg: "rgba(232,64,64,0.15)", color: "#E84040", label: "CRITICAL" },
  };
  const s = map[status] || map.PASS;
  return (
    <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

// ─── Step 1: Product / Grammage Select ──────────────────────────────────────

function Step1({
  products,
  onProceed,
}: {
  products: Product[];
  onProceed: (product: Product, grammage: number) => void;
}) {
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [grammage, setGrammage] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 20);

  const masterBlock = selected?.nutrition.find((nb) => nb.grammage === grammage);

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: 32 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
        Label QC
      </h1>
      <p style={{ color: "var(--text-muted)", marginBottom: 28 }}>
        Select a product and grammage, then upload a label image to compare against master data.
      </p>

      {/* Product search */}
      <label style={{ display: "block", color: "var(--text-secondary)", fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Product
      </label>
      <div style={{ position: "relative" }} ref={dropdownRef}>
        <input
          type="text"
          placeholder="Search product name…"
          value={selected ? selected.name : search}
          onChange={(e) => {
            setSearch(e.target.value);
            setSelected(null);
            setGrammage(null);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          style={{
            width: "100%", padding: "10px 14px",
            borderRadius: 8, border: "1px solid var(--border)",
            background: "var(--bg-elevated)", color: "var(--text-primary)",
            fontSize: 14, outline: "none",
          }}
        />
        {showDropdown && filtered.length > 0 && (
          <div style={{
            position: "absolute", top: "100%", left: 0, right: 0,
            background: "var(--bg-elevated)", border: "1px solid var(--border)",
            borderRadius: 8, zIndex: 100, maxHeight: 240, overflowY: "auto",
            marginTop: 4,
          }}>
            {filtered.map((p) => (
              <div
                key={p.id}
                onClick={() => { setSelected(p); setSearch(p.name); setShowDropdown(false); setGrammage(null); }}
                style={{
                  padding: "10px 14px", cursor: "pointer", color: "var(--text-primary)", fontSize: 13,
                  borderBottom: "1px solid var(--border)",
                }}
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

      {/* Grammage selector */}
      {selected && selected.nutrition.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <label style={{ display: "block", color: "var(--text-secondary)", fontSize: 12, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Grammage
          </label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {selected.nutrition.map((nb) => (
              <button
                key={nb.grammage}
                onClick={() => setGrammage(nb.grammage)}
                style={{
                  padding: "8px 18px", borderRadius: 8,
                  border: `1px solid ${grammage === nb.grammage ? "var(--accent-teal)" : "var(--border)"}`,
                  background: grammage === nb.grammage ? "rgba(6,170,144,0.15)" : "transparent",
                  color: grammage === nb.grammage ? "var(--accent-teal)" : "var(--text-secondary)",
                  fontWeight: grammage === nb.grammage ? 600 : 400,
                  cursor: "pointer", fontSize: 14,
                }}
              >
                {nb.grammage}g
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Preview table */}
      {masterBlock && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Master values for {grammage}g
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <tbody>
              {NUTRIENT_ROWS.map(({ label, masterKey, unit }) => {
                const val = masterBlock[masterKey];
                if (val === null || val === undefined) return null;
                return (
                  <tr key={masterKey}>
                    <td style={{ padding: "5px 8px", color: "var(--text-secondary)", borderBottom: "1px solid var(--border)" }}>{label}</td>
                    <td style={{ padding: "5px 8px", color: "var(--text-primary)", textAlign: "right", fontVariantNumeric: "tabular-nums", borderBottom: "1px solid var(--border)" }}>
                      {val}{unit}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Proceed button */}
      {selected && grammage !== null && (
        <button
          onClick={() => onProceed(selected, grammage)}
          style={{
            marginTop: 24, padding: "12px 28px",
            background: "var(--accent-teal)", color: "#003433",
            border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14,
            cursor: "pointer",
          }}
        >
          Upload Label →
        </button>
      )}
    </div>
  );
}

// ─── Step 2: Upload + Results ────────────────────────────────────────────────

function Step2({
  product,
  grammage,
  onBack,
}: {
  product: Product;
  grammage: number;
  onBack: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OCRResult | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const masterBlock = product.nutrition.find((nb) => nb.grammage === grammage);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setResult(null);
    setOcrError(null);
    if (f.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setOcrError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/analyze-label", { method: "POST", body: fd });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data as OCRResult);
    } catch (e) {
      setOcrError(String(e));
    } finally {
      setLoading(false);
    }
  };

  // Allergen analysis
  const detectedAllergens = detectAllergens(product.ingredients);
  const declaredAllergens = (result?.allergens_declared || []).map((a) => a.toLowerCase());
  const allergenIssues = detectedAllergens.filter(
    (a) => !declaredAllergens.some((d) => d.includes(a.toLowerCase().split(" ")[0]))
  );

  // Determine if any CRITICAL issues
  const hasCritical =
    allergenIssues.length > 0 ||
    (result && masterBlock &&
      NUTRIENT_ROWS.some(({ masterKey, ocrKey, absFloor }) => {
        const masterVal = (masterBlock[masterKey] as number | null) ?? 0;
        const ocrVal = (result.nutrition_table?.[ocrKey] as number | null) ?? 0;
        return calcStatus(masterVal, ocrVal, absFloor) === "CRITICAL";
      }));

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <button
          onClick={onBack}
          style={{
            background: "none", border: "1px solid var(--border)", borderRadius: 8,
            padding: "8px 16px", color: "var(--text-secondary)", cursor: "pointer", fontSize: 13,
          }}
        >
          ← Back
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>
            Label QC — {product.name}
          </h1>
          <span style={{ color: "var(--text-muted)", fontSize: 13 }}>{grammage}g pack</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* LEFT: Upload */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Label Upload
          </div>

          {!file ? (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: "2px dashed var(--border)", borderRadius: 12,
                padding: "48px 24px", textAlign: "center", cursor: "pointer",
                background: "var(--bg-elevated)", minHeight: 280,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--accent-teal)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)"; }}
            >
              <div style={{ fontSize: 36, marginBottom: 12 }}>📤</div>
              <div style={{ color: "var(--text-primary)", fontWeight: 600, marginBottom: 6 }}>
                Drop label image or PDF here
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: 12 }}>
                JPG, PNG, or PDF supported
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                style={{ display: "none" }}
                onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
              />
            </div>
          ) : (
            <div>
              {preview ? (
                <img
                  src={preview}
                  alt="Label preview"
                  style={{ width: "100%", borderRadius: 10, objectFit: "contain", maxHeight: 400, background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
                />
              ) : (
                <div style={{ background: "var(--bg-elevated)", borderRadius: 10, padding: 24, border: "1px solid var(--border)", textAlign: "center" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
                  <div style={{ color: "var(--text-primary)", fontWeight: 500 }}>{file.name}</div>
                  <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 4 }}>PDF file</div>
                </div>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <button
                  onClick={() => { setFile(null); setPreview(null); setResult(null); }}
                  style={{
                    flex: 1, padding: "10px", borderRadius: 8,
                    border: "1px solid var(--border)", background: "transparent",
                    color: "var(--text-muted)", cursor: "pointer", fontSize: 13,
                  }}
                >
                  Re-upload
                </button>
                {!result && (
                  <button
                    onClick={handleAnalyze}
                    disabled={loading}
                    style={{
                      flex: 2, padding: "10px",
                      background: loading ? "var(--bg-elevated)" : "var(--accent-teal)",
                      color: loading ? "var(--text-muted)" : "#003433",
                      border: "none", borderRadius: 8, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontSize: 13,
                    }}
                  >
                    {loading ? "Analyzing…" : "Analyze Label"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Results */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            QC Results
          </div>

          {!file && (
            <div style={{ color: "var(--text-muted)", fontSize: 13, padding: "48px 0", textAlign: "center" }}>
              Upload a label to see results.
            </div>
          )}

          {file && !result && !loading && !ocrError && (
            <div style={{ color: "var(--text-muted)", fontSize: 13, padding: "48px 0", textAlign: "center" }}>
              Click "Analyze Label" to run OCR comparison.
            </div>
          )}

          {loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{
                  height: 36, borderRadius: 6, background: "var(--bg-elevated)",
                  opacity: 1 - i * 0.08,
                  animation: "pulse 1.5s ease-in-out infinite",
                }} />
              ))}
            </div>
          )}

          {ocrError && (
            <div style={{ background: "rgba(232,64,64,0.1)", border: "1px solid rgba(232,64,64,0.3)", borderRadius: 8, padding: 16, color: "var(--accent-red)" }}>
              OCR Error: {ocrError}
            </div>
          )}

          {result && masterBlock && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Serving size mismatch banner */}
              {result.serving_size_g && Math.abs(result.serving_size_g - grammage) > 1 && (
                <div style={{
                  background: "rgba(255,192,0,0.1)", border: "1px solid rgba(255,192,0,0.3)",
                  borderRadius: 8, padding: "10px 14px", color: "var(--accent-amber)", fontSize: 13,
                }}>
                  ⚠ Serving size mismatch: label says {result.serving_size_g}g, selected grammage is {grammage}g
                </div>
              )}

              {/* Comparison table */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Nutrient Comparison (vs {grammage}g master)
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "var(--bg-elevated)" }}>
                      {["Nutrient", "Master", "Label (OCR)", "Dev%", "Status"].map((h) => (
                        <th key={h} style={{ padding: "7px 8px", textAlign: h === "Nutrient" ? "left" : "right", color: "var(--text-muted)", fontWeight: 600, borderBottom: "1px solid var(--border)", fontSize: 11 }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {NUTRIENT_ROWS.map(({ label, masterKey, ocrKey, unit, absFloor }) => {
                      const masterVal = (masterBlock[masterKey] as number | null) ?? 0;
                      const ocrVal = (result.nutrition_table?.[ocrKey] as number | null) ?? 0;
                      const absDiff = Math.abs(masterVal - ocrVal);
                      const devPct = masterVal !== 0 ? ((absDiff / Math.abs(masterVal)) * 100).toFixed(1) : "—";
                      const status = calcStatus(masterVal, ocrVal, absFloor);
                      return (
                        <tr key={masterKey} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td style={{ padding: "6px 8px", color: "var(--text-secondary)" }}>{label}</td>
                          <td style={{ padding: "6px 8px", textAlign: "right", color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                            {masterVal}{unit}
                          </td>
                          <td style={{ padding: "6px 8px", textAlign: "right", color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                            {ocrVal}{unit}
                          </td>
                          <td style={{ padding: "6px 8px", textAlign: "right", color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>
                            {typeof devPct === "string" && devPct !== "—" ? `${devPct}%` : devPct}
                          </td>
                          <td style={{ padding: "6px 8px", textAlign: "right" }}>
                            <StatusChip status={status} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Allergen section */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Allergen Check
                </div>
                {detectedAllergens.length === 0 ? (
                  <div style={{ color: "var(--text-muted)", fontSize: 13 }}>No allergens detected in ingredients.</div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr>
                        {["Allergen", "In Ingredients", "Declared on Label", "Status"].map((h) => (
                          <th key={h} style={{ padding: "6px 8px", textAlign: "left", color: "var(--text-muted)", fontWeight: 600, borderBottom: "1px solid var(--border)", fontSize: 11 }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {detectedAllergens.map((allergen) => {
                        const isDeclared = declaredAllergens.some((d) =>
                          d.includes(allergen.toLowerCase().split(" ")[0]) ||
                          allergen.toLowerCase().split(" ").some((w) => d.includes(w))
                        );
                        return (
                          <tr key={allergen} style={{ borderBottom: "1px solid var(--border)" }}>
                            <td style={{ padding: "6px 8px", color: "var(--text-primary)" }}>{allergen}</td>
                            <td style={{ padding: "6px 8px", color: "var(--accent-teal)" }}>✓ Yes</td>
                            <td style={{ padding: "6px 8px", color: isDeclared ? "var(--accent-teal)" : "var(--accent-red)" }}>
                              {isDeclared ? "✓ Yes" : "✗ No"}
                            </td>
                            <td style={{ padding: "6px 8px" }}>
                              <StatusChip status={isDeclared ? "PASS" : "CRITICAL"} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Approve / Reject */}
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <button
                  style={{
                    flex: 1, padding: "12px", borderRadius: 8,
                    border: "1px solid var(--accent-red)", background: "transparent",
                    color: "var(--accent-red)", fontWeight: 700, cursor: "pointer", fontSize: 14,
                  }}
                >
                  Reject
                </button>
                <button
                  disabled={!!hasCritical}
                  style={{
                    flex: 2, padding: "12px", borderRadius: 8, border: "none",
                    background: hasCritical ? "var(--bg-elevated)" : "var(--accent-teal)",
                    color: hasCritical ? "var(--text-muted)" : "#003433",
                    fontWeight: 700, cursor: hasCritical ? "not-allowed" : "pointer", fontSize: 14,
                  }}
                >
                  Approve for Print ✓
                </button>
              </div>

              {hasCritical && (
                <div style={{ fontSize: 12, color: "var(--accent-red)", textAlign: "center" }}>
                  Resolve all CRITICAL issues before approving.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function LabelQCPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedGrammage, setSelectedGrammage] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setProducts(data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 48, color: "var(--text-muted)", textAlign: "center" }}>
        Loading products…
      </div>
    );
  }

  if (step === 2 && selectedProduct && selectedGrammage !== null) {
    return (
      <Step2
        product={selectedProduct}
        grammage={selectedGrammage}
        onBack={() => { setStep(1); }}
      />
    );
  }

  return (
    <Step1
      products={products}
      onProceed={(product, grammage) => {
        setSelectedProduct(product);
        setSelectedGrammage(grammage);
        setStep(2);
      }}
    />
  );
}
