import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_QC_KEY });

// Use the same model that works for analyze-claim
const MODEL = "claude-sonnet-4-5";

const ARTWORK_PROMPT = `You are a packaging QC inspector for an Indian FMCG snack brand. Your job is to accurately extract nutrition data from product labels.

Return ONLY a valid JSON object — no markdown fences, no explanation text before or after.

JSON structure:
{
  "nutrition_table": {
    "energy_kcal": <number, see serving rules below>,
    "protein_g": <number>,
    "total_fat_g": <number>,
    "saturated_fat_g": <number>,
    "trans_fat_g": <number>,
    "carbohydrates_g": <number>,
    "total_sugar_g": <number>,
    "added_sugar_g": <number>,
    "dietary_fibre_g": <number>,
    "sodium_mg": <number>,
    "calcium_mg": <number>,
    "cholesterol_mg": <number or null>,
    "unsaturated_fat_g": <number or null>
  },
  "serving_size_g": <the numeric gram value of the serving column used — e.g. 20 or 55 or 100>,
  "serving_size": "<serving size as printed>",
  "net_weight": "<net weight as printed>",
  "ingredients_text": "<full ingredients list>",
  "claims_found": ["<nutrition/marketing claims on pack>"],
  "barcode_number": "<digits or null>",
  "fssai_license": "<FSSAI licence number or null>",
  "mrp_printed": "<MRP digits as printed or null>",
  "veg_symbol_present": true or false,
  "customer_care_present": true or false,
  "batch_space_present": true or false,
  "manufacturing_details_present": true or false,
  "allergen_declaration": "<allergen text or null>"
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NUTRITION TABLE EXTRACTION — READ CAREFULLY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 1 — IDENTIFY THE TABLE COLUMNS
Many Indian labels have this layout:
  Nutrient | Per Xg (serving) | Per 100g | % RDA

Some smaller pack labels (18g, 20g, 30g) show ONLY:
  Nutrient | Per Xg | % RDA

Identify which columns are present BEFORE reading any values.

STEP 2 — CHOOSE THE RIGHT COLUMN
• If the label has a "Per Xg" serving column (e.g. Per 20g, Per 55g, Per 30g):
  - Read values from that column
  - Set serving_size_g = X (the number from the column header)
  - Do NOT scale to per-100g — return the exact numbers from the Per Xg column
• If the label ONLY has a "Per 100g" column (no per-serving column):
  - Read values from the Per 100g column
  - Set serving_size_g = 100
• NEVER read the % RDA column — it contains percentages of daily requirements, not nutrient amounts.

STEP 3 — ROW-BY-ROW EXTRACTION
Process each nutrient row independently. Map to the correct JSON key:

  Energy / Energy (kcal)              → energy_kcal       [unit: kcal]
  Protein                             → protein_g         [unit: g]
  Total Fat / Fat                     → total_fat_g       [unit: g]
  Saturated Fat / Sat. Fat            → saturated_fat_g   [unit: g]
  Trans Fat / Trans fat               → trans_fat_g       [unit: g]
  Carbohydrate / Carbohydrates        → carbohydrates_g   [unit: g]
  Total Sugar / Total Sugars / Sugars               → total_sugar_g     [unit: g]
  Added Sugar / Added Sugars / of which Added Sugar → added_sugar_g     [unit: g]
  Dietary Fibre / Dietary Fiber                     → dietary_fibre_g   [unit: g]
  Sodium                                            → sodium_mg         [unit: mg]
  Calcium                                           → calcium_mg        [unit: mg]
  Cholesterol                                       → cholesterol_mg    [unit: mg]
  Unsaturated Fat / Monounsaturated / Polyunsaturated (combined or total) → unsaturated_fat_g [unit: g]

⚠️  CRITICAL: Total Sugar and Dietary Fibre are DIFFERENT rows. If the table order is:
    ...Total Sugar | Dietary Fibre...
    the FIRST value goes to total_sugar_g and the SECOND to dietary_fibre_g. Never swap them.

⚠️  Added Sugar is often a sub-row indented under Total Sugar (e.g. "of which Added Sugars"). Always read it — if it says BLQ or is absent, return 0 (not null).

⚠️  Calcium: many labels print Calcium as "0 mg" or "Nil". Return 0 in that case — do NOT return null. Only return null if the row is completely absent from the table.

⚠️  NEVER put a % RDA value (like 4.8, 2.7, 11.9) into the nutrition_table — those are percentages of daily requirements, not gram values.

STEP 4 — EXAMPLE (Per 20g label — return AS-IS, no scaling)
  serving_size_g: 20
  Row "Total Sugar – 0.272g"  → total_sugar_g: 0.272  (NOT 1.36 — do NOT multiply by 5)
  Row "Dietary Fibre – 0.7g"  → dietary_fibre_g: 0.7  (NOT 3.5)
  Row "Total Fat – 4.02g"     → total_fat_g: 4.02     (NOT 20.1)
  Row "Sodium – 238.5mg"      → sodium_mg: 238.5      (NOT 1192.5)

EXAMPLE (Per 55g label — return AS-IS)
  serving_size_g: 55
  Row "Energy – 286.83kcal"   → energy_kcal: 286.83
  Row "Protein – 5.37g"       → protein_g: 5.37

STEP 5 — SPECIAL VALUES
  BLQ / Below Limit of Quantification → 0
  Traces / Trace                       → 0
  Nil / None / NA / N/A / "-"          → 0
  kJ only (no kcal): divide by 4.184 to get kcal
  Partially legible: use best estimate, do not return null unless completely unreadable

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPLIANCE FIELDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  veg_symbol_present: true if green dot/square/circle symbol is visible
  batch_space_present: true if "Batch No:", "Mfg. Date:", "Use By:", or blank date fields are present
  customer_care_present: true if a phone number, email, or "Consumer Care" text is present
  manufacturing_details_present: true if manufacturer name + address is present
  fssai_license: extract the full FSSAI licence number (14 digits, starts with 1 or 2)
  barcode_number: read all digits under the barcode (EAN-13 is 13 digits)`;


export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const isPDF = file.type === "application/pdf" || file.name?.endsWith(".pdf");

    // Build content blocks — claude-sonnet-4 supports both image and document natively
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const contentBlocks: any[] = isPDF
      ? [
          {
            type: "document",
            source: { type: "base64", media_type: "application/pdf", data: base64 },
          },
          { type: "text", text: ARTWORK_PROMPT },
        ]
      : [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: (
                file.type === "image/png"  ? "image/png"  :
                file.type === "image/webp" ? "image/webp" :
                file.type === "image/gif"  ? "image/gif"  :
                "image/jpeg"
              ),
              data: base64,
            },
          },
          { type: "text", text: ARTWORK_PROMPT },
        ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await (client.messages.create as any)({
      model: MODEL,
      max_tokens: 4096,
      messages: [{ role: "user", content: contentBlocks }],
    });

    const rawText: string = response.content?.[0]?.text ?? "";

    // Strip markdown fences then find the outermost {...} block
    const stripped = rawText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();

    // Find first { and last } to isolate the JSON object even if Claude adds preamble
    const start = stripped.indexOf("{");
    const end   = stripped.lastIndexOf("}");
    if (start === -1 || end === -1) {
      throw new Error(`No JSON object found in response. Raw: ${stripped.slice(0, 200)}`);
    }
    const jsonStr = stripped.slice(start, end + 1);

    const parsed = JSON.parse(jsonStr);
    return NextResponse.json(parsed);

  } catch (err) {
    console.error("Artwork analysis error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Analysis failed", detail: message }, { status: 500 });
  }
}
