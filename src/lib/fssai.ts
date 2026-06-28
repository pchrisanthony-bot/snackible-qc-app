import { NutritionBlock } from "./types";

export const CLAIM_RULES: Record<string, {
  nutrient: keyof NutritionBlock;
  operator: ">=" | "<=";
  threshold: number;
}> = {
  "Rich in Protein":         { nutrient: "protein_g",       operator: ">=", threshold: 10.8 },
  "High in Protein":         { nutrient: "protein_g",       operator: ">=", threshold: 10.8 },
  "High Protein":            { nutrient: "protein_g",       operator: ">=", threshold: 10.8 },
  "Source of Protein":       { nutrient: "protein_g",       operator: ">=", threshold: 5.4  },
  "Rich in Dietary Fibre":   { nutrient: "dietary_fibre_g", operator: ">=", threshold: 6.0  },
  "Rich in Fibre":           { nutrient: "dietary_fibre_g", operator: ">=", threshold: 6.0  },
  "Source of Dietary Fibre": { nutrient: "dietary_fibre_g", operator: ">=", threshold: 3.0  },
  "Source of Fibre":         { nutrient: "dietary_fibre_g", operator: ">=", threshold: 3.0  },
  "Source of Calcium":       { nutrient: "calcium_mg",      operator: ">=", threshold: 150  },
  "Rich in Calcium":         { nutrient: "calcium_mg",      operator: ">=", threshold: 300  },
  "Low Calorie":             { nutrient: "energy_kcal",     operator: "<=", threshold: 40   },
};

export const FACTUAL_CLAIMS = [
  "No Palm Oil", "No Added Sugar", "Baked Not Fried", "Baked", "Roasted",
  "Made with Whole Grains", "No Preservatives", "No Maida", "No Refined Sugar",
  "Made with Jaggery", "Gluten Free", "Vegan", "Trans fat free",
];

export const SODIUM_THRESHOLD = 800;

export type ClaimResult = {
  claim: string;
  type: "nutrient" | "factual" | "custom";
  threshold?: string;
  actual?: string;
  status: "pass" | "fail" | "factual" | "custom";
};

export function validateClaims(claims: string[], n100g: NutritionBlock): ClaimResult[] {
  return claims.filter(Boolean).map(claim => {
    const ruleKey = Object.keys(CLAIM_RULES).find(k =>
      k.toLowerCase() === claim.toLowerCase() ||
      claim.toLowerCase().includes(k.toLowerCase()) ||
      k.toLowerCase().includes(claim.toLowerCase())
    );
    if (ruleKey) {
      const rule = CLAIM_RULES[ruleKey];
      const val = (n100g[rule.nutrient] as number | null) ?? 0;
      const passes = rule.operator === ">=" ? val >= rule.threshold : val <= rule.threshold;
      const unit = rule.nutrient.endsWith("_mg") ? " mg" : rule.nutrient === "energy_kcal" ? " kcal" : "g";
      return {
        claim, type: "nutrient" as const,
        threshold: `${rule.operator} ${rule.threshold}${unit}`,
        actual: `${val}${unit}`,
        status: passes ? "pass" as const : "fail" as const,
      };
    }
    const isFactual = FACTUAL_CLAIMS.some(f =>
      f.toLowerCase() === claim.toLowerCase() ||
      claim.toLowerCase().includes(f.toLowerCase()) ||
      f.toLowerCase().includes(claim.toLowerCase())
    );
    if (isFactual) return { claim, type: "factual" as const, status: "factual" as const };
    return { claim, type: "custom" as const, status: "custom" as const };
  });
}

export function calcEnergy(n: NutritionBlock): number {
  return (n.carbohydrate_g * 4) + (n.protein_g * 4) + (n.total_fat_g * 9);
}

// ── Oil-based saturated-fat limits ──
// Saturated fat must be ≤ maxPct of total fat for the PRIMARY oil (first listed in ingredients).
// FSSAI rule: ingredients must be listed in descending order by weight, so the first oil keyword
// encountered is the dominant fat source.
export const OIL_SAT_FAT_RULES: { name: string; pattern: RegExp; maxPct: number }[] = [
  { name: "Rice Bran Oil", pattern: /rice\s*bran\s*oil/i, maxPct: 25 },
  { name: "Sunflower Oil", pattern: /sunflower\s*oil/i,   maxPct: 15 },
];

export type PrimaryOilInfo = {
  name: string;
  maxPct: number;
  otherOils: string[];
};

export function detectPrimaryOil(ingredients: string): PrimaryOilInfo | null {
  const hits = OIL_SAT_FAT_RULES
    .map(r => {
      const m = r.pattern.exec(ingredients);
      return m ? { rule: r, index: m.index } : null;
    })
    .filter((x): x is { rule: typeof OIL_SAT_FAT_RULES[number]; index: number } => x !== null)
    .sort((a, b) => a.index - b.index);
  if (hits.length === 0) return null;
  return {
    name:      hits[0].rule.name,
    maxPct:    hits[0].rule.maxPct,
    otherOils: hits.slice(1).map(h => h.rule.name),
  };
}

export function calcSatFatPct(n: NutritionBlock): number | null {
  const total = n.total_fat_g;
  const sat   = n.saturated_fat_g;
  if (sat === null || total === null || total === 0) return null;
  return parseFloat(((sat / total) * 100).toFixed(1));
}
