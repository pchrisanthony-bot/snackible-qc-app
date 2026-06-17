"use client";

import { useState } from "react";
import { Star, TrendingUp, Lightbulb, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { MarketIntelResult, MarketCompetitor, SIAnalysisItem } from "./MarketSearch";
import { cn } from "../../lib/utils";

const PLATFORMS = ["All", "Blinkit", "Zepto", "BigBasket", "SwiggyInstamart", "Amazon"] as const;

const PLATFORM_COLORS: Record<string, string> = {
  Blinkit: "bg-yellow-100 text-yellow-800 border-yellow-200",
  Zepto: "bg-purple-100 text-purple-800 border-purple-200",
  BigBasket: "bg-green-100 text-green-800 border-green-200",
  SwiggyInstamart: "bg-orange-100 text-orange-800 border-orange-200",
  Amazon: "bg-blue-100 text-blue-800 border-blue-200",
};

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "text-green-700 bg-green-50 border-green-200",
  negative: "text-red-700 bg-red-50 border-red-200",
  neutral: "text-[#7A9186] bg-[#F5FAF7] border-[#DCE8E0]",
};

const ALIGNMENT_COLORS: Record<string, string> = {
  High: "text-green-700 bg-green-50 border-green-300",
  Medium: "text-amber-700 bg-amber-50 border-amber-300",
  Low: "text-red-700 bg-red-50 border-red-300",
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      <Star className="w-3 h-3 fill-[#FBAE25] text-[#FBAE25]" />
      <span className="text-xs font-mono font-bold text-[#1A2B22]">{rating.toFixed(1)}</span>
    </div>
  );
}

function SIScorePill({ score }: { score: number }) {
  const color = score >= 4 ? "text-green-700 bg-green-50" : score >= 3 ? "text-amber-700 bg-amber-50" : "text-red-700 bg-red-50";
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-xs font-bold font-mono", color)}>
      SI {score.toFixed(1)}
    </span>
  );
}

function CompetitorCard({ competitor }: { competitor: MarketCompetitor }) {
  const [showReviews, setShowReviews] = useState(false);
  return (
    <div className="bg-white border border-[#DCE8E0] rounded-xl p-4 hover:border-[#2D6A4F]/40 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="text-xs font-bold text-[#2D6A4F] uppercase tracking-wide">{competitor.brand}</p>
          <p className="text-sm font-semibold text-[#1A2B22] leading-tight mt-0.5">{competitor.product_name}</p>
        </div>
        <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium whitespace-nowrap", PLATFORM_COLORS[competitor.platform])}>
          {competitor.platform === "SwiggyInstamart" ? "Swiggy" : competitor.platform}
        </span>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <span className="text-base font-bold text-[#1A2B22]">₹{competitor.price}</span>
        <span className="text-xs text-[#7A9186]">{competitor.pack_size}</span>
        <StarRating rating={competitor.rating} />
        <span className="text-xs text-[#7A9186] ml-auto">
          ₹{Math.round((competitor.price / parseFloat(competitor.pack_size)) * 100)}/100g
        </span>
      </div>

      <div className="flex flex-wrap gap-1 mb-3">
        {competitor.claims.map((claim) => (
          <span key={claim} className="text-xs px-2 py-0.5 bg-[#EAF3DE] text-[#2D6A4F] rounded-full border border-[#C5DFAC]">
            {claim}
          </span>
        ))}
      </div>

      <button
        onClick={() => setShowReviews(!showReviews)}
        className="flex items-center gap-1 text-xs text-[#7A9186] hover:text-[#2D6A4F] transition-colors"
      >
        {showReviews ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {competitor.sample_reviews.length} customer reviews
      </button>

      {showReviews && (
        <div className="mt-2 space-y-1.5">
          {competitor.sample_reviews.map((r, i) => (
            <div key={i} className={cn("text-xs p-2 rounded-lg border", SENTIMENT_COLORS[r.sentiment])}>
              "{r.text}"
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SIAnalysisRow({ item }: { item: SIAnalysisItem }) {
  return (
    <div className="p-4 border border-[#DCE8E0] rounded-xl bg-white">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <p className="text-xs text-[#7A9186] font-medium">{item.brand}</p>
          <p className="text-sm font-semibold text-[#1A2B22]">"{item.competitor_claim}"</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <SIScorePill score={item.si_score} />
          <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium", ALIGNMENT_COLORS[item.alignment])}>
            {item.alignment}
          </span>
        </div>
      </div>
      {item.risk_flags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {item.risk_flags.map((f) => (
            <span key={f} className="flex items-center gap-1 text-xs px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full border border-amber-200">
              <AlertTriangle className="w-3 h-3" />
              {f}
            </span>
          ))}
        </div>
      )}
      <p className="text-xs text-[#4A6358] bg-[#EAF3DE] rounded-lg p-2">
        <span className="font-semibold text-[#2D6A4F]">Snackible edge: </span>
        {item.snackible_advantage}
      </p>
    </div>
  );
}

export default function CompetitorResults({ result }: { result: MarketIntelResult }) {
  const [activeTab, setActiveTab] = useState<string>("All");

  const filtered = activeTab === "All"
    ? result.competitors
    : result.competitors.filter((c) => c.platform === activeTab);

  const { market_summary } = result;

  return (
    <div className="space-y-4">
      {/* Data source badge */}
      {result.dataSource && (
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-xs px-3 py-1 rounded-full border font-medium",
            result.dataSource === "scraper"
              ? "bg-green-50 text-green-700 border-green-200"
              : result.dataSource === "apify"
              ? "bg-blue-50 text-blue-700 border-blue-200"
              : "bg-[#FEF3D8] text-amber-700 border-amber-200"
          )}>
            {result.dataSource === "scraper" && "● Live scraped data"}
            {result.dataSource === "apify" && "● Apify actor data"}
            {result.dataSource === "claude" && "◎ AI-generated data (add SCRAPER_URL to use live scraping)"}
          </span>
          <span className="text-xs text-[#7A9186]">
            Results for "{result.keyword}" · {result.category} · {result.region}
          </span>
        </div>
      )}

      {/* Market Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-[#DCE8E0] rounded-xl p-3 text-center">
          <p className="text-xl font-bold font-mono text-[#2D6A4F]">{result.competitors.length}</p>
          <p className="text-[10px] text-[#7A9186] mt-0.5">Competitors Found</p>
        </div>
        <div className="bg-white border border-[#DCE8E0] rounded-xl p-3 text-center">
          <p className="text-xl font-bold font-mono text-[#2D6A4F]">₹{market_summary.avg_price}</p>
          <p className="text-[10px] text-[#7A9186] mt-0.5">Avg Market Price</p>
        </div>
        <div className="bg-white border border-[#DCE8E0] rounded-xl p-3 text-center">
          <p className="text-xl font-bold font-mono text-[#FBAE25]">
            {market_summary.sentiment_breakdown.positive}%
          </p>
          <p className="text-[10px] text-[#7A9186] mt-0.5">Positive Sentiment</p>
        </div>
        <div className="bg-white border border-[#DCE8E0] rounded-xl p-3 text-center">
          <p className="text-xl font-bold font-mono text-[#2D6A4F]">{market_summary.white_space.length}</p>
          <p className="text-[10px] text-[#7A9186] mt-0.5">White Space Gaps</p>
        </div>
      </div>

      {/* Dominant Claims + White Space */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-[#DCE8E0] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-[#2D6A4F]" />
            <p className="text-xs font-bold text-[#1A2B22] uppercase tracking-wide">Dominant Market Claims</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {market_summary.dominant_claims.map((c) => (
              <span key={c} className="text-xs px-2.5 py-1 bg-[#F5FAF7] border border-[#DCE8E0] text-[#4A6358] rounded-full">
                {c}
              </span>
            ))}
          </div>
        </div>
        <div className="bg-white border border-[#DCE8E0] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-[#FBAE25]" />
            <p className="text-xs font-bold text-[#1A2B22] uppercase tracking-wide">White Space Opportunities</p>
          </div>
          <div className="space-y-1.5">
            {market_summary.white_space.map((w) => (
              <div key={w} className="flex items-start gap-2 text-xs p-2 bg-[#FEF3D8] rounded-lg border border-[#FBAE25]/30">
                <span className="text-[#FBAE25] font-bold flex-shrink-0">→</span>
                <span className="text-[#4A6358]">{w}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Platform Tabs + Product Grid */}
      <div className="bg-white border border-[#DCE8E0] rounded-xl overflow-hidden">
        <div className="flex items-center gap-1 p-2 border-b border-[#DCE8E0] bg-[#F5FAF7] overflow-x-auto">
          {PLATFORMS.map((p) => {
            const count = p === "All" ? result.competitors.length : result.competitors.filter((c) => c.platform === p).length;
            if (count === 0 && p !== "All") return null;
            return (
              <button
                key={p}
                onClick={() => setActiveTab(p)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap",
                  activeTab === p
                    ? "bg-[#2D6A4F] text-white"
                    : "text-[#7A9186] hover:bg-[#EAF3DE] hover:text-[#2D6A4F]"
                )}
              >
                {p === "SwiggyInstamart" ? "Swiggy" : p}
                <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full", activeTab === p ? "bg-white/20" : "bg-[#DCE8E0]")}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((c) => (
            <CompetitorCard key={c.id} competitor={c} />
          ))}
        </div>
      </div>

      {/* SI Analysis */}
      <div className="bg-white border border-[#DCE8E0] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-lg bg-[#EAF3DE] flex items-center justify-center">
            <TrendingUp className="w-3.5 h-3.5 text-[#2D6A4F]" />
          </div>
          <h3 className="font-bold text-[#1A2B22] text-sm" style={{ fontFamily: "Raleway, sans-serif" }}>
            Competitor Claim SI Analysis
          </h3>
          <span className="text-xs text-[#7A9186] ml-auto">How do competitor claims score against Snackible's brand?</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {result.si_analysis.map((item, i) => (
            <SIAnalysisRow key={i} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
