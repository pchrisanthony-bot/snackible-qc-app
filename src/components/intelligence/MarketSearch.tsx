"use client";

import { useState } from "react";
import { Search, Loader2 } from "lucide-react";

const CATEGORIES = [
  "Healthy Snacks",
  "Protein Snacks",
  "Baked Snacks",
  "Chips & Crisps",
  "Millet Snacks",
  "Nuts & Seeds",
  "Granola & Bars",
  "Puffs & Popcorn",
  "Namkeen",
];

const REGIONS = ["Pan India", "Metro Cities", "Tier 1 Cities", "North India", "South India", "West India", "East India"];

interface Props {
  onResults: (data: MarketIntelResult) => void;
  isLoading: boolean;
  setLoading: (v: boolean) => void;
}

export interface MarketCompetitor {
  id: string;
  brand: string;
  product_name: string;
  price: number;
  pack_size: string;
  rating: number;
  platform: "Blinkit" | "Zepto" | "BigBasket" | "SwiggyInstamart" | "Amazon";
  claims: string[];
  sample_reviews: Array<{ text: string; sentiment: string }>;
}

export interface SIAnalysisItem {
  competitor_claim: string;
  brand: string;
  si_score: number;
  alignment: "Low" | "Medium" | "High";
  risk_flags: string[];
  snackible_advantage: string;
}

export interface MarketIntelResult {
  keyword: string;
  category: string;
  region: string;
  timestamp: string;
  dataSource?: "scraper" | "apify" | "claude";
  competitors: MarketCompetitor[];
  si_analysis: SIAnalysisItem[];
  market_summary: {
    avg_price: number;
    price_range: { min: number; max: number };
    dominant_claims: string[];
    sentiment_breakdown: { positive: number; negative: number; neutral: number };
    white_space: string[];
  };
}

export default function MarketSearch({ onResults, isLoading, setLoading }: Props) {
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("Healthy Snacks");
  const [region, setRegion] = useState("Pan India");

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!keyword.trim() || isLoading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/market-intel/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: keyword.trim(), category, region }),
      });
      if (!res.ok) throw new Error("Search failed");
      const data: MarketIntelResult = await res.json();
      onResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-[#DCE8E0] p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-[#EAF3DE] flex items-center justify-center">
          <Search className="w-4 h-4 text-[#2D6A4F]" />
        </div>
        <div>
          <h2 className="font-bold text-[#1A2B22] text-sm" style={{ fontFamily: "Raleway, sans-serif" }}>
            Market Intelligence Search
          </h2>
          <p className="text-xs text-[#7A9186]">Scan Blinkit, Zepto, BigBasket, Swiggy Instamart & Amazon</p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder='e.g. "protein chips", "millet snacks", "baked namkeen"'
          className="flex-1 px-4 py-2.5 text-sm border border-[#DCE8E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] text-[#1A2B22] placeholder:text-[#B0C4BB]"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2.5 text-sm border border-[#DCE8E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 text-[#1A2B22] bg-white"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="px-3 py-2.5 text-sm border border-[#DCE8E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 text-[#1A2B22] bg-white"
        >
          {REGIONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={!keyword.trim() || isLoading}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#2D6A4F] text-white text-sm font-semibold rounded-xl hover:bg-[#245c43] disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              Find Competitors →
            </>
          )}
        </button>
      </form>
    </div>
  );
}
