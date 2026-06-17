import {
  NutritionPer100g,
  ProductMeta,
  QCResult,
  IntelligenceResult,
  CompetitorData,
} from "../lib/types";

export const MOCK_PRODUCT_META: ProductMeta = {
  sku: "RG-01",
  product_name: "Snackible Ragi Chips",
  pack_weight_g: 40,
  serving_size_g: 20,
  mrp: 45,
  barcode: "8906123456789",
  oil_type: "Rice Bran Oil",
  product_category: "Fried",
  ingredients_list: [
    "Ragi (Finger Millet) Flour",
    "Rice Bran Oil",
    "Tapioca Starch",
    "Salt",
    "Spices (Cumin, Pepper)",
    "Sesame Seeds",
    "Citric Acid",
  ],
  claims_on_pack: ["Source of Protein", "Source of Dietary Fibre", "Source of Calcium"],
};

export const MOCK_NUTRITION: NutritionPer100g = {
  energy_kcal: 430,
  protein_g: 6.5,
  total_fat_g: 18,
  saturated_fat_g: 4.5,
  trans_fat_g: 0,
  carbohydrates_g: 62,
  total_sugar_g: 3.2,
  added_sugar_g: 0,
  dietary_fibre_g: 5.0,
  sodium_mg: 840,
  calcium_mg: 300,
};

export const MOCK_QC_RESULT: QCResult = {
  mismatches: [
    {
      field: "Dietary Fibre",
      master_value: "5.0g",
      artwork_value: "6.0g",
      severity: "WARNING",
      message: "Artwork shows 6.0g but master data shows 5.0g per 100g",
    },
    {
      field: "Allergen Declaration",
      master_value: "Contains Sesame",
      artwork_value: "Not declared",
      severity: "CRITICAL",
      message: "Sesame found in ingredients but not declared in allergen box on artwork",
    },
  ],
  allergen_alerts: [
    {
      allergen: "Sesame",
      found_in_ingredients: true,
      declared_in_artwork: false,
      severity: "CRITICAL",
    },
  ],
  mandatory_checklist: [
    { item: "FSSAI License Number", status: "FOUND" },
    { item: "Customer Care Details", status: "FOUND" },
    { item: "Net Weight", status: "FOUND" },
    { item: "Veg/Non-Veg Symbol", status: "FOUND" },
    { item: "Barcode", status: "FOUND" },
    { item: "Batch Code Space", status: "FOUND" },
    { item: "MRP", status: "FOUND" },
    { item: "Manufacturing Details", status: "FOUND" },
  ],
  ocr_extract: {
    nutrition_table: {
      energy_kcal: 430,
      protein_g: 6.5,
      total_fat_g: 18,
      saturated_fat_g: 4.5,
      trans_fat_g: 0,
      carbohydrates_g: 62,
      total_sugar_g: 3.2,
      added_sugar_g: 0,
      dietary_fibre_g: 6.0,
      sodium_mg: 840,
      calcium_mg: 300,
    },
    serving_size: "20g (approx. 8 chips)",
    net_weight: "40g",
    ingredients_text:
      "Ragi (Finger Millet) Flour, Rice Bran Oil, Tapioca Starch, Salt, Spices (Cumin, Pepper), Sesame Seeds, Citric Acid",
    claims_found: ["Source of Protein", "Source of Dietary Fibre", "Source of Calcium"],
    barcode_number: "8906123456789",
    fssai_license: "12345678901234",
    mrp_printed: "₹45",
    veg_symbol_present: true,
    customer_care_present: true,
    batch_space_present: true,
    manufacturing_details_present: true,
    allergen_declaration: null,
  },
  overall_status: "FAIL",
};

export const MOCK_INTELLIGENCE_RESULT: IntelligenceResult = {
  si_score: 3.88,
  alignment: "Medium",
  confidence: "High",
  cluster: "Protein & Fibre",
  verdict: {
    brand_fit:
      "The Source of Protein and Fibre claims align well with Snackible's clean-label positioning. Protein at 6.5g is borderline for the Source of Protein threshold (5.4g) but compliant.",
    target_audience:
      "Strong fit for health-conscious 25–34 female demographic seeking guilt-free snacking. Ragi positioning resonates with South India's millet preference.",
    regulatory_risk:
      "Low — all three claims are backed by FSSAI-compliant values. Sodium at 840mg is a latent risk if FSSAI labelling rules tighten.",
    cultural_risk:
      "Low — ragi is a culturally trusted grain in India with strong positive health associations across age groups.",
    competitive_risk:
      "Medium — 6 of 8 tracked competitors use High Protein claims, creating category noise. Source of Protein positioning is less crowded and more defensible.",
  },
  alternative_claims: [
    {
      text: "Baked with 100% Rice Bran Oil",
      projected_si: 4.2,
      alignment: "High",
      rationale:
        "Oil transparency is an emerging trust signal in Indian FMCG — less crowded than protein claims and signals clean-label authenticity.",
    },
    {
      text: "Ancient Grain Snack — Made with Ragi",
      projected_si: 4.1,
      alignment: "High",
      rationale:
        "Millet-first positioning is significantly less competitive than protein and scores higher on cultural resonance for South Indian consumers.",
    },
    {
      text: "High Calcium for Strong Bones",
      projected_si: 3.9,
      alignment: "Medium",
      rationale:
        "Calcium claim is unique among tracked competitors and is FSSAI-supported (300mg meets High Calcium threshold).",
    },
  ],
  claim_gap_opportunities: [
    "High Calcium (unique in category, FSSAI-compliant at 300mg)",
    "No Added Sugar",
    "Millet Based",
    "No Maida",
  ],
};

export const MOCK_COMPETITORS: CompetitorData[] = [
  {
    brand: "Prolicious",
    product: "High Protein Khakhra",
    platform: "Zepto",
    price: 89,
    rating: 4.2,
    claims: ["High Protein", "Baked"],
    sample_reviews: [
      { text: "Great crunch and protein content", sentiment: "positive" },
      { text: "Tastes like cardboard", sentiment: "negative" },
    ],
  },
  {
    brand: "Ritebite Max",
    product: "Protein Cheese & Jalapeno",
    platform: "Blinkit",
    price: 43,
    rating: 4.8,
    claims: ["High Protein", "No Added Sugar"],
    sample_reviews: [{ text: "Very satisfying crunch", sentiment: "positive" }],
  },
  {
    brand: "Hello Tempayy",
    product: "Peri Peri High Protein Soya Chips",
    platform: "Zepto",
    price: 123,
    rating: 4.2,
    claims: ["High Protein", "Baked Not Fried"],
    sample_reviews: [
      { text: "Too dry for my taste", sentiment: "negative" },
      { text: "Healthy alternative to chips", sentiment: "positive" },
    ],
  },
  {
    brand: "Yogabar",
    product: "High Protein Muesli",
    platform: "Amazon",
    price: 650,
    rating: 4.5,
    claims: ["High Protein", "High Fibre", "No Preservatives"],
    sample_reviews: [{ text: "Great texture and filling", sentiment: "positive" }],
  },
  {
    brand: "Heka Bites",
    product: "Roasted Jowar Puffs",
    platform: "Blinkit",
    price: 55,
    rating: 4.0,
    claims: ["Millet Based", "Baked"],
    sample_reviews: [
      { text: "Good but too salty", sentiment: "negative" },
      { text: "Kids love it", sentiment: "positive" },
    ],
  },
  {
    brand: "Superyou",
    product: "Protein Chips Peri Peri",
    platform: "Zepto",
    price: 99,
    rating: 3.8,
    claims: ["High Protein", "Gluten Free"],
    sample_reviews: [{ text: "Overpriced for the quantity", sentiment: "negative" }],
  },
  {
    brand: "True Elements",
    product: "Baked Ragi Chips",
    platform: "Amazon",
    price: 129,
    rating: 4.1,
    claims: ["Source of Calcium", "No Palm Oil", "Baked"],
    sample_reviews: [
      { text: "Authentic ragi taste", sentiment: "positive" },
      { text: "Could use more seasoning", sentiment: "neutral" },
    ],
  },
  {
    brand: "Slurrp Farm",
    product: "Millet Dosa Chips",
    platform: "Blinkit",
    price: 75,
    rating: 4.3,
    claims: ["Millet Based", "No Maida", "Source of Fibre"],
    sample_reviews: [{ text: "Perfect snack for kids", sentiment: "positive" }],
  },
];
