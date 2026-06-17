import { NutritionPer100g, ProductMeta, BenchmarkResult } from "./types";

interface CategoryBenchmark {
  max_calories: number;
  max_sodium: number;
  max_sugar: number;
  min_protein: number;
  min_fibre: number;
  sat_fat_range: [number, number];
  target_price_per_gram: number;
}

export const BENCHMARKS: Record<string, CategoryBenchmark> = {
  Fried: {
    max_calories: 500,
    max_sodium: 700,
    max_sugar: 8,
    min_protein: 8,
    min_fibre: 4,
    sat_fat_range: [20, 25],
    target_price_per_gram: 1.0,
  },
  Baked: {
    max_calories: 450,
    max_sodium: 600,
    max_sugar: 6,
    min_protein: 6,
    min_fibre: 5,
    sat_fat_range: [15, 20],
    target_price_per_gram: 1.2,
  },
  Roasted: {
    max_calories: 430,
    max_sodium: 550,
    max_sugar: 5,
    min_protein: 7,
    min_fibre: 4,
    sat_fat_range: [10, 18],
    target_price_per_gram: 1.1,
  },
  Popped: {
    max_calories: 400,
    max_sodium: 500,
    max_sugar: 4,
    min_protein: 5,
    min_fibre: 6,
    sat_fat_range: [8, 15],
    target_price_per_gram: 1.3,
  },
};

export function runBenchmarkEngine(
  nutrition: NutritionPer100g,
  meta: ProductMeta
): BenchmarkResult[] {
  const bench = BENCHMARKS[meta.product_category] || BENCHMARKS["Fried"];
  const costPerGram = meta.mrp / meta.pack_weight_g;
  const results: BenchmarkResult[] = [];

  function deviation(actual: number, target: number) {
    return +((((actual - target) / target) * 100).toFixed(1));
  }

  // Calories
  const calDev = deviation(nutrition.energy_kcal, bench.max_calories);
  results.push({
    metric: "Calories",
    your_value: nutrition.energy_kcal,
    benchmark_value: bench.max_calories,
    unit: "kcal/100g",
    deviation_pct: calDev,
    status: nutrition.energy_kcal <= bench.max_calories ? "ON_TARGET" : "ABOVE",
    suggestion:
      nutrition.energy_kcal > bench.max_calories
        ? `Reduce by ${(nutrition.energy_kcal - bench.max_calories).toFixed(0)} kcal to meet benchmark`
        : "Within Snackible benchmark",
  });

  // Sodium
  const sodDev = deviation(nutrition.sodium_mg, bench.max_sodium);
  results.push({
    metric: "Sodium",
    your_value: nutrition.sodium_mg,
    benchmark_value: bench.max_sodium,
    unit: "mg/100g",
    deviation_pct: sodDev,
    status: nutrition.sodium_mg <= bench.max_sodium ? "ON_TARGET" : "ABOVE",
    suggestion:
      nutrition.sodium_mg > bench.max_sodium
        ? `Reduce sodium by ${(nutrition.sodium_mg - bench.max_sodium).toFixed(0)} mg`
        : "Within Snackible benchmark",
  });

  // Sugar
  const sugDev = deviation(nutrition.total_sugar_g, bench.max_sugar);
  results.push({
    metric: "Total Sugar",
    your_value: nutrition.total_sugar_g,
    benchmark_value: bench.max_sugar,
    unit: "g/100g",
    deviation_pct: sugDev,
    status: nutrition.total_sugar_g <= bench.max_sugar ? "ON_TARGET" : "ABOVE",
    suggestion:
      nutrition.total_sugar_g > bench.max_sugar
        ? `Reduce sugar by ${(nutrition.total_sugar_g - bench.max_sugar).toFixed(1)}g`
        : "Within Snackible benchmark",
  });

  // Protein (min target — lower is BELOW)
  const protDev = deviation(nutrition.protein_g, bench.min_protein);
  results.push({
    metric: "Protein",
    your_value: nutrition.protein_g,
    benchmark_value: bench.min_protein,
    unit: "g/100g",
    deviation_pct: protDev,
    status: nutrition.protein_g >= bench.min_protein ? "ON_TARGET" : "BELOW",
    suggestion:
      nutrition.protein_g < bench.min_protein
        ? `Increase protein by ${(bench.min_protein - nutrition.protein_g).toFixed(1)}g to meet benchmark. ${(10.8 - nutrition.protein_g).toFixed(1)}g more qualifies for High Protein claim.`
        : nutrition.protein_g >= 10.8
        ? "Qualifies for High Protein claim ✓"
        : nutrition.protein_g >= 5.4
        ? `Qualifies for Source of Protein. Add ${(10.8 - nutrition.protein_g).toFixed(1)}g for High Protein claim.`
        : "Meets benchmark",
  });

  // Fibre (min target)
  const fibDev = deviation(nutrition.dietary_fibre_g, bench.min_fibre);
  results.push({
    metric: "Dietary Fibre",
    your_value: nutrition.dietary_fibre_g,
    benchmark_value: bench.min_fibre,
    unit: "g/100g",
    deviation_pct: fibDev,
    status: nutrition.dietary_fibre_g >= bench.min_fibre ? "ON_TARGET" : "BELOW",
    suggestion:
      nutrition.dietary_fibre_g < bench.min_fibre
        ? `Increase fibre by ${(bench.min_fibre - nutrition.dietary_fibre_g).toFixed(1)}g`
        : nutrition.dietary_fibre_g >= 6
        ? "Qualifies for Rich in Dietary Fibre claim ✓"
        : "Qualifies for Source of Fibre claim ✓",
  });

  // Price per gram
  const priceDev = deviation(costPerGram, bench.target_price_per_gram);
  results.push({
    metric: "Price per Gram",
    your_value: +costPerGram.toFixed(2),
    benchmark_value: bench.target_price_per_gram,
    unit: "₹/g",
    deviation_pct: priceDev,
    status:
      Math.abs(priceDev) <= 10
        ? "ON_TARGET"
        : costPerGram > bench.target_price_per_gram
        ? "ABOVE"
        : "BELOW",
    suggestion:
      Math.abs(priceDev) > 10
        ? costPerGram > bench.target_price_per_gram
          ? "Above category average — justify with premium claims"
          : "Opportunity to improve margins"
        : "Competitively priced",
  });

  return results;
}
