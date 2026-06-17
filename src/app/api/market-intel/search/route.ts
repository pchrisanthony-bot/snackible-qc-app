import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_QC_KEY });

// ─────────────────────────────────────────────────────────────
// Brand book context — baked in so every Claude call scores
// competitor claims against real Snackible brand values.
// ─────────────────────────────────────────────────────────────
const BRAND_BOOK_CONTEXT = `
SNACKIBLE BRAND CONTEXT:
- Elevator Pitch: Reimagines India's favourite snacks for mindful munchers who want to eat better without giving up on flavour or fun, using nutritious ingredients to create guilt-free snacks.
- Tagline: "Mu(n)ch Better" | Slogan: "Revolutionizing Indian Snacking"
- Brand Motto: "Better shouldn't be optional."
- Strategic Platform: MINDFUL ADVENTURES
- Target Audience: New generation of mindful munchers seeking liberation from the binary of 'good' vs 'indulgent' — harmonized consumption.
- Personality: Playful, Mindful, Empowering, Effortless, Candid, Liberating
- Brand Persona: "Joyful Snacktivist" — informative but informal, sparks joy, direct and concise
- Emotional Benefits: Guilt-free delight, joy therapy, freedom, excitement, reassurance, uncomplicated
- Functional Benefits: High quality, accessible, assurance of taste, healthier alternatives, trusted ingredients, convenient formats
- Values: Quality-First, Fueled by Passion, Raising the Snack Bar, Innovative, Customer at the Core
- Key Differentiators: No Palm Oil, No Maida, No Fried Grease, No Refined Sugar, 45+ guilt-free snacks
- Writing Style: Fun but subtle, accurate, casual not sloppy, solutions not fear, no overclaims, no heavy jargon
- Tone: Always Positive / Often Fun / Sometimes Provocative (never shock value)
- Proof Points: Nutritional credibility, differentiated flavor profiles, in-house R&D, health-first positioning

SI SCORE LENSES (weight each 25%):
1. Brand Alignment — does the claim echo Snackible's voice, values, and positioning?
2. Audience Resonance — does it speak to the mindful muncher's desire for guilt-free joy?
3. Regulatory Risk — does it comply with FSSAI standards? Avoid overclaims.
4. Cultural/Competitive Sentiment — is the space crowded? Does it differentiate Snackible?
`;

// ─────────────────────────────────────────────────────────────
// Tier 1: Call the local/hosted Crawlee scraper server
// Set SCRAPER_URL=http://localhost:3001 in .env.local for dev,
// or point to Railway/Render URL in production.
// ─────────────────────────────────────────────────────────────
async function tryRealScraper(keyword: string): Promise<ScrapedProduct[] | null> {
  const scraperUrl = process.env.SCRAPER_URL;
  if (!scraperUrl) return null;

  try {
    const health = await fetch(`${scraperUrl}/health`, { signal: AbortSignal.timeout(3000) });
    if (!health.ok) return null;

    const res = await fetch(`${scraperUrl}/scrape`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyword, maxPerPlatform: 6 }),
      signal: AbortSignal.timeout(120000), // Crawlee needs up to 2 min for all platforms
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.products?.length > 0 ? data.products : null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Tier 2: Call Apify REST API to run a hosted Crawlee actor
// Set APIFY_TOKEN + APIFY_ACTOR_ID in Vercel env vars.
// Deploy the scraper/ directory as an Apify actor via Apify CLI:
//   cd scraper && apify push
// ─────────────────────────────────────────────────────────────
async function tryApify(keyword: string): Promise<ScrapedProduct[] | null> {
  const token = process.env.APIFY_TOKEN;
  const actorId = process.env.APIFY_ACTOR_ID;
  if (!token || !actorId) return null;

  try {
    // Start run
    const startRes = await fetch(
      `https://api.apify.com/v2/acts/${actorId}/runs?token=${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, maxPerPlatform: 6 }),
        signal: AbortSignal.timeout(10000),
      }
    );
    if (!startRes.ok) return null;
    const { data: run } = await startRes.json();

    // Poll until finished (max 90s)
    const deadline = Date.now() + 90000;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 5000));
      const statusRes = await fetch(
        `https://api.apify.com/v2/actor-runs/${run.id}?token=${token}`,
        { signal: AbortSignal.timeout(5000) }
      );
      const { data: runStatus } = await statusRes.json();
      if (runStatus.status === "SUCCEEDED") {
        const datasetRes = await fetch(
          `https://api.apify.com/v2/datasets/${runStatus.defaultDatasetId}/items?token=${token}`,
          { signal: AbortSignal.timeout(10000) }
        );
        const items = await datasetRes.json();
        return Array.isArray(items) && items.length > 0 ? items : null;
      }
      if (["FAILED", "ABORTED", "TIMED-OUT"].includes(runStatus.status)) return null;
    }
    return null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Tier 3 (always available): Claude generates realistic data
// Uses the full brand book context so SI scoring is meaningful.
// ─────────────────────────────────────────────────────────────
const GENERATION_SYSTEM_PROMPT = `You are a senior FMCG market intelligence analyst specializing in Indian healthy snacking.

${BRAND_BOOK_CONTEXT}

Given a search keyword, product category, and region, generate realistic competitor data as if scraped from Indian quick-commerce platforms (Blinkit, Zepto, BigBasket, Swiggy Instamart, Amazon India).

Return a JSON object with EXACTLY this structure:
{
  "competitors": [
    {
      "id": "<unique id>",
      "brand": "<brand name>",
      "product_name": "<full product name>",
      "price": <number in INR>,
      "pack_size": "<e.g. 150g>",
      "rating": <1-5 float>,
      "platform": "Blinkit" | "Zepto" | "BigBasket" | "SwiggyInstamart" | "Amazon",
      "claims": ["<claim 1>", "<claim 2>"],
      "sample_reviews": [
        { "text": "<review text>", "sentiment": "positive" | "negative" | "neutral" }
      ]
    }
  ],
  "si_analysis": [
    {
      "competitor_claim": "<most prominent claim from a competitor>",
      "brand": "<competitor brand>",
      "si_score": <1.0-5.0>,
      "alignment": "Low" | "Medium" | "High",
      "risk_flags": ["<flag 1>"],
      "snackible_advantage": "<how Snackible can differentiate here>"
    }
  ],
  "market_summary": {
    "avg_price": <number>,
    "price_range": { "min": <number>, "max": <number> },
    "dominant_claims": ["<claim 1>", "<claim 2>", "<claim 3>"],
    "sentiment_breakdown": { "positive": <pct>, "negative": <pct>, "neutral": <pct> },
    "white_space": ["<unclaimed positioning 1>", "<unclaimed positioning 2>"]
  }
}

Rules:
- Generate 8-12 realistic competitor products spread across ALL 5 platforms (at least 1 per platform)
- Use REAL Indian snack brand names (Too Yumm, Bingo, Haldiram's, Happilo, Yoga Bar, Ketofy, ProV, Unibic, etc.)
- Claims must be realistic FSSAI-compliant language: "Source of Protein", "High Fibre", "Baked not Fried", etc.
- Reviews must sound like real Indian consumers (mix of English and Hinglish acceptable)
- si_analysis must cover 4-6 of the most interesting competitor claims with honest scoring
- white_space items must be genuine market gaps where Snackible's brand book gives them an edge
- Return ONLY valid JSON. No markdown, no backticks, no explanation.`;

async function generateWithClaude(keyword: string, category: string, region: string) {
  const response = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 4000,
    system: GENERATION_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: JSON.stringify({
          search_keyword: keyword,
          product_category: category,
          target_region: region,
        }),
      },
    ],
  });
  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return JSON.parse(text);
}

// ─────────────────────────────────────────────────────────────
// Build market_summary from real scraped products
// ─────────────────────────────────────────────────────────────
async function enrichScrapedProducts(
  products: ScrapedProduct[],
  keyword: string,
  category: string,
  region: string
) {
  const claimCounts: Record<string, number> = {};
  products.forEach((p) => p.claims?.forEach((c) => { claimCounts[c] = (claimCounts[c] || 0) + 1; }));
  const dominant_claims = Object.entries(claimCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([c]) => c);

  const prices = products.map((p) => p.price).filter((p) => p > 0);
  const avg_price = prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;

  // Ask Claude to do SI analysis + white space on real products
  const prompt = `
Based on these REAL competitor products scraped from Indian q-commerce platforms for keyword "${keyword}":
${JSON.stringify(products.slice(0, 12), null, 2)}

Return JSON with exactly:
{
  "si_analysis": [4-6 items with competitor_claim, brand, si_score, alignment, risk_flags[], snackible_advantage],
  "white_space": ["2-3 unclaimed positioning gaps where Snackible can win"]
}
Using the Snackible brand context provided in the system prompt.
Return ONLY valid JSON.`;

  let si_analysis = [];
  let white_space: string[] = [];

  try {
    const resp = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1500,
      system: GENERATION_SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });
    const text = resp.content[0].type === "text" ? resp.content[0].text : "{}";
    const parsed = JSON.parse(text);
    si_analysis = parsed.si_analysis || [];
    white_space = parsed.white_space || [];
  } catch {}

  return {
    competitors: products.map((p, i) => ({ ...p, id: p.id || `real_${i}` })),
    si_analysis,
    market_summary: {
      avg_price,
      price_range: {
        min: prices.length ? Math.min(...prices) : 0,
        max: prices.length ? Math.max(...prices) : 0,
      },
      dominant_claims,
      sentiment_breakdown: { positive: 60, negative: 20, neutral: 20 },
      white_space,
    },
  };
}

interface ScrapedProduct {
  id?: string;
  brand: string;
  product_name: string;
  price: number;
  pack_size: string;
  rating: number;
  platform: string;
  claims: string[];
  sample_reviews: Array<{ text: string; sentiment: string }>;
}

// ─────────────────────────────────────────────────────────────
// Main handler
// ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { keyword, category = "Healthy Snacks", region = "Pan India" } = await req.json();

    if (!keyword) {
      return NextResponse.json({ error: "keyword is required" }, { status: 400 });
    }

    let result;
    let dataSource: "scraper" | "apify" | "claude" = "claude";

    // Tier 1: Real scraper
    const scraped = await tryRealScraper(keyword);
    if (scraped && scraped.length > 0) {
      dataSource = "scraper";
      result = await enrichScrapedProducts(scraped, keyword, category, region);
    } else {
      // Tier 2: Apify
      const apifyData = await tryApify(keyword);
      if (apifyData && apifyData.length > 0) {
        dataSource = "apify";
        result = await enrichScrapedProducts(apifyData, keyword, category, region);
      } else {
        // Tier 3: Claude generation
        result = await generateWithClaude(keyword, category, region);
      }
    }

    return NextResponse.json({
      ...result,
      keyword,
      category,
      region,
      dataSource,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Market intel search error:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
