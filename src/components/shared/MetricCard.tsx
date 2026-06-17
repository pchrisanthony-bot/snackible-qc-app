import { ReactNode } from "react";
import { cn } from "../../lib/utils";

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  accent?: "green" | "amber" | "red" | "default";
  className?: string;
}

const ACCENT_CLASSES = {
  green:   "border-green-200 bg-green-50",
  amber:   "border-amber-200 bg-[#FEF3D8]",
  red:     "border-red-200 bg-red-50",
  default: "border-[#DCE8E0] bg-white",
};

export default function MetricCard({ title, value, subtitle, icon, accent = "default", className }: Props) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4 shadow-sm",
        ACCENT_CLASSES[accent],
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-[#7A9186] font-medium mb-1 truncate">{title}</p>
          <p
            className="text-2xl font-bold text-[#1A2B22] leading-tight"
            style={{ fontFamily: "JetBrains Mono, monospace" }}
          >
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-[#4A6358] mt-0.5">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="text-[#2D6A4F] flex-shrink-0 mt-0.5">{icon}</div>
        )}
      </div>
    </div>
  );
}
