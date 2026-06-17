export const ALLERGEN_MAP: Record<string, string[]> = {
  wheat: ["Gluten"],
  maida: ["Gluten"],
  barley: ["Gluten"],
  oats: ["Gluten"],
  rye: ["Gluten"],
  milk: ["Milk"],
  cheese: ["Milk"],
  whey: ["Milk"],
  casein: ["Milk"],
  butter: ["Milk"],
  ghee: ["Milk"],
  cream: ["Milk"],
  curd: ["Milk"],
  paneer: ["Milk"],
  soy: ["Soy"],
  soya: ["Soy"],
  peanut: ["Peanuts"],
  groundnut: ["Peanuts"],
  almond: ["Tree Nuts"],
  cashew: ["Tree Nuts"],
  walnut: ["Tree Nuts"],
  pistachio: ["Tree Nuts"],
  sesame: ["Sesame"],
  mustard: ["Mustard"],
  egg: ["Egg"],
};

export function detectAllergens(ingredients: string[]): string[] {
  const detected = new Set<string>();
  const lower = ingredients.map((i) => i.toLowerCase());
  for (const ingredient of lower) {
    for (const [keyword, allergens] of Object.entries(ALLERGEN_MAP)) {
      if (ingredient.includes(keyword)) {
        allergens.forEach((a) => detected.add(a));
      }
    }
  }
  return Array.from(detected);
}

export function checkAllergenDeclaration(
  ingredients: string[],
  allergenDeclarationText: string | null
): Array<{ allergen: string; found_in_ingredients: boolean; declared_in_artwork: boolean; severity: "CRITICAL" | "WARNING" }> {
  const detected = detectAllergens(ingredients);
  const declText = (allergenDeclarationText || "").toLowerCase();

  return detected.map((allergen) => {
    const declared = declText.includes(allergen.toLowerCase());
    return {
      allergen,
      found_in_ingredients: true,
      declared_in_artwork: declared,
      severity: declared ? "WARNING" : "CRITICAL",
    };
  });
}
