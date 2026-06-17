export const RDA_VALUES: Record<string, number> = {
  energy_kcal: 2000,
  protein_g: 54,
  total_fat_g: 67,
  saturated_fat_g: 22,
  carbohydrates_g: 300,
  total_sugar_g: 50,
  added_sugar_g: 50,
  dietary_fibre_g: 30,
  sodium_mg: 2000,
  calcium_mg: 1000,
};

export const RDA_DISPLAY: Record<string, { label: string; unit: string }> = {
  energy_kcal: { label: "Energy", unit: "kcal" },
  protein_g: { label: "Protein", unit: "g" },
  total_fat_g: { label: "Total Fat", unit: "g" },
  saturated_fat_g: { label: "Saturated Fat", unit: "g" },
  trans_fat_g: { label: "Trans Fat", unit: "g" },
  carbohydrates_g: { label: "Carbohydrates", unit: "g" },
  total_sugar_g: { label: "Total Sugar", unit: "g" },
  added_sugar_g: { label: "Added Sugar", unit: "g" },
  dietary_fibre_g: { label: "Dietary Fibre", unit: "g" },
  sodium_mg: { label: "Sodium", unit: "mg" },
  calcium_mg: { label: "Calcium", unit: "mg" },
};
