"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Upload, LayoutDashboard, Shield, ScanSearch, Brain, Leaf } from "lucide-react";
import { cn } from "../../lib/utils";
import { useAnalysis } from "../../context/AnalysisContext";

const NAV = [
  { href: "/upload", icon: Upload, label: "Run New Analysis", section: null },
  { href: "/dashboard", icon: LayoutDashboard, label: "Unified Dashboard", section: null },
  { href: "/compliance", icon: Shield, label: "FSSAI Compliance", section: "COMPLIANCE" },
  { href: "/qc", icon: ScanSearch, label: "Packaging QC", section: null },
  { href: "/intelligence", icon: Brain, label: "Market Intelligence", section: "STRATEGY" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { state, dispatch } = useAnalysis();

  return (
    <aside className="w-60 bg-white border-r border-[#DCE8E0] flex flex-col fixed left-0 top-0 h-full z-40">
      {/* Logo */}
      <div className="bg-[#2D6A4F] px-5 py-4 flex items-center gap-3">
        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
          <Leaf className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="text-white font-bold text-[15px] leading-tight" style={{ fontFamily: "Raleway, sans-serif" }}>
            Snackible
          </div>
          <div className="text-[#C5DFAC] text-[11px]">Nutrition Platform</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
        {NAV.map((item, idx) => {
          const showSection =
            item.section && (idx === 0 || NAV[idx - 1]?.section !== item.section);
          const active = pathname === item.href;

          return (
            <div key={item.href}>
              {showSection && (
                <p className="text-[10px] font-bold text-[#7A9186] px-3 pt-4 pb-1.5 tracking-widest uppercase">
                  {item.section}
                </p>
              )}
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  active
                    ? "bg-[#EAF3DE] text-[#2D6A4F] border-l-2 border-[#2D6A4F] pl-[10px]"
                    : "text-[#4A6358] hover:bg-[#EAF3DE] hover:text-[#2D6A4F]"
                )}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[#DCE8E0] space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#7A9186] font-medium">Demo Mode</span>
          <button
            onClick={() => dispatch({ type: "TOGGLE_DEMO" })}
            className={cn(
              "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none",
              state.isDemo ? "bg-[#2D6A4F]" : "bg-gray-300"
            )}
            aria-label="Toggle demo mode"
          >
            <span
              className={cn(
                "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform",
                state.isDemo ? "translate-x-4" : "translate-x-0.5"
              )}
            />
          </button>
        </div>
        <p className="text-[10px] text-[#7A9186]">v1.0 — Internal Use Only</p>
      </div>
    </aside>
  );
}
