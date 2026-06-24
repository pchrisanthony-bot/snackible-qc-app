"use client";

interface StatusBadgeProps {
  status: string;
  size?: "xs" | "sm" | "md";
  customLabel?: string;
}

const STATUS_MAP: Record<string, { bg: string; color: string; label: string }> = {
  PASS:         { bg: "rgba(6,170,144,0.15)",   color: "#06AA90", label: "PASS" },
  VALID:        { bg: "rgba(6,170,144,0.15)",   color: "#06AA90", label: "VALID" },
  FOUND:        { bg: "rgba(6,170,144,0.15)",   color: "#06AA90", label: "FOUND" },
  ON_TARGET:    { bg: "rgba(6,170,144,0.15)",   color: "#06AA90", label: "ON TARGET" },
  ABOVE:        { bg: "rgba(183,200,21,0.15)",  color: "#B7C815", label: "ABOVE" },
  High:         { bg: "rgba(6,170,144,0.15)",   color: "#06AA90", label: "High" },
  FAIL:         { bg: "rgba(232,64,64,0.15)",   color: "#E84040", label: "FAIL" },
  INVALID:      { bg: "rgba(232,64,64,0.15)",   color: "#E84040", label: "INVALID" },
  MISSING:      { bg: "rgba(232,64,64,0.15)",   color: "#E84040", label: "MISSING" },
  CRITICAL:     { bg: "rgba(232,64,64,0.15)",   color: "#E84040", label: "CRITICAL" },
  WARNING:      { bg: "rgba(255,192,0,0.15)",   color: "#FFC000", label: "WARNING" },
  REVIEW:       { bg: "rgba(255,192,0,0.15)",   color: "#FFC000", label: "REVIEW" },
  Low:          { bg: "rgba(232,64,64,0.15)",   color: "#E84040", label: "Low" },
  Medium:       { bg: "rgba(255,192,0,0.15)",   color: "#FFC000", label: "Medium" },
  positive:     { bg: "rgba(6,170,144,0.15)",   color: "#06AA90", label: "positive" },
  negative:     { bg: "rgba(232,64,64,0.15)",   color: "#E84040", label: "negative" },
  neutral:      { bg: "rgba(155,191,190,0.15)", color: "#9BBFBE", label: "neutral" },
  BELOW:        { bg: "rgba(155,191,190,0.15)", color: "#9BBFBE", label: "BELOW" },
};

export default function StatusBadge({ status, size = "sm", customLabel }: StatusBadgeProps) {
  const s = STATUS_MAP[status] ?? { bg: "rgba(155,191,190,0.15)", color: "#9BBFBE", label: status };
  const fontSize = size === "xs" ? 10 : size === "sm" ? 11 : 13;
  const padding = size === "xs" ? "1px 6px" : size === "sm" ? "2px 8px" : "4px 12px";

  return (
    <span
      style={{
        display: "inline-block",
        padding,
        borderRadius: 4,
        fontSize,
        fontWeight: 700,
        background: s.bg,
        color: s.color,
      }}
    >
      {customLabel ?? s.label}
    </span>
  );
}
