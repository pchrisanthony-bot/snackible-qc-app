import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_QC_KEY });

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const mimeType = file.type || "image/jpeg";
    const isPDF = mimeType === "application/pdf" || file.name?.endsWith(".pdf");

    const systemPrompt = `You are a food label OCR and data extraction assistant. Extract all data from the label and return ONLY valid JSON with no markdown fences.

Return this exact JSON structure:
{
  "nutrition_table": {
    "serving_size_g": number,
    "energy_kcal": number,
    "protein_g": number,
    "carbohydrate_g": number,
    "total_sugar_g": number,
    "added_sugar_g": number or null,
    "dietary_fibre_g": number or null,
    "total_fat_g": number,
    "saturated_fat_g": number or null,
    "trans_fat_g": number or null,
    "sodium_mg": number or null,
    "calcium_mg": number or null
  },
  "serving_size_g": number,
  "barcode": string or null,
  "allergens_declared": string[],
  "claims_on_pack": string[],
  "fssai_license": string or null,
  "mrp": string or null,
  "net_weight": string or null
}

Rules:
- nutrition_table values should be per the serving size on the label (usually per 100g, but check)
- serving_size_g is the grammage the nutrition table is per
- allergens_declared: list each allergen explicitly declared (e.g. ["wheat", "milk", "soya"])
- claims_on_pack: all marketing/nutritional claims found (e.g. ["High Protein", "No Palm Oil"])
- For missing/not found fields use null
- All nutrient values must be numbers (use 0 for "nil", "ND", "BLQ", "trace")`;

    let content: Anthropic.MessageParam["content"];

    if (isPDF) {
      content = [
        {
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: base64,
          },
        } as Anthropic.DocumentBlockParam,
        {
          type: "text",
          text: "Extract all nutrition and label data from this food label PDF and return the JSON as specified.",
        },
      ];
    } else {
      content = [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
            data: base64,
          },
        },
        {
          type: "text",
          text: "Extract all nutrition and label data from this food label image and return the JSON as specified.",
        },
      ];
    }

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: "user", content }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    // Strip any markdown fences just in case
    const cleaned = text.replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: "Failed to parse OCR response", raw: text }, { status: 500 });
    }

    return NextResponse.json(parsed);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
