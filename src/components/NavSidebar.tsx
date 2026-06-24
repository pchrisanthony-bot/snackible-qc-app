"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/products", label: "Product Library", icon: "📦" },
  { href: "/label-qc", label: "Label QC", icon: "🔍" },
  { href: "/fssai-claims", label: "FSSAI Claims", icon: "✓" },
  { href: "/market-intelligence", label: "Market Intelligence", icon: "📊" },
];

export default function NavSidebar() {
  const pathname = usePathname();

  return (
    <div
      style={{
        width: 240,
        minWidth: 240,
        height: "100vh",
        background: "var(--bg-surface)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      {/* Logo / Brand */}
      <div
        style={{
          padding: "24px 20px 20px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary)", letterSpacing: "-0.3px" }}>
          snackible
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
          Nutrition & QC Platform
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: "12px 0" }}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 20px",
                textDecoration: "none",
                color: isActive ? "var(--accent-teal)" : "var(--text-muted)",
                background: isActive ? "rgba(6,170,144,0.08)" : "transparent",
                borderLeft: isActive ? "3px solid var(--accent-teal)" : "3px solid transparent",
                fontWeight: isActive ? 600 : 400,
                fontSize: 13,
                transition: "background 0.15s, color 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLAnchorElement).style.background = "var(--bg-elevated)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                }
              }}
            >
              <span style={{ fontSize: 15, width: 20, textAlign: "center", flexShrink: 0 }}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: "16px 20px",
          borderTop: "1px solid var(--border)",
          color: "var(--text-muted)",
          fontSize: 12,
        }}
      >
        v1.0 — Internal Use Only
      </div>
    </div>
  );
}
