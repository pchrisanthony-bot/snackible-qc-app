import { cn } from "../../lib/utils";

interface Props {
  status: string;
  size?: "xs" | "sm" | "md";
  customLabel?: string;
}

const CONFIG: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  COMPLIANT:       { bg: "bg-green-50",  text: "text-green-700",  dot: "bg-green-500",  label: "Compliant" },
  NON_COMPLIANT:   { bg: "bg-red-50",    text: "text-red-700",    dot: "bg-red-500",    label: "Non-Compliant" },
  REVIEW_REQUIRED: { bg: "bg-amber-50",  text: "text-amber-700",  dot: "bg-amber-500",  label: "Review Required" },
  PASS:            { bg: "bg-green-50",  text: "text-green-700",  dot: "bg-green-500",  label: "Pass" },
  FAIL:            { bg: "bg-red-50",    text: "text-red-700",    dot: "bg-red-500",    label: "Fail" },
  VALID:           { bg: "bg-green-50",  text: "text-green-700",  dot: "bg-green-500",  label: "Valid" },
  INVALID:         { bg: "bg-red-50",    text: "text-red-700",    dot: "bg-red-500",    label: "Invalid" },
  NOT_CLAIMED:     { bg: "bg-gray-100",  text: "text-gray-500",   dot: "bg-gray-400",   label: "Not Claimed" },
  CRITICAL:        { bg: "bg-red-50",    text: "text-red-700",    dot: "bg-red-500",    label: "Critical" },
  WARNING:         { bg: "bg-amber-50",  text: "text-amber-700",  dot: "bg-amber-500",  label: "Warning" },
  INFO:            { bg: "bg-blue-50",   text: "text-blue-700",   dot: "bg-blue-400",   label: "Info" },
  FOUND:           { bg: "bg-green-50",  text: "text-green-700",  dot: "bg-green-500",  label: "Found" },
  MISSING:         { bg: "bg-red-50",    text: "text-red-700",    dot: "bg-red-500",    label: "Missing" },
  High:            { bg: "bg-green-50",  text: "text-green-700",  dot: "bg-green-500",  label: "High" },
  Medium:          { bg: "bg-amber-50",  text: "text-amber-700",  dot: "bg-amber-500",  label: "Medium" },
  Low:             { bg: "bg-red-50",    text: "text-red-700",    dot: "bg-red-500",    label: "Low" },
  ABOVE:           { bg: "bg-amber-50",  text: "text-amber-700",  dot: "bg-amber-400",  label: "Above" },
  BELOW:           { bg: "bg-red-50",    text: "text-red-700",    dot: "bg-red-400",    label: "Below" },
  ON_TARGET:       { bg: "bg-green-50",  text: "text-green-700",  dot: "bg-green-500",  label: "On Target" },
  positive:        { bg: "bg-green-50",  text: "text-green-700",  dot: "bg-green-500",  label: "Positive" },
  negative:        { bg: "bg-red-50",    text: "text-red-700",    dot: "bg-red-500",    label: "Negative" },
  neutral:         { bg: "bg-gray-100",  text: "text-gray-600",   dot: "bg-gray-400",   label: "Neutral" },
};

export default function StatusBadge({ status, size = "sm", customLabel }: Props) {
  const cfg = CONFIG[status] || { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400", label: status };
  const sizeClass = size === "xs" ? "px-1.5 py-0.5 text-[10px]" : size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";

  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full font-semibold", cfg.bg, cfg.text, sizeClass)}>
      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", cfg.dot)} />
      {customLabel ?? cfg.label}
    </span>
  );
}
