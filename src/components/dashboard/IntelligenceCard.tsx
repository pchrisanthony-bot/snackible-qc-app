"use client";

import { IntelligenceResult, BenchmarkResult, CompetitorData } from "../../lib/types";
import StatusBadge from "../shared/StatusBadge";
import { Brain, TrendingUp } from "lucide-react";
import Link from "next/link";

interface Props {
  intel: IntelligenceResult | null;
  benchmarks: BenchmarkResult[];
  competitors: CompetitorData[];
}

export default function IntelligenceCard({ intel, benchmarks, competitors }: Props) {
  const topBenchmarkIssues = benchmarks.filter((b) => b.status !== "ON_TARGET").slice(0, 3);
  const avgRating =
    competitors.length > 0
      ? (competitors.reduce((s, c) => s + c.rating, 0) / competitors.length).toFixed(1)
      : "—";
  const topCompetitor = competitors.sort((a, b) => b.rating - a.rating)[0];

  return (
    <div className="space-y-4">
      {/* Medha Score */}
      <div className="bg-white rounded-xl border border-[#DCE8E0] p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-4 h-4 text-[#2D6A4F]" />
          <span className="font-semibold text-sm text-[#1A2B22]">Medha Score Overview</span>
        </div>
        {intel ? (
          <>
            <div className="flex items-end gap-3 mb-3">
              <span
                className="text-5xl font-bold text-[#2D6A4F]"
                style={{ fontFamily: "JetBrains Mono, monospace" }}
              >
                {intel.si_score.toFixed(2)}
              </span>
              <span className="text-lg text-[#7A9186] mb-1">/5</span>
              <div className="flex flex-col gap-1 mb-1">
                <StatusBadge status={intel.alignment} customLabel={`Alignment: ${intel.alignment}`} size="xs" />
                <StatusBadge status={intel.confidence} customLabel={`Confidence: ${intel.confidence}`} size="xs" />
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
              <div
                className="bg-[#2D6A4F] h-2 rounded-full"
                style={{ width: `${((intel.si_score - 1) / 4) * 100}%` }}
              />
            </div>
            <p className="text-xs text-[#7A9186]">Cluster: <span className="text-[#2D6A4F] font-semibold">{intel.cluster}</span></p>
          </>
        ) : (
          <p className="text-xs text-[#7A9186]">Run claim analysis to see score</p>
        )}
        <Link href="/intelligence" className="block mt-3 text-xs text-[#2D6A4F] font-semibold hover:underline">
          View full intelligence report →
        </Link>
      </div>

      {/* Benchmark Snapshot */}
      {topBenchmarkIssues.length > 0 && (
        <div className="bg-white rounded-xl border border-[#DCE8E0] p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-[#2D6A4F]" />
            <span className="font-semibold text-sm text-[#1A2B22]">Brand Benchmark Snapshot</span>
          </div>
          <div className="space-y-2">
            {topBenchmarkIssues.map((b, i) => (
              <div key={i} className="flex items-center justify-between text-xs gap-2">
                <span className="text-[#4A6358]">{b.metric}</span>
                <div className="flex items-center gap-1">
                  <span className="font-mono text-[#1A2B22]">{b.your_value}</span>
                  <span className="text-[#7A9186]">vs</span>
                  <span className="font-mono text-[#7A9186]">{b.benchmark_value}</span>
                  <StatusBadge status={b.status} size="xs" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Competitive Quick Stats */}
      <div className="bg-white rounded-xl border border-[#DCE8E0] p-4 shadow-sm">
        <p className="font-semibold text-sm text-[#1A2B22] mb-3">Competitive Quick Stats</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#EAF3DE] rounded-lg p-2.5 text-center">
            <p className="text-xl font-bold font-mono text-[#2D6A4F]">{competitors.length}</p>
            <p className="text-[10px] text-[#7A9186]">Competitors Tracked</p>
          </div>
          <div className="bg-[#EAF3DE] rounded-lg p-2.5 text-center">
            <p className="text-xl font-bold font-mono text-[#2D6A4F]">{avgRating}</p>
            <p className="text-[10px] text-[#7A9186]">Category Avg Rating</p>
          </div>
          <div className="bg-white border border-[#DCE8E0] rounded-lg p-2.5 text-center col-span-2">
            <p className="text-xs text-[#7A9186] mb-0.5">Top Competitor</p>
            <p className="text-sm font-bold text-[#1A2B22]">
              {topCompetitor?.brand} — {topCompetitor?.rating}★
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
