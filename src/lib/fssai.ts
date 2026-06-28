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
// Each rule: if oil keyword found in ingredients, saturated_fat must be ≤ maxPct of total_fat.
export const OIL_SAT_FAT_RULES: { name: string; pattern: RegExp; maxPct: number }[] = [
  { name: "Rice Bran Oil", pattern: /rice\s*bran\s*oil/i, maxPct: 25 },
  { name: "Sunflower Oil", pattern: /sunflower\s*oil/i,   maxPct: 15 },
];

export type OilSatFatCheck = {
  oil: string;
  maxPct: number;
  actualPct: number | null;
  status: "pass" | "fail" | "no_data";
};

export function checkOilSatFat(ingredients: string, n: NutritionBlock): OilSatFatCheck[] {
  return OIL_SAT_FAT_RULES
    .filter(r => r.pattern.test(ingredients))
    .map(r => {
      const total = n.total_fat_g;
      const sat   = n.saturated_fat_g;
      if (sat === null || total === 0 || total === null) {
        return { oil: r.name, maxPct: r.maxPct, actualPct: null, status: "no_data" as const };
      }
      const pct = (sat / total) * 100;
      return {
        oil: r.name,
        maxPct: r.maxPct,
        actualPct: parseFloat(pct.toFixed(1)),
        status: pct <= r.maxPct ? "pass" as const : "fail" as const,
      };
    });
}
