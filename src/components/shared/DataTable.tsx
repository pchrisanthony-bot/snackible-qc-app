import { ReactNode } from "react";
import { cn } from "../../lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
  headerClass?: string;
}

interface Props<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T, i: number) => string;
  onRowClick?: (row: T) => void;
  highlightRow?: (row: T) => "red" | "amber" | "green" | null;
  emptyMessage?: string;
}

const HIGHLIGHT: Record<string, string> = {
  red: "bg-red-50 border-l-2 border-red-400",
  amber: "bg-amber-50 border-l-2 border-amber-400",
  green: "bg-green-50 border-l-2 border-green-400",
};

export default function DataTable<T>({ columns, data, rowKey, onRowClick, highlightRow, emptyMessage }: Props<T>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#DCE8E0]">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#EAF3DE] border-b border-[#DCE8E0]">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-4 py-2.5 text-left text-xs font-bold text-[#2D6A4F] uppercase tracking-wide whitespace-nowrap",
                  col.headerClass
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-6 text-center text-[#7A9186] text-sm">
                {emptyMessage || "No data"}
              </td>
            </tr>
          ) : (
            data.map((row, i) => {
              const hl = highlightRow?.(row);
              return (
                <tr
                  key={rowKey(row, i)}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    "border-b border-[#DCE8E0] last:border-0 transition-colors",
                    onRowClick && "cursor-pointer hover:bg-[#EAF3DE]",
                    hl ? HIGHLIGHT[hl] : "bg-white"
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn("px-4 py-3 text-[#1A2B22]", col.className)}
                    >
                      {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? "")}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
