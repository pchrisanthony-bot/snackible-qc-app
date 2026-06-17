export interface NutritionPer100g {
  energy_kcal: number;
  protein_g: number;
  total_fat_g: number;
  saturated_fat_g: number;
  trans_fat_g: number;
  carbohydrates_g: number;
  total_sugar_g: number;
  added_sugar_g: number;
  dietary_fibre_g: number;
  sodium_mg: number;
  calcium_mg: number;
  cholesterol_mg?: number;
  unsaturated_fat_g?: number;
}

export interface ProductMeta {
  sku: string;
  product_name: string;
  pack_weight_g: number;
  serving_size_g: number;
  mrp: number;
  barcode: string;
  oil_type: string;
  product_category: string;
  ingredients_list: string[];
  claims_on_pack: string[];
}

export interface FSSAIResult {
  overall_status: "COMPLIANT" | "REVIEW_REQUIRED" | "NON_COMPLIANT";
  energy_check: {
    calculated: number;
    reported: number;
    deviation_pct: number;
    status: "PASS" | "FAIL";
  };
  claim_validations: Array<{
    claim: string;
    threshold: string;
    actual_value: number;
    status: "VALID" | "INVALID" | "NOT_CLAIMED";
  }>;
  rda_table: Array<{
    nutrient: string;
    per_100g: number;
    per_serving: number;
    per_pack: number;
    rda_pct: number;
  }>;
  sodium_flag: boolean;
  cost_per_gram: number;
}

export interface QCMismatch {
  field: string;
  master_value: string | number;
  artwork_value: string | number;
  severity: "CRITICAL" | "WARNING" | "INFO";
  message: string;
}

export interface OCRExtract {
  nutrition_table: Partial<NutritionPer100g>;
  /** Serving size in grams that the nutrition_table values correspond to. 100 = per-100g column was used. */
  serving_size_g?: number;
  serving_size: string;
  net_weight: string;
  ingredients_text: string;
  claims_found: string[];
  barcode_number: string | null;
  fssai_license: string | null;
  mrp_printed: string | null;
  veg_symbol_present: boolean;
  customer_care_present: boolean;
  batch_space_present: boolean;
  manufacturing_details_present: boolean;
  allergen_declaration: string | null;
}

export interface QCResult {
  mismatches: QCMismatch[];
  allergen_alerts: Array<{
    allergen: string;
    found_in_ingredients: boolean;
    declared_in_artwork: boolean;
    severity: "CRITICAL" | "WARNING";
  }>;
  mandatory_checklist: Array<{
    item: string;
    status: "FOUND" | "MISSING";
  }>;
  ocr_extract: OCRExtract | null;
  overall_status: "PASS" | "REVIEW" | "FAIL";
}

export interface ClaimVerdict {
  brand_fit: string;
  target_audience: string;
  regulatory_risk: string;
  cultural_risk: string;
  competitive_risk: string;
}

export interface AlternativeClaim {
  text: string;
  projected_si: number;
  alignment: "Low" | "Medium" | "High";
  rationale: string;
}

export interface IntelligenceResult {
  si_score: number;
  alignment: "Low" | "Medium" | "High";
  confidence: "Low" | "Medium" | "High";
  cluster: string;
  verdict: ClaimVerdict;
  alternative_claims: AlternativeClaim[];
  claim_gap_opportunities: string[];
}

export interface BenchmarkResult {
  metric: string;
  your_value: number;
  benchmark_value: number;
  unit: string;
  deviation_pct: number;
  status: "ABOVE" | "BELOW" | "ON_TARGET";
  suggestion: string;
}

export interface CompetitorData {
  brand: string;
  product: string;
  platform: string;
  price: number;
  rating: number;
  claims: string[];
  sample_reviews: Array<{ text: string; sentiment: string }>;
}

export interface AnalysisState {
  productMeta: ProductMeta;
  nutrition: NutritionPer100g;
  fssaiResult: FSSAIResult | null;
  qcResult: QCResult | null;
  intelligenceResult: IntelligenceResult | null;
  benchmarkResults: BenchmarkResult[];
  competitors: CompetitorData[];
  isDemo: boolean;
  hasAnalysis: boolean;
  artworkFile: string | null;
  /** Pack size (g) the QC comparison was run at */
  comparisonPackG: number;
  /** Master data at the comparison pack size (exact sheet values if available, else scaled) */
  masterAtPack: NutritionPer100g;
  /** OCR data scaled to the comparison pack size (null if no label uploaded) */
  ocrAtPack: Partial<NutritionPer100g> | null;
  /** Raw serving size (g) that the OCR label returned — may differ from comparisonPackG */
  ocrServingG: number | null;
}
