import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_QC_KEY });

const MEDHA_SYSTEM_PROMPT = `You are a senior FMCG brand strategist and claims analyst for an Indian healthy snack brand.

Given:
- The proposed marketing claim
- The product category and target region
- Nutritional facts of the product
- Competitor products data from quick-commerce platforms (if available)

Return a JSON object with exactly this structure:
{
  "si_score": <number 1.0-5.0>,
  "alignment": "Low" | "Medium" | "High",
  "confidence": "Low" | "Medium" | "High",
  "cluster": "<theme label e.g. Protein & Fibre>",
  "verdict": {
    "brand_fit": "<1-2 sentence assessment>",
    "target_audience": "<assessment for specified demographic>",
    "regulatory_risk": "<risk level and reason>",
    "cultural_risk": "<risk level and reason>",
    "competitive_risk": "<risk level and reason>"
  },
  "alternative_claims": [
    {
      "text": "<suggested claim copy>",
      "projected_si": <number>,
      "alignment": "Low" | "Medium" | "High",
      "rationale": "<why this scores better>"
    }
  ],
  "claim_gap_opportunities": ["<missed claim 1>", "<missed claim 2>"]
}

SI Score calculation weights:
- Brand positioning fit: 25%
- Consumer sentiment alignment: 30%
- Competitive differentiation (less crowded = higher): 25%
- Risk factor penalty (regulatory + cultural): 20%

Return ONLY valid JSON. No markdown, no backticks, no preamble.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { claim, category, region, product_name, nutrition_summary, competitor_data } = body;

    const userMessage = JSON.stringify({
      proposed_claim: claim,
      product_category: category,
      target_region: region,
      product_name,
      nutrition_summary,
      competitor_data: competitor_data || [],
    });

    const response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1500,
      system: MEDHA_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const parsed = JSON.parse(text);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Claim analysis error:", err);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
