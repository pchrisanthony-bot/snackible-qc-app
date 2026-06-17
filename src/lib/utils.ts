export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatNumber(value: number, decimals = 1): string {
  return value.toFixed(decimals);
}

export function formatCurrency(value: number): string {
  return `₹${value.toFixed(2)}`;
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function getStatusColors(status: string): { bg: string; text: string; border: string } {
  const map: Record<string, { bg: string; text: string; border: string }> = {
    PASS: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
    FAIL: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
    VALID: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
    INVALID: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
    NOT_CLAIMED: { bg: "bg-gray-50", text: "text-gray-500", border: "border-gray-200" },
    COMPLIANT: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
    NON_COMPLIANT: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
    REVIEW_REQUIRED: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
    CRITICAL: { bg: "bg-red-50", text: "text-red-700", border: "border-red-300" },
    WARNING: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
    INFO: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
    FOUND: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
    MISSING: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
    High: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
    Medium: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
    Low: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
    ABOVE: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
    BELOW: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
    ON_TARGET: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  };
  return map[status] || { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200" };
}
