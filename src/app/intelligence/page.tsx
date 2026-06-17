"use client";

import { useState, useEffect } from "react";
import { useAnalysis } from "../../context/AnalysisContext";
import SIScoreCard from "../../components/intelligence/SIScoreCard";
import CompetitorTable from "../../components/intelligence/CompetitorTable";
import AlternativeClaimsPanel from "../../components/intelligence/AlternativeClaimsPanel";
import ClaimGapAnalysis from "../../components/intelligence/ClaimGapAnalysis";
import PricingIntel from "../../components/intelligence/PricingIntel";
import MarketSearch, { MarketIntelResult } from "../../components/intelligence/MarketSearch";
import CompetitorResults from "../../components/intelligence/CompetitorResults";
import ClaimHistory from "../../components/intelligence/ClaimHistory";
import StatusBadge from "../../components/shared/StatusBadge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Brain, TrendingUp, Users, Lightbulb, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";

const HISTORY_KEY = "snackible_market_history";

function Section({ title, icon, children, defaultOpen = true }: { title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-xl border border-[#DCE8E0] shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 p-4 hover:bg-[#F5FAF7] transition-colors text-left"
      >
        <div className="text-[#2D6A4F]">{icon}</div>
        <h3 className="font-bold text-[#1A2B22] flex-1" style={{ fontFamily: "Raleway, sans-serif" }}>{title}</h3>
        {open ? <ChevronDown className="w-4 h-4 text-[#7A9186]" /> : <ChevronRight className="w-4 h-4 text-[#7A9186]" />}
      </button>
      {open && <div className="p-4 pt-0 border-t border-[#DCE8E0]">{children}</div>}
    </div>
  );
}

const RISK_COLORS: Record<string, string> = {
  Low: "border-l-green-400 bg-green-50",
  Medium: "border-l-amber-400 bg-amber-50",
  High: "border-l-red-400 bg-red-50",
};

function getRiskLevel(text: string): "Low" | "Medium" | "High" {
  const lower = text.toLowerCase();
  if (lower.startsWith("low")) return "Low";
  if (lower.startsWith("medium") || lower.startsWith("moderate")) return "Medium";
  if (lower.startsWith("high")) return "High";
  return "Low";
}

export default function IntelligencePage() {
  const { state } = useAnalysis();
  const { intelligenceResult, benchmarkResults, competitors, productMeta } = state;

  const [isLoading, setIsLoading] = useState(false);
  const [marketResult, setMarketResult] = useState<MarketIntelResult | null>(null);
  const [history, setHistory] = useState<MarketIntelResult[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) setHistory(JSON.parse(stored));
    } catch {}
  }, []);

  function handleResults(data: MarketIntelResult) {
    setMarketResult(data);
    setHistory((prev) => {
      const updated = [data, ...prev].slice(0, 10);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  }

  function clearHistory() {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  }

  const benchChartData = benchmarkResults.map((b) => ({
    name: b.metric,
    yours: b.your_value,
    bench: b.benchmark_value,
    status: b.status,
  }));

  const avgRating =
    competitors.length > 0
      ? (competitors.reduce((s, c) => s + c.rating, 0) / competitors.length).toFixed(1)
      : "—";

  const allCompetitorClaims = Array.from(new Set(competitors.flatMap((c) => c.claims)));

  return (
    <div className="space-y-5">
      {/* ── MARKET INTELLIGENCE SEARCH ── */}
      <MarketSearch onResults={handleResults} isLoading={isLoading} setLoading={setIsLoading} />

      {/* Loading skeleton */}
      {isLoading && (
        <div className="bg-white border border-[#DCE8E0] rounded-xl p-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-[#2D6A4F] border-t-transparent animate-spin" />
            <p className="text-sm font-semibold text-[#1A2B22]">Scanning quick-commerce platforms...</p>
            <p className="text-xs text-[#7A9186]">Analysing competitors across Blinkit, Zepto, BigBasket, Swiggy Instamart & Amazon</p>
          </div>
        </div>
      )}

      {/* Results */}
      {!isLoading && marketResult && (
        <CompetitorResults result={marketResult} />
      )}

      {/* History (only when no active result) */}
      {!isLoading && !marketResult && (
        <ClaimHistory history={history} onSelect={setMarketResult} onClear={clearHistory} />
      )}

      {/* History button when results are showing */}
      {!isLoading && marketResult && history.length > 1 && (
        <ClaimHistory history={history.slice(1)} onSelect={(item) => setMarketResult(item)} onClear={clearHistory} />
      )}

      {/* ── PRODUCT INTELLIGENCE (only when a product has been analysed) ── */}
      {intelligenceResult && (
        <>
          <div className="flex items-center gap-3 pt-2">
            <div className="h-px flex-1 bg-[#DCE8E0]" />
            <span className="text-xs font-semibold text-[#7A9186] uppercase tracking-wide">Product Intelligence</span>
            <div className="h-px flex-1 bg-[#DCE8E0]" />
          </div>

          {/* SI Score */}
          <SIScoreCard result={intelligenceResult} />

          {/* AI Verdict */}
          <Section title="AI Verdict Analysis" icon={<Brain className="w-5 h-5" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {[
                { key: "brand_fit", label: "Brand Fit", value: intelligenceResult.verdict.brand_fit },
                { key: "target_audience", label: "Target Audience", value: intelligenceResult.verdict.target_audience },
                { key: "regulatory_risk", label: "Regulatory Risk", value: intelligenceResult.verdict.regulatory_risk },
                { key: "cultural_risk", label: "Cultural Risk", value: intelligenceResult.verdict.cultural_risk },
                { key: "competitive_risk", label: "Competitive Risk", value: intelligenceResult.verdict.competitive_risk },
              ].map((item) => {
                const risk = getRiskLevel(item.value);
                return (
                  <div key={item.key} className={cn("p-4 rounded-xl border-l-4", RISK_COLORS[risk])}>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs font-bold text-[#4A6358] uppercase tracking-wide">{item.label}</p>
                      <StatusBadge status={risk} size="xs" />
                    </div>
                    <p className="text-sm text-[#1A2B22] leading-relaxed">{item.value}</p>
                  </div>
                );
              })}
            </div>
          </Section>

          {/* Internal Benchmarks */}
          {benchmarkResults.length > 0 && (
            <Section title="Internal Brand Benchmarks" icon={<TrendingUp className="w-5 h-5" />} defaultOpen={false}>
              <div className="grid grid-cols-2 gap-5 pt-2">
                <div className="overflow-x-auto rounded-xl border border-[#DCE8E0]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#EAF3DE] border-b border-[#DCE8E0]">
                        {["Metric", "Yours", "Benchmark", "Status"].map((h) => (
                          <th key={h} className="px-3 py-2 text-left text-xs font-bold text-[#2D6A4F] uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {benchmarkResults.map((b, i) => (
                        <tr key={i} className="border-b border-[#DCE8E0] last:border-0 bg-white">
                          <td className="px-3 py-2.5 text-xs font-medium text-[#1A2B22]">{b.metric}</td>
                          <td className="px-3 py-2.5 font-mono text-xs font-bold text-[#1A2B22]">{b.your_value}</td>
                          <td className="px-3 py-2.5 font-mono text-xs text-[#7A9186]">{b.benchmark_value}</td>
                          <td className="px-3 py-2.5"><StatusBadge status={b.status} size="xs" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div>
                  <p className="text-xs text-[#7A9186] mb-2 font-medium">Yours vs Benchmark</p>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={benchChartData} layout="vertical" margin={{ left: 0, right: 8 }}>
                        <XAxis type="number" tick={{ fontSize: 10, fill: "#7A9186" }} tickLine={false} axisLine={false} />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "#7A9186" }} tickLine={false} axisLine={false} width={70} />
                        <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #DCE8E0", fontSize: 11 }} />
                        <Bar dataKey="yours" name="Yours" radius={[0, 4, 4, 0]} maxBarSize={16}>
                          {benchChartData.map((entry, i) => (
                            <Cell key={i} fill={entry.status === "ON_TARGET" ? "#2D6A4F" : entry.status === "ABOVE" ? "#FBAE25" : "#EF4444"} />
                          ))}
                        </Bar>
                        <Bar dataKey="bench" name="Benchmark" fill="#C5DFAC" radius={[0, 4, 4, 0]} maxBarSize={16} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-1.5">
                {benchmarkResults.filter((b) => b.status !== "ON_TARGET").map((b, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs p-2 bg-[#FEF3D8] rounded-lg border border-[#FBAE25]/30">
                    <span className="text-[#FBAE25] font-bold flex-shrink-0">→</span>
                    <span className="text-[#4A6358]">
                      <span className="font-semibold text-[#1A2B22]">{b.metric}:</span> {b.suggestion}
                    </span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Competitive Landscape from product analysis */}
          {competitors.length > 0 && (
            <Section title="Competitive Landscape" icon={<Users className="w-5 h-5" />} defaultOpen={false}>
              <div className="grid grid-cols-4 gap-3 mb-4 pt-2">
                <div className="bg-[#EAF3DE] rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold font-mono text-[#2D6A4F]">{competitors.length}</p>
                  <p className="text-[10px] text-[#7A9186] mt-0.5">Competitors</p>
                </div>
                <div className="bg-[#EAF3DE] rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold font-mono text-[#2D6A4F]">{avgRating}</p>
                  <p className="text-[10px] text-[#7A9186] mt-0.5">Avg Rating</p>
                </div>
                <div className="bg-white border border-[#DCE8E0] rounded-xl p-3 text-center">
                  <p className="text-sm font-bold text-[#1A2B22] leading-tight">
                    {[...competitors].sort((a, b) => b.rating - a.rating)[0]?.brand}
                  </p>
                  <p className="text-[10px] text-[#7A9186] mt-0.5">Top Competitor</p>
                </div>
                <div className="bg-white border border-[#DCE8E0] rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold font-mono text-[#FBAE25]">
                    {competitors.reduce((s, c) => s + c.sample_reviews.filter((r) => r.sentiment === "negative").length, 0)}
                  </p>
                  <p className="text-[10px] text-[#7A9186] mt-0.5">Negative Reviews</p>
                </div>
              </div>
              <CompetitorTable competitors={competitors} />
              <div className="mt-5">
                <p className="text-xs font-bold text-[#7A9186] uppercase tracking-wide mb-2">Competitor Claim Coverage</p>
                <div className="flex flex-wrap gap-2">
                  {allCompetitorClaims.map((claim) => {
                    const count = competitors.filter((c) => c.claims.includes(claim)).length;
                    const pct = Math.round((count / competitors.length) * 100);
                    return (
                      <div key={claim} className="flex items-center gap-2 px-3 py-1.5 bg-[#EAF3DE] rounded-full text-xs">
                        <span className="text-[#1A2B22] font-medium">{claim}</span>
                        <span className="font-mono text-[#2D6A4F] font-bold">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Section>
          )}

          {/* Alternative Claims */}
          <Section title="Alternative Claims Generator" icon={<Lightbulb className="w-5 h-5" />} defaultOpen={false}>
            <div className="pt-2">
              <AlternativeClaimsPanel claims={intelligenceResult.alternative_claims} />
            </div>
          </Section>

          {/* Claim Gap */}
          <Section title="Claim Gap Opportunities" icon={<TrendingUp className="w-5 h-5" />} defaultOpen={false}>
            <p className="text-xs text-[#7A9186] mb-3 pt-2">
              Claims used by competitors that are missing from your current pack — potential differentiation opportunities.
            </p>
            <ClaimGapAnalysis opportunities={intelligenceResult.claim_gap_opportunities} />
          </Section>

          {/* Pricing */}
          <Section title="Pricing Intelligence" icon={<TrendingUp className="w-5 h-5" />} defaultOpen={false}>
            <div className="pt-2">
              <PricingIntel product={productMeta} competitors={competitors} />
            </div>
          </Section>
        </>
      )}
    </div>
  );
}
