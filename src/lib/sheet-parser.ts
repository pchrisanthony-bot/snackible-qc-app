import { NutritionPer100g } from "./types";

// ── Attribute name normalizer ─────────────────────────────────────────────────
// Maps every variant seen in the unpivoted sheet to a canonical NutritionPer100g key.
// Keys are lowercased + trimmed for matching.
const ATTR_MAP: Record<string, keyof NutritionPer100g> = {
  // Energy
  "energy": "energy_kcal",
  "energy value": "energy_kcal",
  "energy (kcal)": "energy_kcal",
  "energy (kj)": "energy_kcal",
  // Protein
  "protein": "protein_g",
  "proteins": "protein_g",
  "protein (g)": "protein_g",
  "protein (gm)": "protein_g",
  // Carbohydrates
  "carbohydrate": "carbohydrates_g",
  "carbohydrates": "carbohydrates_g",
  "carbohydrates (g)": "carbohydrates_g",
  "carbohydrates (gm)": "carbohydrates_g",
  "total carbohydrates": "carbohydrates_g",
  "carbohydrat0es": "carbohydrates_g",   // typo in sheet
  // Total Sugar
  "total sugar": "total_sugar_g",
  "total sugar (g)": "total_sugar_g",
  "total sugar (gm)": "total_sugar_g",
  "total sugars": "total_sugar_g",
  "total sugar as sucrose": "total_sugar_g",
  "sugar": "total_sugar_g",
  "sugar (gm)": "total_sugar_g",
  "sugar as sucrose": "total_sugar_g",
  "otal sugar": "total_sugar_g",         // typo in sheet
  // Added Sugar
  "added sugar": "added_sugar_g",
  "added sugars": "added_sugar_g",
  "added sugar (gm)": "added_sugar_g",
  // Dietary Fibre
  "dietary fiber": "dietary_fibre_g",
  "dietary fibre": "dietary_fibre_g",
  "dietary fibre(gm)": "dietary_fibre_g",
  "dietery fibre": "dietary_fibre_g",    // typo in sheet
  "dietary fibre (g)": "dietary_fibre_g",
  // Total Fat
  "total fat": "total_fat_g",
  "total fat (g)": "total_fat_g",
  "fat": "total_fat_g",
  "fat (g)": "total_fat_g",
  "fat (gm)": "total_fat_g",  // "Fat (g)" variant
  "totalfat": "total_fat_g",
  // Saturated Fat
  "saturated fat": "saturated_fat_g",
  "saturated fat (g)": "saturated_fat_g",
  "saturated fat (gm)": "saturated_fat_g",
  // Trans Fat
  "trans fat": "trans_fat_g",
  "trans fat (g)": "trans_fat_g",
  "trans fat (gm)": "trans_fat_g",
  "transfat": "trans_fat_g",
  "transfat (gm)": "trans_fat_g",
  // Cholesterol
  "cholesterol": "cholesterol_mg",
  "cholesterol (mg)": "cholesterol_mg",
  "cholestrol": "cholesterol_mg",        // typo in sheet
  // Sodium
  "sodium": "sodium_mg",
  "sodium (mg)": "sodium_mg",
  // Calcium
  "calcium": "calcium_mg",
  "calcium (mg)": "calcium_mg",
  // Unsaturated Fat (direct)
  "unsaturated fat": "unsaturated_fat_g",
  "unsaturated fats": "unsaturated_fat_g",
  "unsaturated fat (g)": "unsaturated_fat_g",
};

// Mono/poly keys — these get summed into unsaturated_fat_g when no direct row exists
const MONO_KEYS = ["monounsaturated fat", "monounsaturated fats", "monounsaturated fat (g)", "monounsaturated fat (gm)", "monounsaturated fats (g)"];
const POLY_KEYS = ["polyunsaturated fat", "polyunsaturated fats", "polyunsaturated fat (g)", "polyunsaturated fat (gm)", "polyunsaturated fats (g)"];

// ── Value parser ──────────────────────────────────────────────────────────────
function parseNutrientValue(val: string | number): number {
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  const s = String(val).trim().toLowerCase();
  if (s === "" || s === "blq" || s === "blq g" || s === "blq mg" || s === "nil"
    || s === "trace" || s === "traces" || s === "-" || s === "n/a" || s === "na"
    || s === "nd" || s === "0" || s === "0 g" || s === "0 mg") return 0;
  const m = s.match(/([\d.]+)/);
  return m ? parseFloat(m[1]) : 0;
}

// ── Unpivoted tab loader ──────────────────────────────────────────────────────
/** Reads "Unpivoted Nutrition Data (2)" and returns: productName → grammage → NutritionPer100g */
export function loadUnpivotedNutrition(
  rows: (string | number)[][]
): Map<string, Map<number, NutritionPer100g>> {
  // Accumulate raw attrs per product/grammage
  type Entry = { attrs: Partial<Record<keyof NutritionPer100g, number>>; mono: number; poly: number };
  const byProduct = new Map<string, Map<number, Entry>>();

  for (const row of rows.slice(1)) {
    const productName = String(row[0] ?? "").trim().replace(/\s+/g, " ");
    const grammage = Number(row[1]) || 0;
    const attr = String(row[2] ?? "").trim();
    const value = parseNutrientValue(row[3]);

    if (!productName || !grammage) continue;

    const attrKey = attr.toLowerCase();
    const canonicalKey = ATTR_MAP[attrKey];
    const isMono = MONO_KEYS.includes(attrKey);
    const isPoly = POLY_KEYS.includes(attrKey);

    // Skip rows where attribute is clearly a product name / junk
    if (!canonicalKey && !isMono && !isPoly) continue;

    if (!byProduct.has(productName)) byProduct.set(productName, new Map());
    const byGram = byProduct.get(productName)!;
    if (!byGram.has(grammage)) byGram.set(grammage, { attrs: {}, mono: 0, poly: 0 });
    const entry = byGram.get(grammage)!;

    if (canonicalKey) {
      // Don't overwrite a real value with 0 (e.g. a duplicate BLQ row)
      if (entry.attrs[canonicalKey] == null || value > 0) {
        entry.attrs[canonicalKey] = value;
      }
    } else if (isMono) {
      entry.mono += value;
    } else if (isPoly) {
      entry.poly += value;
    }
  }

  // Convert to NutritionPer100g map
  const result = new Map<string, Map<number, NutritionPer100g>>();
  Array.from(byProduct.entries()).forEach(([product, byGram]) => {
    const gramMap = new Map<number, NutritionPer100g>();
    Array.from(byGram.entries()).forEach(([gram, { attrs, mono, poly }]) => {
      const unsat = attrs.unsaturated_fat_g != null
        ? attrs.unsaturated_fat_g
        : (mono + poly > 0 ? +(mono + poly).toFixed(2) : undefined);

      gramMap.set(gram, {
        energy_kcal:     attrs.energy_kcal     ?? 0,
        protein_g:       attrs.protein_g       ?? 0,
        total_fat_g:     attrs.total_fat_g     ?? 0,
        saturated_fat_g: attrs.saturated_fat_g ?? 0,
        trans_fat_g:     attrs.trans_fat_g     ?? 0,
        carbohydrates_g: attrs.carbohydrates_g ?? 0,
        total_sugar_g:   attrs.total_sugar_g   ?? 0,
        added_sugar_g:   attrs.added_sugar_g   ?? 0,
        dietary_fibre_g: attrs.dietary_fibre_g ?? 0,
        sodium_mg:       attrs.sodium_mg       ?? 0,
        calcium_mg:      attrs.calcium_mg      ?? 0,
        cholesterol_mg:  attrs.cholesterol_mg,
        unsaturated_fat_g: unsat,
      });
    });
    result.set(product, gramMap);
  });
  return result;
}

// ── Scale ─────────────────────────────────────────────────────────────────────
/** Scale all nutrient values by a factor (e.g. to convert per-Xg → per-100g). */
export function scaleNutrition(n: NutritionPer100g, factor: number): NutritionPer100g {
  return {
    energy_kcal:       +(n.energy_kcal       * factor).toFixed(2),
    protein_g:         +(n.protein_g         * factor).toFixed(2),
    total_fat_g:       +(n.total_fat_g       * factor).toFixed(2),
    saturated_fat_g:   +(n.saturated_fat_g   * factor).toFixed(2),
    trans_fat_g:       +(n.trans_fat_g       * factor).toFixed(2),
    carbohydrates_g:   +(n.carbohydrates_g   * factor).toFixed(2),
    total_sugar_g:     +(n.total_sugar_g     * factor).toFixed(2),
    added_sugar_g:     +(n.added_sugar_g     * factor).toFixed(2),
    dietary_fibre_g:   +(n.dietary_fibre_g   * factor).toFixed(2),
    sodium_mg:         +(n.sodium_mg         * factor).toFixed(2),
    calcium_mg:        +(n.calcium_mg        * factor).toFixed(2),
    cholesterol_mg:    n.cholesterol_mg    != null ? +(n.cholesterol_mg    * factor).toFixed(2) : undefined,
    unsaturated_fat_g: n.unsaturated_fat_g != null ? +(n.unsaturated_fat_g * factor).toFixed(2) : undefined,
  };
}

// ── Legacy text-based parser (fallback for products not in unpivoted tab) ─────

function extractValue(text: string, patterns: RegExp[]): number {
  for (const p of patterns) {
    const m = text.match(p);
    if (m?.[1]) {
      const v = parseFloat(m[1]);
      if (!isNaN(v)) return v;
    }
  }
  return 0;
}

const HEADER_100G_RE = /nutritional\s*(?:information|info|value)[^\n]*100[^\n]*\n/i;
const BOUNDARY_RE    = /\n\s*(?:nutritional\s*(?:information|info|value)|per\s+\d)/i;

function get100gSection(text: string): string {
  if (!text) return "";
  const m = text.match(
    new RegExp(`(${HEADER_100G_RE.source})([\\s\\S]*?)(?=${BOUNDARY_RE.source}|$)`, "i")
  );
  if (m) return m[0];
  const firstHeader = text.match(
    /(?:nutritional\s*(?:information|info|value)\s*[-–]?\s*(?:per\s+)?|per\s+)([\d.]+)\s*gm?\b/i
  );
  if (firstHeader) {
    const servingG = parseFloat(firstHeader[1]);
    if (servingG > 0 && servingG !== 100) {
      const idx = text.indexOf(firstHeader[0]);
      const sectionText = text.substring(idx);
      const boundary = sectionText.search(BOUNDARY_RE);
      const block = boundary > 0 ? sectionText.substring(0, boundary) : sectionText.substring(0, 800);
      return `__SERVING_G=${servingG}__\n${block}`;
    }
  }
  return text.substring(0, 600);
}

function extractNutrientsFromBlock(t: string): NutritionPer100g {
  return {
    energy_kcal:     extractValue(t, [/energy[^:\-\n]*[\-:]\s*([\d.]+)\s*k?cal/i, /energy[^:\-\n]*[\-:]\s*([\d.]+)/i]),
    protein_g:       extractValue(t, [/protein[^:\-\n]*[\-:]\s*([\d.]+)\s*g/i,    /protein[^:\-\n]*[\-:]\s*([\d.]+)/i]),
    total_fat_g:     extractValue(t, [/total\s*fat[^:\-\n]*[\-:]\s*([\d.]+)\s*g/i, /total\s*fat[^:\-\n]*[\-:]\s*([\d.]+)/i, /^fat[^:\-\n]*[\-:]\s*([\d.]+)\s*g/im, /^fat[^:\-\n]*[\-:]\s*([\d.]+)/im]),
    saturated_fat_g: extractValue(t, [/saturated\s*fat[^:\-\n]*[\-:]\s*([\d.]+)\s*g/i, /saturated[^:\-\n]*[\-:]\s*([\d.]+)/i]),
    trans_fat_g:     extractValue(t, [/trans\s*fat[^:\-\n]*[\-:]\s*([\d.]+)\s*g/i,     /trans\s*fat[^:\-\n]*[\-:]\s*([\d.]+)/i]),
    carbohydrates_g: extractValue(t, [/carbohydrat[^\-:\n]*[\-:]\s*([\d.]+)\s*g/i,     /carbohydrat[^\-:\n]*[\-:]\s*([\d.]+)/i]),
    total_sugar_g:   extractValue(t, [/total\s*sugar[^\-:\n]*[\-:]\s*([\d.]+)\s*g/i,   /total\s*sugar[^\-:\n]*[\-:]\s*([\d.]+)/i]),
    added_sugar_g:   extractValue(t, [/added\s*sugar[^\-:\n]*[\-:]\s*([\d.]+)\s*g/i,   /added\s*sugar[^\-:\n]*[\-:]\s*([\d.]+)/i]),
    dietary_fibre_g: extractValue(t, [/dietary\s*fib(?:re|er)[^\-:\n]*[\-:]\s*([\d.]+)\s*g/i, /dietary\s*fib(?:re|er)[^\-:\n]*[\-:]\s*([\d.]+)/i, /\bfib(?:re|er)[^\-:\n]*[\-:]\s*([\d.]+)/i]),
    sodium_mg:       extractValue(t, [/sodium[^\-:\n]*[\-:]\s*([\d.]+)\s*mg/i,          /sodium[^\-:\n]*[\-:]\s*([\d.]+)/i]),
    calcium_mg:      extractValue(t, [/calcium[^\-:\n]*[\-:]\s*([\d.]+)\s*mg/i,         /calcium[^\-:\n]*[\-:]\s*([\d.]+)/i]),
    cholesterol_mg:  extractValue(t, [/cholesterol[^\-:\n]*[\-:]\s*([\d.]+)\s*mg/i,     /cholesterol[^\-:\n]*[\-:]\s*([\d.]+)/i]) || undefined,
    unsaturated_fat_g: extractValue(t, [/unsaturated\s*fat[^\-:\n]*[\-:]\s*([\d.]+)\s*g/i, /monounsaturated[^\-:\n]*[\-:]\s*([\d.]+)/i]) || undefined,
  };
}

export function parseNutritionText(text: string): NutritionPer100g {
  const s = get100gSection(text);
  const scaleMatch = s.match(/^__SERVING_G=([\d.]+)__\n/);
  const block = scaleMatch ? s.replace(/^__SERVING_G=[\d.]+__\n/, "") : s;
  const scale = scaleMatch ? 100 / parseFloat(scaleMatch[1]) : 1;
  const raw = extractNutrientsFromBlock(block);
  return scale !== 1 ? scaleNutrition(raw, scale) : raw;
}

export function parseAllGrammaSections(text: string): Record<number, NutritionPer100g> {
  if (!text) return {};
  const headerRe = /(?:nutritional\s*(?:information|info|value)\s*[-–]?\s*(?:per\s+)?|(?:^|\n)\s*per\s+)([\d.]+)\s*gm?\b/gi;
  const boundaries: Array<{ grammage: number; pos: number }> = [];
  let m;
  while ((m = headerRe.exec(text)) !== null) {
    const g = parseFloat(m[1]);
    if (g > 0 && g < 1000) boundaries.push({ grammage: g, pos: m.index });
  }
  if (boundaries.length === 0) return {};
  const result: Record<number, NutritionPer100g> = {};
  for (let i = 0; i < boundaries.length; i++) {
    const { grammage, pos } = boundaries[i];
    const end = i + 1 < boundaries.length ? boundaries[i + 1].pos : text.length;
    result[grammage] = extractNutrientsFromBlock(text.substring(pos, end));
  }
  return result;
}

// ── Metadata helpers ──────────────────────────────────────────────────────────

export function parseClaimsFromUSP(usp: string): string[] {
  if (!usp) return [];
  return usp
    .split("\n")
    .map((l) => l.trim().replace(/^\d+[\)\.]\s*/, ""))
    .filter((l) => l.length > 1 && l.length < 80);
}

export function detectOilType(ingredients: string): string {
  const lower = ingredients.toLowerCase();
  if (lower.includes("rice bran oil"))  return "Rice Bran Oil";
  if (lower.includes("sunflower oil"))  return "Sunflower Oil";
  if (lower.includes("palm oil"))       return "Palm Oil";
  if (lower.includes("coconut oil"))    return "Coconut Oil";
  return "Other";
}

export function detectCategory(usp: string): string {
  const lower = (usp || "").toLowerCase();
  if (lower.includes("not baked") && lower.includes("not fried")) return "Popped";
  if (lower.includes("popped"))  return "Popped";
  if (lower.includes("baked"))   return "Baked";
  if (lower.includes("roasted")) return "Roasted";
  return "Fried";
}

export function parsePackWeight(text: string): number {
  if (!text) return 0;
  const m = String(text).match(/([\d.]+)\s*g(?:rams?|ms?)?/i);
  return m ? parseFloat(m[1]) : 0;
}

export interface PackPrice {
  pack_weight_g: number;
  mrp: number;
  per_gram: number;
}

export function parseMRPOptions(mrpText: string): PackPrice[] {
  if (!mrpText) return [];
  const results: PackPrice[] = [];
  const pattern = /([\d.]+)\s*g(?:rams?|ms?)?\s*for\s*(?:₹|rs\.?)?\s*([\d.]+)\s*\/-?/gi;
  let m;
  while ((m = pattern.exec(String(mrpText))) !== null) {
    const pack_weight_g = parseFloat(m[1]);
    const mrp = parseFloat(m[2]);
    if (pack_weight_g > 0 && mrp > 0) {
      results.push({ pack_weight_g, mrp, per_gram: +(mrp / pack_weight_g).toFixed(3) });
    }
  }
  return results;
}

export function parsePackSizesFromNutritionText(text: string): number[] {
  const sizes = new Set<number>();
  const pattern = /(?:nutritional\s+(?:information|info|value)\s*[-–]?\s*(?:per\s+)?|(?:^|\n)\s*per\s+)([\d.]+)\s*g(?:rams?|ms?)?(?:\b|$)/gi;
  let m;
  while ((m = pattern.exec(text)) !== null) {
    const v = parseFloat(m[1]);
    if (v > 0 && v < 1000 && v !== 100) sizes.add(v);
  }
  return Array.from(sizes).sort((a, b) => a - b);
}

// ── Full product type ─────────────────────────────────────────────────────────

export interface SheetProduct {
  product_name: string;
  sheet: string;
  brand_usp: string;
  claims: string[];
  ingredients_raw: string;
  ingredients_list: string[];
  nutrition: NutritionPer100g;
  /** Per-pack values keyed by grammage — exact values from sheet for each pack size */
  grammage_sections: Record<number, NutritionPer100g>;
  allergen_info: string;
  serving_size_g: number;
  small_pack_g: number;
  large_pack_g: number;
  mrp_options: PackPrice[];
  manufacturing: string;
  shelf_life: string;
  oil_type: string;
  product_category: string;
}

// ── Row parser ────────────────────────────────────────────────────────────────

export function parseSheetRow(
  values: (string | number | null | undefined)[],
  sheetName: string,
  unpivotedMap?: Map<string, Map<number, NutritionPer100g>>
): SheetProduct | null {
  const productName = String(values[0] ?? "").trim().replace(/\s+/g, " ");
  if (!productName || productName.toLowerCase() === "products") return null;

  const brandUSP       = String(values[1] ?? "");
  const ingredientsRaw = String(values[2] ?? "");
  const nutritionText  = String(values[3] ?? "");
  const servingSizeRaw = String(values[4] ?? "");
  const allergenInfo   = String(values[6] ?? "");
  const shelfLife      = String(values[8] ?? "");
  const smallPackRaw   = String(values[10] ?? "");
  const largePackRaw   = String(values[11] ?? "");
  const manufacturing  = String(values[13] ?? "");
  const mrpRaw         = String(values[14] ?? "");

  const claims = parseClaimsFromUSP(brandUSP);
  const ingredientsList = ingredientsRaw
    .split(/,(?![^(]*\))/g)
    .map((s) => s.split("\n")[0].trim())
    .filter((s) => s.length > 1 && s.length < 100)
    .slice(0, 30);

  const mrpOptions    = parseMRPOptions(mrpRaw);
  const smallPackG    = parsePackWeight(smallPackRaw);
  const largePackG    = parsePackWeight(largePackRaw);
  const servingSizeG  = parsePackWeight(servingSizeRaw) || smallPackG || 30;
  const oil_type      = detectOilType(ingredientsRaw);
  const product_category = detectCategory(brandUSP);

  // ── Nutrition: unpivoted tab first, legacy text-parse as fallback ──────────
  let nutrition: NutritionPer100g;
  let grammage_sections: Record<number, NutritionPer100g>;

  const unpivotedByGram = unpivotedMap?.get(productName);

  if (unpivotedByGram && unpivotedByGram.size > 0) {
    // Build grammage_sections from the structured data
    grammage_sections = Object.fromEntries(unpivotedByGram);

    // Use the 100g row as canonical per-100g; if absent, scale from smallest available
    if (unpivotedByGram.has(100)) {
      nutrition = unpivotedByGram.get(100)!;
    } else {
      const smallest = Math.min(...Array.from(unpivotedByGram.keys()));
      nutrition = scaleNutrition(unpivotedByGram.get(smallest)!, 100 / smallest);
    }

    // Fill any MRP-unknown grammages from the unpivoted tab
    const existingSizes = new Set(mrpOptions.map((o) => o.pack_weight_g));
    Array.from(unpivotedByGram.keys()).forEach((g) => {
      if (!existingSizes.has(g)) {
        mrpOptions.push({ pack_weight_g: g, mrp: 0, per_gram: 0 });
      }
    });
  } else {
    // Fallback: legacy regex parsing from the free-text nutrition column
    nutrition         = parseNutritionText(nutritionText);
    grammage_sections = parseAllGrammaSections(nutritionText);

    const extraSizes  = parsePackSizesFromNutritionText(nutritionText);
    const existingSizes = new Set(mrpOptions.map((o) => o.pack_weight_g));
    for (const s of extraSizes) {
      if (!existingSizes.has(s)) mrpOptions.push({ pack_weight_g: s, mrp: 0, per_gram: 0 });
    }
  }

  mrpOptions.sort((a, b) => a.pack_weight_g - b.pack_weight_g);

  return {
    product_name: productName,
    sheet: sheetName,
    brand_usp: brandUSP,
    claims,
    ingredients_raw: ingredientsRaw,
    ingredients_list: ingredientsList,
    nutrition,
    grammage_sections,
    allergen_info: allergenInfo,
    serving_size_g: servingSizeG,
    small_pack_g: smallPackG,
    large_pack_g: largePackG,
    mrp_options: mrpOptions,
    manufacturing,
    shelf_life: shelfLife,
    oil_type,
    product_category,
  };
}
