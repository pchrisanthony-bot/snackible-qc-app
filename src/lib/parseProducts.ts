import * as XLSX from "xlsx";
import path from "path";
import { Product, NutritionBlock, RDABlock } from "./types";

let cache: Product[] | null = null;

function parseNum(val: unknown): number {
  if (val === null || val === undefined) return 0;
  const s = String(val).trim().toLowerCase();
  if (s === "" || s === "nil" || s === "nd" || s === "blq" || s === "trace" || s === "-" || s === "n/a") return 0;
  if (/^nd\s*[<≤]/.test(s)) return 0;
  if (/^blq/.test(s)) return 0;
  const n = parseFloat(s.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

function parsePackSize(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  const s = String(val).trim();
  if (!s || s === "-" || s === "N/A") return null;
  const n = parseFloat(s.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? null : n;
}

function parseUSP(val: unknown): string[] {
  if (!val) return [];
  return String(val)
    .split(/[\n,•\|]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function extractNutritionBlocks(text: string): NutritionBlock[] {
  if (!text) return [];

  const blocks: NutritionBlock[] = [];

  // Find all section headers with grammage
  const headerRegex =
    /(?:nutritional\s*(?:information|info|value|facts?)\s*[-–]?\s*(?:per\s+)?|(?:^|\n)\s*per\s+)([\d.]+)\s*g(?:rams?|ms?)?/gi;

  const matches: Array<{ index: number; grammage: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = headerRegex.exec(text)) !== null) {
    matches.push({ index: m.index, grammage: parseFloat(m[1]) });
  }

  // Also look for standalone "Per Xg" or "Per X g" lines
  const altRegex = /\bper\s+([\d.]+)\s*g(?:m|rams?)?\b/gi;
  while ((m = altRegex.exec(text)) !== null) {
    const g = parseFloat(m[1]);
    if (!matches.some((x) => Math.abs(x.grammage - g) < 0.1 && Math.abs(x.index - m!.index) < 50)) {
      matches.push({ index: m.index, grammage: g });
    }
  }

  matches.sort((a, b) => a.index - b.index);

  if (matches.length === 0) {
    // Try to parse the whole text as one block (assume 100g)
    const block = parseNutrientSection(text, 100);
    if (block.energy_kcal > 0 || block.protein_g > 0) blocks.push(block);
    return blocks;
  }

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
    const section = text.slice(start, end);
    const block = parseNutrientSection(section, matches[i].grammage);
    blocks.push(block);
  }

  return blocks;
}

function extractVal(section: string, ...patterns: RegExp[]): number {
  for (const pat of patterns) {
    const m = pat.exec(section);
    if (m) {
      const val = m[1].trim();
      const n = parseFloat(val.replace(/[^0-9.]/g, ""));
      if (!isNaN(n)) return n;
    }
  }
  return 0;
}

function extractValNullable(section: string, ...patterns: RegExp[]): number | null {
  for (const pat of patterns) {
    const m = pat.exec(section);
    if (m) {
      const raw = m[1].trim().toLowerCase();
      if (raw === "nil" || raw === "nd" || raw === "blq" || raw === "trace" || raw === "-") return 0;
      if (/^nd\s*[<≤]/.test(raw) || /^blq/.test(raw)) return 0;
      const n = parseFloat(raw.replace(/[^0-9.]/g, ""));
      if (!isNaN(n)) return n;
      return null;
    }
  }
  return null;
}

function parseNutrientSection(section: string, grammage: number): NutritionBlock {
  return {
    grammage,
    energy_kcal: extractVal(section, /energy[^:\-\n]*[\-:]\s*([\d.]+)/i),
    protein_g: extractVal(section, /protein[^:\-\n]*[\-:]\s*([\d.]+)/i),
    carbohydrate_g: extractVal(
      section,
      /carbohydrat[^\-:\n]*[\-:]\s*([\d.]+)/i,
      /carbs?[^\-:\n]*[\-:]\s*([\d.]+)/i
    ),
    total_sugar_g: extractVal(
      section,
      /total\s*sugar[^\-:\n]*[\-:]\s*([\d.]+)/i,
      /\bsugars?[^\-:\n]*[\-:]\s*([\d.]+)/i
    ),
    added_sugar_g: extractValNullable(section, /added\s*sugar[^\-:\n]*[\-:]\s*([\d.]+)/i),
    dietary_fibre_g: extractValNullable(
      section,
      /dietary\s*fib(?:re|er)[^\-:\n]*[\-:]\s*([\d.]+)/i,
      /fib(?:re|er)[^\-:\n]*[\-:]\s*([\d.]+)/i
    ),
    total_fat_g: extractVal(
      section,
      /total\s*fat[^\-:\n]*[\-:]\s*([\d.]+)/i,
      /(?:^|\n)\s*fat[^\-:\n]*[\-:]\s*([\d.]+)/im
    ),
    saturated_fat_g: extractValNullable(section, /saturated\s*fat[^\-:\n]*[\-:]\s*([\d.]+)/i),
    unsaturated_fat_g: extractValNullable(
      section,
      /unsaturated\s*fat[^\-:\n]*[\-:]\s*([\d.]+)/i,
      /mono\s*unsaturated[^\-:\n]*[\-:]\s*([\d.]+)/i
    ),
    trans_fat_g: extractValNullable(section, /trans\s*fat[^\-:\n]*[\-:]\s*([\d.]+)/i),
    cholesterol_mg: extractValNullable(section, /cholesterol[^\-:\n]*[\-:]\s*([\d.]+)/i),
    sodium_mg: extractValNullable(section, /sodium[^\-:\n]*[\-:]\s*([\d.]+)/i),
    calcium_mg: extractValNullable(section, /calcium[^\-:\n]*[\-:]\s*([\d.]+)/i),
  };
}

function extractRDABlocks(text: string): RDABlock[] {
  if (!text) return [];

  const blocks: RDABlock[] = [];

  const rdaRegex =
    /(?:per\s+serving\s+|for\s+|rda[-–\s]*)([\d.]+)\s*g(?:rams?|ms?)?/gi;

  const matches: Array<{ index: number; grammage: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = rdaRegex.exec(text)) !== null) {
    matches.push({ index: m.index, grammage: parseFloat(m[1]) });
  }

  matches.sort((a, b) => a.index - b.index);

  if (matches.length === 0) {
    // Try parse entire text as one RDA block — detect % values
    const block = parseRDASection(text, 0);
    const hasAny =
      block.energy_pct !== null ||
      block.protein_pct !== null ||
      block.total_fat_pct !== null;
    if (hasAny) blocks.push(block);
    return blocks;
  }

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
    const section = text.slice(start, end);
    blocks.push(parseRDASection(section, matches[i].grammage));
  }

  return blocks;
}

function extractPct(section: string, ...patterns: RegExp[]): number | null {
  for (const pat of patterns) {
    const m = pat.exec(section);
    if (m) {
      const raw = m[1].trim().toLowerCase();
      if (raw === "nil" || raw === "nd" || raw === "blq" || raw === "-") return null;
      const n = parseFloat(raw.replace(/[^0-9.]/g, ""));
      if (!isNaN(n)) return n;
    }
  }
  return null;
}

function parseRDASection(section: string, grammage: number): RDABlock {
  return {
    grammage,
    energy_pct: extractPct(section, /energy[^\n%]*?([\d.]+)\s*%/i, /energy[^\n]*[\-:]\s*([\d.]+)/i),
    protein_pct: extractPct(section, /protein[^\n%]*?([\d.]+)\s*%/i, /protein[^\n]*[\-:]\s*([\d.]+)/i),
    added_sugar_pct: extractPct(
      section,
      /added\s*sugar[^\n%]*?([\d.]+)\s*%/i,
      /added\s*sugar[^\n]*[\-:]\s*([\d.]+)/i
    ),
    dietary_fibre_pct: extractPct(
      section,
      /dietary\s*fib(?:re|er)[^\n%]*?([\d.]+)\s*%/i,
      /fib(?:re|er)[^\n]*[\-:]\s*([\d.]+)/i
    ),
    total_fat_pct: extractPct(
      section,
      /total\s*fat[^\n%]*?([\d.]+)\s*%/i,
      /(?:^|\n)\s*fat[^\n%]*?([\d.]+)\s*%/im
    ),
    saturated_fat_pct: extractPct(
      section,
      /saturated\s*fat[^\n%]*?([\d.]+)\s*%/i
    ),
    trans_fat_pct: extractPct(section, /trans\s*fat[^\n%]*?([\d.]+)\s*%/i),
    sodium_pct: extractPct(section, /sodium[^\n%]*?([\d.]+)\s*%/i),
    calcium_pct: extractPct(section, /calcium[^\n%]*?([\d.]+)\s*%/i),
  };
}

// Sheets that have "Serving Size" at column index 4
const SHEETS_WITH_SERVING_SIZE = ["Launched products", "New launches", "First Club", "Nuts"];

function parseSheet(wb: XLSX.WorkBook, sheetName: string): Product[] {
  const ws = wb.Sheets[sheetName];
  if (!ws) return [];

  const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
  const hasServingSize = SHEETS_WITH_SERVING_SIZE.includes(sheetName);

  const products: Product[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] as unknown[];
    const name = row[0] ? String(row[0]).trim() : "";
    if (!name) continue;

    let servingSize = 0;
    let nutritionText = "";
    let rdaText = "";
    let allergens = "";
    let preservative = "";
    let shelfLife = "";
    let packagingInfo = "";
    let smallPack: number | null = null;
    let largePack: number | null = null;
    let longDesc = "";
    let manufacturer = "";
    let mrp = "";

    if (hasServingSize) {
      // [0]Products [1]Brand USP [2]Ingredients [3]Nutritional info [4]Serving Size
      // [5]RDA Value % [6]Allergen Info [7]Preservative Disclaimer [8]Shelf Life
      // [9]Packaging Info [10]Small packet [11]Large packet [12]Long Description
      // [13]Manufacturing name & address [14]MRP
      servingSize = parseNum(row[4]);
      nutritionText = row[3] ? String(row[3]) : "";
      rdaText = row[5] ? String(row[5]) : "";
      allergens = row[6] ? String(row[6]) : "";
      preservative = row[7] ? String(row[7]) : "";
      shelfLife = row[8] ? String(row[8]) : "";
      packagingInfo = row[9] ? String(row[9]) : "";
      smallPack = parsePackSize(row[10]);
      largePack = parsePackSize(row[11]);
      longDesc = row[12] ? String(row[12]) : "";
      manufacturer = row[13] ? String(row[13]) : "";
      mrp = row[14] ? String(row[14]) : "";
    } else {
      // Spreads / Diwali products 2025 — no Serving Size column
      // [0]Products [1]Brand USP [2]Ingredients [3]Nutritional info [4]RDA Value %
      // [5]Allergen Info [6]Preservative Disclaimer [7]Shelf Life [8]Packaging Info
      // [9]Small packet [10]Large packet [11]Long Description [12]Manufacturing name & address [13]MRP
      nutritionText = row[3] ? String(row[3]) : "";
      rdaText = row[4] ? String(row[4]) : "";
      allergens = row[5] ? String(row[5]) : "";
      preservative = row[6] ? String(row[6]) : "";
      shelfLife = row[7] ? String(row[7]) : "";
      packagingInfo = row[8] ? String(row[8]) : "";
      smallPack = parsePackSize(row[9]);
      largePack = parsePackSize(row[10]);
      longDesc = row[11] ? String(row[11]) : "";
      manufacturer = row[12] ? String(row[12]) : "";
      mrp = row[13] ? String(row[13]) : "";
    }

    const nutrition = extractNutritionBlocks(nutritionText);
    const rdaBlocks = extractRDABlocks(rdaText);

    // If serving_size is not in the sheet, try to infer from smallPack or first nutrition block
    if (!servingSize) {
      servingSize = smallPack ?? (nutrition.length > 0 ? nutrition[0].grammage : 0);
    }

    const id = `${sheetName}-${i}-${name.slice(0, 20).replace(/\s+/g, "-").toLowerCase()}`;

    products.push({
      id,
      name,
      sheet: sheetName,
      brand_usp: parseUSP(row[1]),
      ingredients: row[2] ? String(row[2]) : "",
      nutrition,
      rda: rdaBlocks,
      serving_size_g: servingSize,
      allergens,
      shelf_life: shelfLife,
      small_pack_g: smallPack,
      large_pack_g: largePack,
      manufacturer,
      mrp,
    });
  }

  return products;
}

export function parseProducts(): Product[] {
  if (cache) return cache;

  const filePath = path.join(process.cwd(), "data", "products.xlsx");
  const wb = XLSX.readFile(filePath);

  const allProducts: Product[] = [];
  for (const sheetName of wb.SheetNames) {
    const products = parseSheet(wb, sheetName);
    allProducts.push(...products);
  }

  cache = allProducts;
  return cache;
}
