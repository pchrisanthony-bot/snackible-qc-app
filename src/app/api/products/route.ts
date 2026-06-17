import { NextResponse } from "next/server";
import { SheetProduct } from "../../../lib/sheet-parser";
// Pre-built at build time by scripts/prebuild.mjs — bundled as a static import so
// it's always available on Vercel without any filesystem access at runtime.
import productsData from "../../../data/products-cache.json";

export async function GET() {
  return NextResponse.json(productsData as unknown as SheetProduct[]);
}

// Cache invalidation no longer needed (static import), kept for API compatibility
export async function POST() {
  return NextResponse.json({ ok: true });
}
