import { NutritionPer100g, ProductMeta, FSSAIResult } from "./types";
import { RDA_VALUES, RDA_DISPLAY } from "./rda-values";

interface ClaimRule {
  claim: string;
  nutrient: keyof NutritionPer100g;
  threshold: number;
  operator: ">=" | "<=";
  thresholdLabel: string;
}

const CLAIM_RULES: ClaimRule[] = [
  { claim: "High Protein", nutrient: "protein_g", threshold: 10.8, operator: ">=", thresholdLabel: "≥10.8g/100g" },
  { claim: "Rich in Protein", nutrient: "protein_g", threshold: 10.8, operator: ">=", thresholdLabel: "≥10.8g/100g" },
  { claim: "Source of Protein", nutrient: "protein_g", threshold: 5.4, operator: ">=", thresholdLabel: "≥5.4g/100g" },
  { claim: "Rich in Dietary Fibre", nutrient: "dietary_fibre_g", threshold: 6, operator: ">=", thresholdLabel: "≥6g/100g" },
  { claim: "Source of Dietary Fibre", nutrient: "dietary_fibre_g", threshold: 3, operator: ">=", thresholdLabel: "≥3g/100g" },
  { claim: "Source of Fibre", nutrient: "dietary_fibre_g", threshold: 3, operator: ">=", thresholdLabel: "≥3g/100g" },
  { claim: "Rich in Fibre", nutrient: "dietary_fibre_g", threshold: 6, operator: ">=", thresholdLabel: "≥6g/100g" },
  { claim: "High Calcium", nutrient: "calcium_mg", threshold: 300, operator: ">=", thresholdLabel: "≥300mg/100g" },
  { claim: "High in Calcium", nutrient: "calcium_mg", threshold: 300, operator: ">=", thresholdLabel: "≥300mg/100g" },
  { claim: "Source of Calcium", nutrient: "calcium_mg", threshold: 150, operator: ">=", thresholdLabel: "≥150mg/100g" },
];

export function runFSSAIEngine(nutrition: NutritionPer100g, meta: ProductMeta): FSSAIResult {
  const calculatedEnergy =
    nutrition.carbohydrates_g * 4 + nutrition.protein_g * 4 + nutrition.total_fat_g * 9;
  const deviationPct =
    Math.abs((calculatedEnergy - nutrition.energy_kcal) / nutrition.energy_kcal) * 100;
  const energyStatus: "PASS" | "FAIL" = deviationPct > 5 ? "FAIL" : "PASS";

  const claimValidations = meta.claims_on_pack.map((claim) => {
    const rule = CLAIM_RULES.find(
      (r) => r.claim.toLowerCase() === claim.toLowerCase()
    );
    if (!rule) {
      return {
        claim,
        threshold: "No FSSAI rule defined",
        actual_value: 0,
        status: "NOT_CLAIMED" as const,
      };
    }
    const actualValue = nutrition[rule.nutrient] as number;
    const isValid =
      rule.operator === ">=" ? actualValue >= rule.threshold : actualValue <= rule.threshold;
    return {
      claim,
      threshold: rule.thresholdLabel,
      actual_value: actualValue,
      status: isValid ? ("VALID" as const) : ("INVALID" as const),
    };
  });

  const rdaKeys = Object.keys(RDA_VALUES) as (keyof typeof RDA_VALUES)[];
  const rdaTable = rdaKeys.map((key) => {
    const per100g = (nutrition as unknown as Record<string, number>)[key as string] ?? 0;
    const perServing = (per100g / 100) * meta.serving_size_g;
    const perPack = (per100g / 100) * meta.pack_weight_g;
    const rdaValue = RDA_VALUES[key];
    const rdaPct = rdaValue > 0 ? (perServing / rdaValue) * 100 : 0;
    const display = RDA_DISPLAY[key as string];
    return {
      nutrient: display?.label || String(key),
      per_100g: per100g,
      per_serving: +perServing.toFixed(2),
      per_pack: +perPack.toFixed(2),
      rda_pct: +rdaPct.toFixed(1),
    };
  });

  // Insert trans fat row after saturated fat (index 3)
  const transFatPer100 = nutrition.trans_fat_g;
  rdaTable.splice(4, 0, {
    nutrient: "Trans Fat",
    per_100g: transFatPer100,
    per_serving: +((transFatPer100 / 100) * meta.serving_size_g).toFixed(2),
    per_pack: +((transFatPer100 / 100) * meta.pack_weight_g).toFixed(2),
    rda_pct: 0,
  });

  const sodiumFlag = nutrition.sodium_mg > 800;
  const costPerGram = meta.mrp / meta.pack_weight_g;

  const hasInvalidClaims = claimValidations.some((c) => c.status === "INVALID");
  const hasEnergyFail = energyStatus === "FAIL";

  let overall_status: FSSAIResult["overall_status"];
  if (hasInvalidClaims) {
    overall_status = "NON_COMPLIANT";
  } else if (hasEnergyFail || sodiumFlag) {
    overall_status = "REVIEW_REQUIRED";
  } else {
    overall_status = "COMPLIANT";
  }

  return {
    overall_status,
    energy_check: {
      calculated: +calculatedEnergy.toFixed(1),
      reported: nutrition.energy_kcal,
      deviation_pct: +deviationPct.toFixed(1),
      status: energyStatus,
    },
    claim_validations: claimValidations,
    rda_table: rdaTable,
    sodium_flag: sodiumFlag,
    cost_per_gram: +costPerGram.toFixed(2),
  };
}
