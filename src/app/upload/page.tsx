"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAnalysis } from "../../context/AnalysisContext";
import { NutritionPer100g, ProductMeta, QCResult, QCMismatch, OCRExtract } from "../../lib/types";
import FileUpload from "../../components/shared/FileUpload";
import ProductSelector from "../../components/shared/ProductSelector";
import { runFSSAIEngine } from "../../lib/fssai-engine";
import { runBenchmarkEngine } from "../../lib/benchmark-engine";
import { checkAllergenDeclaration } from "../../lib/allergen-matrix";
import { SheetProduct, PackPrice, scaleNutrition } from "../../lib/sheet-parser";
import { Loader2, ChevronDown, RefreshCw } from "lucide-react";
import { cn } from "../../lib/utils";

const CLAIM_OPTIONS = [
  "High Protein","Source of Protein","Rich in Dietary Fibre","Source of Dietary Fibre",
  "High Calcium","Source of Calcium","Gluten Free","No Added Sugar",
  "Baked Not Fried","No Palm Oil","Millet Based","Multigrain",
];
const CATEGORIES   = ["Fried","Baked","Roasted","Popped"];
const OIL_TYPES    = ["Rice Bran Oil","Palm Oil","Sunflower Oil","Coconut Oil","Other"];
const REGIONS      = ["Mumbai","Bangalore","Delhi-NCR","Pune","Hyderabad"];
const DEMOGRAPHICS = ["18-24 Male","18-24 Female","25-34 Male","25-34 Female","35-44","General"];

// ── QC comparison: OCR vs master ──────────────────────────────────────────────
function buildQCResult(
  masterPer100g: NutritionPer100g,
  grammageSections: Record<number, NutritionPer100g>,
  selectedPackG: number,
  masterIngredients: string[],
  masterBarcode: string,
  ocrExtract: OCRExtract | null
): { qcResult: QCResult; masterAtPack: NutritionPer100g; ocrAtPack: Partial<NutritionPer100g> | null } {
  const mismatches: QCMismatch[] = [];

  // Master values at the selected pack size:
  // Use exact sheet values if available, otherwise scale from per-100g
  const masterAtPack: NutritionPer100g =
    grammageSections[selectedPackG] ?? scaleNutrition(masterPer100g, selectedPackG / 100);

  // OCR values — the OCR now returns per-serving values + serving_size_g
  let ocrAtPack: Partial<NutritionPer100g> | null = null;
  if (ocrExtract?.nutrition_table) {
    const ocrServingG = ocrExtract.serving_size_g ?? selectedPackG;
    if (Math.abs(ocrServingG - selectedPackG) < 1) {
      // Same scale — use directly
      ocrAtPack = ocrExtract.nutrition_table;
    } else {
      // Different scale — convert OCR to selectedPackG
      const scale = selectedPackG / ocrServingG;
      ocrAtPack = scaleNutrition(ocrExtract.nutrition_table as NutritionPer100g, scale);
    }
  }

  if (ocrAtPack) {
    const ocr = ocrAtPack as Record<string, number | null>;
    const master = masterAtPack as unknown as Record<string, number>;

    const FIELDS: Array<{ key: string; label: string; unit: string }> = [
      { key: "energy_kcal",     label: "Energy",        unit: " kcal" },
      { key: "protein_g",       label: "Protein",       unit: "g" },
      { key: "total_fat_g",     label: "Total Fat",     unit: "g" },
      { key: "saturated_fat_g", label: "Saturated Fat", unit: "g" },
      { key: "trans_fat_g",     label: "Trans Fat",     unit: "g" },
      { key: "carbohydrates_g", label: "Carbohydrates", unit: "g" },
      { key: "total_sugar_g",   label: "Total Sugar",   unit: "g" },
      { key: "added_sugar_g",   label: "Added Sugar",   unit: "g" },
      { key: "dietary_fibre_g", label: "Dietary Fibre", unit: "g" },
      { key: "sodium_mg",       label: "Sodium",        unit: "mg" },
      { key: "calcium_mg",      label: "Calcium",       unit: "mg" },
      { key: "cholesterol_mg",    label: "Cholesterol",    unit: "mg" },
      { key: "unsaturated_fat_g", label: "Unsaturated Fat", unit: "g"  },
    ];

    // Absolute tolerance floors: label rounding means e.g. 1.95g vs 1.96g is acceptable
    const ABS_FLOOR: Record<string, number> = {
      energy_kcal: 1, protein_g: 0.05, total_fat_g: 0.05, saturated_fat_g: 0.05,
      trans_fat_g: 0.05, carbohydrates_g: 0.05, total_sugar_g: 0.05, added_sugar_g: 0.05,
      dietary_fibre_g: 0.05, sodium_mg: 1, calcium_mg: 1, cholesterol_mg: 1, unsaturated_fat_g: 0.05,
    };

    for (const f of FIELDS) {
      const masterVal = master[f.key];
      const ocrVal = ocr[f.key];
      if (ocrVal == null || masterVal == null || masterVal === 0) continue;

      const absDiff = Math.abs(masterVal - ocrVal);
      const floor = ABS_FLOOR[f.key] ?? 0.05;
      if (absDiff <= floor) continue; // within label-rounding tolerance

      const diff = absDiff / masterVal;
      if (diff > 0.15) {
        mismatches.push({
          field: f.label,
          master_value: `${masterVal}${f.unit}`,
          artwork_value: `${ocrVal}${f.unit}`,
          severity: "CRITICAL",
          message: `${f.label}: label shows ${ocrVal}${f.unit}, master is ${masterVal}${f.unit} (${(diff * 100).toFixed(1)}% off)`,
        });
      } else if (diff > 0.001) {
        mismatches.push({
          field: f.label,
          master_value: `${masterVal}${f.unit}`,
          artwork_value: `${ocrVal}${f.unit}`,
          severity: "WARNING",
          message: `${f.label}: label ${ocrVal}${f.unit} ≠ master ${masterVal}${f.unit} (${(diff * 100).toFixed(2)}% off)`,
        });
      }
    }
  }

  const allergenAlerts = checkAllergenDeclaration(
    masterIngredients,
    ocrExtract?.allergen_declaration ?? null
  );

  const mandatory_checklist: QCResult["mandatory_checklist"] = [
    { item: "FSSAI License No.",      status: ocrExtract?.fssai_license ? "FOUND" : "MISSING" },
    { item: "Net Weight",             status: ocrExtract?.net_weight ? "FOUND" : "MISSING" },
    { item: "MRP",                    status: ocrExtract?.mrp_printed ? "FOUND" : "MISSING" },
    { item: "Veg/Non-Veg Symbol",     status: ocrExtract?.veg_symbol_present ? "FOUND" : "MISSING" },
    { item: "Mfg. Details",           status: ocrExtract?.manufacturing_details_present ? "FOUND" : "MISSING" },
    { item: "Customer Care",          status: ocrExtract?.customer_care_present ? "FOUND" : "MISSING" },
    { item: "Batch/Expiry Space",     status: ocrExtract?.batch_space_present ? "FOUND" : "MISSING" },
    { item: "Allergen Declaration",   status: ocrExtract?.allergen_declaration ? "FOUND" : "MISSING" },
  ];

  const hasCritical =
    mismatches.some((m) => m.severity === "CRITICAL") ||
    allergenAlerts.some((a) => !a.declared_in_artwork);
  const hasWarning = mismatches.some((m) => m.severity === "WARNING");

  const qcResult: QCResult = {
    mismatches,
    allergen_alerts: allergenAlerts,
    mandatory_checklist,
    ocr_extract: ocrExtract,
    overall_status: hasCritical ? "FAIL" : hasWarning ? "REVIEW" : "PASS",
  };

  return { qcResult, masterAtPack, ocrAtPack };
}

// ── UI helpers ────────────────────────────────────────────────────────────────
function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-[#DCE8E0] p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="font-bold text-[#1A2B22]" style={{ fontFamily: "Raleway, sans-serif" }}>{title}</h3>
        {subtitle && <p className="text-xs text-[#7A9186] mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-semibold text-[#4A6358] mb-1">{children}</label>;
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full border border-[#DCE8E0] rounded-lg px-3 py-2 text-sm text-[#1A2B22] focus:outline-none focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] bg-white"
    />
  );
}

function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        {...props}
        className="w-full border border-[#DCE8E0] rounded-lg px-3 py-2 text-sm text-[#1A2B22] focus:outline-none focus:border-[#2D6A4F] appearance-none bg-white pr-8"
      >
        {children}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A9186] pointer-events-none" />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function UploadPage() {
  const router = useRouter();
  const { dispatch } = useAnalysis();
  const [loading, setLoading]   = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [loaded, setLoaded]     = useState(false);
  const [nutritionMode, setNutritionMode] = useState<"manual" | "file">("manual");
  const [grammageSections, setGrammageState] = useState<Record<number, NutritionPer100g>>({});
  const [selectedPackG, setSelectedPackG] = useState(0);

  const [meta, setMeta]               = useState<ProductMeta>({
    sku: "", product_name: "", pack_weight_g: 0, serving_size_g: 0,
    mrp: 0, barcode: "", oil_type: "Rice Bran Oil", product_category: "Fried",
    ingredients_list: [], claims_on_pack: [],
  });
  const [nutrition, setNutrition]     = useState<NutritionPer100g>({
    energy_kcal: 0, protein_g: 0, total_fat_g: 0, saturated_fat_g: 0,
    trans_fat_g: 0, carbohydrates_g: 0, total_sugar_g: 0, added_sugar_g: 0,
    dietary_fibre_g: 0, sodium_mg: 0, calcium_mg: 0,
  });
  const [ingredientsText, setIngredientsText] = useState("");
  const [selectedClaims, setSelectedClaims]   = useState<string[]>([]);
  const [customClaim, setCustomClaim] = useState("");

  // Artwork: store both the File (for sending to OCR) and the base64 preview (for display)
  const [artworkFile, setArtworkFile]       = useState<File | null>(null);
  const [artworkPreview, setArtworkPreview] = useState<string | null>(null);
  const [artworkBase64, setArtworkBase64]   = useState<string | null>(null);

  const [proposedClaim, setProposedClaim] = useState("");
  const [region, setRegion]           = useState("Bangalore");
  const [demographic, setDemographic] = useState("25-34 Female");

  // ── Sheet product loader ───────────────────────────────────────────────────
  function handleSheetSelect(product: SheetProduct, pack: PackPrice) {
    setGrammageState(product.grammage_sections);
    setSelectedPackG(pack.pack_weight_g);
    setMeta({
      sku:              "",
      product_name:     product.product_name,
      pack_weight_g:    pack.pack_weight_g,
      serving_size_g:   product.serving_size_g || Math.round(pack.pack_weight_g / 2),
      mrp:              pack.mrp || 0,
      barcode:          "",
      oil_type:         product.oil_type,
      product_category: product.product_category,
      ingredients_list: product.ingredients_list,
      claims_on_pack:   product.claims,
    });
    setNutrition(product.nutrition);
    setIngredientsText(product.ingredients_list.join(", "));
    const matchedClaims = CLAIM_OPTIONS.filter((opt) =>
      product.claims.some((c) => c.toLowerCase().includes(opt.toLowerCase()) || opt.toLowerCase().includes(c.toLowerCase()))
    );
    setSelectedClaims(matchedClaims);
    setProposedClaim(product.claims.slice(0, 2).join(", "));
    setLoaded(true);
  }

  function toggleClaim(claim: string) {
    setSelectedClaims((prev) =>
      prev.includes(claim) ? prev.filter((c) => c !== claim) : [...prev, claim]
    );
  }

  // ── Run analysis ───────────────────────────────────────────────────────────
  async function handleRunAnalysis() {
    setLoading(true);

    const allClaims = [...selectedClaims, ...(customClaim.trim() ? [customClaim.trim()] : [])];
    const ingredientsList = ingredientsText.split(",").map((s) => s.trim()).filter(Boolean);
    const fullMeta: ProductMeta = { ...meta, ingredients_list: ingredientsList, claims_on_pack: allClaims };

    // Step 1: FSSAI + benchmarks (local, instant)
    setLoadingStep("Running FSSAI compliance checks…");
    const fssaiResult    = runFSSAIEngine(nutrition, fullMeta);
    const benchmarkResults = runBenchmarkEngine(nutrition, fullMeta);

    // Step 2: OCR the artwork via Claude Vision
    let ocrExtract: OCRExtract | null = null;
    setOcrError(null);
    if (artworkFile) {
      setLoadingStep("Reading label with OCR…");
      try {
        const formData = new FormData();
        formData.append("file", artworkFile);
        const ocrRes = await fetch("/api/analyze-artwork", { method: "POST", body: formData });
        const ocrData = await ocrRes.json();
        if (ocrRes.ok && !ocrData.error) {
          ocrExtract = ocrData;
        } else {
          setOcrError(`OCR failed: ${ocrData.detail || ocrData.error || "unknown error"}`);
        }
      } catch (e) {
        setOcrError(`OCR request failed: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    // Step 3: Build real QC result from OCR vs master (compared at selected pack weight)
    setLoadingStep("Comparing label against master data…");
    const packG = selectedPackG || meta.pack_weight_g || 100;
    const { qcResult, masterAtPack, ocrAtPack } = buildQCResult(
      nutrition, grammageSections, packG, ingredientsList, meta.barcode, ocrExtract
    );

    // Step 4: Market intelligence (optional, falls back to mock)
    setLoadingStep("Running market intelligence…");
    let intelligenceResult = null;
    try {
      const res = await fetch("/api/analyze-claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claim: proposedClaim,
          category: fullMeta.product_category,
          region,
          product_name: fullMeta.product_name,
          nutrition_summary: {
            protein: nutrition.protein_g,
            fat: nutrition.total_fat_g,
            fibre: nutrition.dietary_fibre_g,
          },
          competitor_data: [],
        }),
      });
      if (res.ok) intelligenceResult = await res.json();
    } catch { /* fallback to mock */ }

    dispatch({
      type: "SET_ANALYSIS",
      payload: {
        productMeta: fullMeta,
        nutrition,
        fssaiResult,
        benchmarkResults,
        qcResult,
        intelligenceResult,
        artworkFile: artworkPreview || artworkBase64,
        comparisonPackG: packG,
        masterAtPack,
        ocrAtPack,
        ocrServingG: ocrExtract?.serving_size_g ?? null,
      },
    });

    setLoadingStep("Done!");
    await new Promise((r) => setTimeout(r, 400));
    setLoading(false);
    router.push("/dashboard");
  }

  const nField = (key: keyof NutritionPer100g) => ({
    value: nutrition[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setNutrition((p) => ({ ...p, [key]: parseFloat(e.target.value) || 0 })),
  });

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* ── 0. Load from Sheet ─────────────────────────────────────────── */}
      <SectionCard
        title="0. Load from Master Sheet"
        subtitle="Auto-populate all fields by selecting a product from the database"
      >
        <ProductSelector onSelect={handleSheetSelect} />
        {loaded && (
          <div className="mt-3 flex items-center gap-2 text-xs text-[#2D6A4F] font-semibold bg-[#EAF3DE] px-3 py-2 rounded-lg">
            <RefreshCw className="w-3.5 h-3.5" />
            Fields auto-populated from master sheet. Review and adjust below before running analysis.
          </div>
        )}
      </SectionCard>

      {/* ── 1. Product Info ────────────────────────────────────────────── */}
      <SectionCard title="1. Product Information">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label>Product Name</Label>
            <Input value={meta.product_name} onChange={(e) => setMeta((p) => ({ ...p, product_name: e.target.value }))} />
          </div>
          <div>
            <Label>SKU Code</Label>
            <Input placeholder="e.g. RG-01" value={meta.sku} onChange={(e) => setMeta((p) => ({ ...p, sku: e.target.value }))} />
          </div>
          <div>
            <Label>Barcode</Label>
            <Input placeholder="8906123456789" value={meta.barcode} onChange={(e) => setMeta((p) => ({ ...p, barcode: e.target.value }))} />
          </div>
          <div>
            <Label>Pack Weight (g)</Label>
            <Input type="number" value={meta.pack_weight_g} onChange={(e) => setMeta((p) => ({ ...p, pack_weight_g: parseFloat(e.target.value) || 0 }))} />
          </div>
          <div>
            <Label>Serving Size (g)</Label>
            <Input type="number" value={meta.serving_size_g} onChange={(e) => setMeta((p) => ({ ...p, serving_size_g: parseFloat(e.target.value) || 0 }))} />
          </div>
          <div>
            <Label>MRP (₹)</Label>
            <Input type="number" value={meta.mrp} onChange={(e) => setMeta((p) => ({ ...p, mrp: parseFloat(e.target.value) || 0 }))} />
          </div>
          <div>
            <Label>Product Category</Label>
            <Select value={meta.product_category} onChange={(e) => setMeta((p) => ({ ...p, product_category: e.target.value }))}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </Select>
          </div>
          <div>
            <Label>Oil Type</Label>
            <Select value={meta.oil_type} onChange={(e) => setMeta((p) => ({ ...p, oil_type: e.target.value }))}>
              {OIL_TYPES.map((o) => <option key={o}>{o}</option>)}
            </Select>
          </div>
        </div>
      </SectionCard>

      {/* ── 2. Nutrition ───────────────────────────────────────────────── */}
      <SectionCard title="2. Nutrition (per 100g)" subtitle="These are the master data values the label will be compared against">
        <div className="flex gap-2 mb-4">
          {(["manual", "file"] as const).map((m) => (
            <button key={m} onClick={() => setNutritionMode(m)}
              className={cn("px-4 py-1.5 rounded-full text-xs font-semibold transition-all",
                nutritionMode === m ? "bg-[#2D6A4F] text-white" : "bg-[#EAF3DE] text-[#2D6A4F] hover:bg-[#C5DFAC]"
              )}>
              {m === "manual" ? "Manual Entry" : "Upload Excel/CSV"}
            </button>
          ))}
        </div>
        {nutritionMode === "manual" ? (
          <div className="grid grid-cols-2 gap-3">
            {([
              ["energy_kcal","Energy (kcal)"], ["protein_g","Protein (g)"],
              ["total_fat_g","Total Fat (g)"], ["saturated_fat_g","Saturated Fat (g)"],
              ["trans_fat_g","Trans Fat (g)"], ["carbohydrates_g","Carbohydrates (g)"],
              ["total_sugar_g","Total Sugar (g)"], ["added_sugar_g","Added Sugar (g)"],
              ["dietary_fibre_g","Dietary Fibre (g)"], ["sodium_mg","Sodium (mg)"],
              ["calcium_mg","Calcium (mg)"],
            ] as [keyof NutritionPer100g, string][]).map(([key, label]) => (
              <div key={key}>
                <Label>{label}</Label>
                <Input type="number" step="0.01" {...nField(key)} />
              </div>
            ))}
          </div>
        ) : (
          <FileUpload accept=".xlsx,.csv,.xls" label="Upload Nutrition Excel/CSV" hint="First row of data will be parsed" onFile={() => {}} />
        )}
      </SectionCard>

      {/* ── 3. Ingredients ─────────────────────────────────────────────── */}
      <SectionCard title="3. Ingredients List" subtitle="Used for allergen auto-detection">
        <textarea value={ingredientsText} onChange={(e) => setIngredientsText(e.target.value)} rows={3}
          placeholder="Ragi Flour, Rice Bran Oil, Salt, Sesame Seeds…"
          className="w-full border border-[#DCE8E0] rounded-lg px-3 py-2 text-sm text-[#1A2B22] focus:outline-none focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] resize-none"
        />
      </SectionCard>

      {/* ── 4. Claims ──────────────────────────────────────────────────── */}
      <SectionCard title="4. Claims on Pack">
        <div className="flex flex-wrap gap-2 mb-3">
          {CLAIM_OPTIONS.map((claim) => (
            <button key={claim} onClick={() => toggleClaim(claim)}
              className={cn("px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                selectedClaims.includes(claim) ? "bg-[#2D6A4F] text-white border-[#2D6A4F]" : "bg-white text-[#4A6358] border-[#C5DFAC] hover:border-[#2D6A4F]"
              )}>
              {claim}
            </button>
          ))}
        </div>
        <div>
          <Label>Custom Claim</Label>
          <Input placeholder="Add a custom claim…" value={customClaim} onChange={(e) => setCustomClaim(e.target.value)} />
        </div>
      </SectionCard>

      {/* ── 5. Artwork upload ──────────────────────────────────────────── */}
      <SectionCard title="5. Packaging Artwork / Label PDF"
        subtitle="Upload the label to compare nutrition values against master data via OCR">
        <FileUpload
          accept="image/*,.pdf"
          label="Upload label for QC inspection"
          hint="JPG, PNG, or PDF — Claude will OCR the nutrition table"
          onFile={(file, b64) => {
            setArtworkFile(file);
            setArtworkBase64(b64 || null);
            if (file.type.startsWith("image/")) setArtworkPreview(b64 || null);
            else setArtworkPreview(null);
          }}
        />
        {artworkFile && (
          <p className="text-xs text-[#2D6A4F] mt-2 font-medium">
            ✓ {artworkFile.name} ready — OCR will run on analysis
          </p>
        )}
        {ocrError && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-2">
            ⚠ {ocrError}
          </p>
        )}
      </SectionCard>

      {/* ── 6. Market Intelligence ─────────────────────────────────────── */}
      <SectionCard title="6. Market Intelligence (optional)">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label>Proposed Marketing Claim</Label>
            <Input value={proposedClaim} onChange={(e) => setProposedClaim(e.target.value)} placeholder="e.g. Source of Protein, No Palm Oil" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Target Region</Label>
              <Select value={region} onChange={(e) => setRegion(e.target.value)}>
                {REGIONS.map((r) => <option key={r}>{r}</option>)}
              </Select>
            </div>
            <div>
              <Label>Target Demographic</Label>
              <Select value={demographic} onChange={(e) => setDemographic(e.target.value)}>
                {DEMOGRAPHICS.map((d) => <option key={d}>{d}</option>)}
              </Select>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ── Action ─────────────────────────────────────────────────────── */}
      <div className="pb-8">
        <button onClick={handleRunAnalysis} disabled={loading}
          className={cn("w-full py-4 rounded-xl font-bold text-base transition-all shadow-md",
            loading ? "bg-[#7A9186] text-white cursor-not-allowed" : "bg-[#2D6A4F] hover:bg-[#1E4D39] text-white active:scale-[0.99]"
          )}
          style={{ fontFamily: "Raleway, sans-serif" }}>
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              {loadingStep || "Running analysis…"}
            </span>
          ) : "Run Full Analysis →"}
        </button>
        <p className="text-center text-xs text-[#7A9186] mt-2">
          FSSAI compliance · OCR label comparison · Market intelligence
        </p>
      </div>
    </div>
  );
}
