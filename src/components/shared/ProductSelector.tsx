"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Package, Loader2, CheckCircle2 } from "lucide-react";
import { SheetProduct, PackPrice } from "../../lib/sheet-parser";
import { cn } from "../../lib/utils";

interface Props {
  onSelect: (product: SheetProduct, packOption: PackPrice) => void;
}

const SHEET_COLORS: Record<string, string> = {
  "Launched products":    "bg-[#EAF3DE] text-[#2D6A4F]",
  "New launches":         "bg-blue-50 text-blue-700",
  "First Club":           "bg-purple-50 text-purple-700",
  "Spreads":              "bg-orange-50 text-orange-700",
  "Diwali products 2025": "bg-amber-50 text-amber-700",
  "Nuts":                 "bg-yellow-50 text-yellow-700",
};

export default function ProductSelector({ onSelect }: Props) {
  const [query, setQuery]       = useState("");
  const [products, setProducts] = useState<SheetProduct[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [open, setOpen]         = useState(false);
  const [selected, setSelected] = useState<SheetProduct | null>(null);
  const [activePack, setActivePack] = useState<PackPrice | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/products")
      .then((r) => r.json())
      .then((data: SheetProduct[]) => {
        if (Array.isArray(data)) setProducts(data);
        else setError("Could not load product sheet");
      })
      .catch(() => setError("Network error loading products"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = query.trim().length < 1
    ? products.slice(0, 12)
    : products.filter((p) =>
        p.product_name.toLowerCase().includes(query.toLowerCase()) ||
        p.sheet.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 20);

  // Auto-load immediately on product click — no separate Load button needed
  function pickProduct(product: SheetProduct) {
    const defaultPack = product.mrp_options[0] ?? {
      pack_weight_g: product.small_pack_g || 40,
      mrp: 0,
      per_gram: 0,
    };
    setSelected(product);
    setActivePack(defaultPack);
    setQuery(product.product_name);
    setOpen(false);
    onSelect(product, defaultPack);
  }

  // Switching pack size immediately re-triggers onSelect
  function switchPack(pack: PackPrice) {
    setActivePack(pack);
    if (selected) onSelect(selected, pack);
  }

  function clear() {
    setQuery("");
    setSelected(null);
    setActivePack(null);
  }

  return (
    <div ref={containerRef} className="space-y-3">
      {/* Search */}
      <div className="relative">
        {loading
          ? <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A9186] animate-spin" />
          : <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A9186]" />
        }
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setSelected(null); }}
          onFocus={() => setOpen(true)}
          placeholder={loading ? "Loading products…" : `Search ${products.length} products…`}
          className="w-full border border-[#DCE8E0] rounded-xl pl-9 pr-9 py-2.5 text-sm text-[#1A2B22] focus:outline-none focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] bg-white"
          disabled={loading}
        />
        {query && (
          <button onClick={clear} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="w-4 h-4 text-[#7A9186] hover:text-red-500" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && !selected && filtered.length > 0 && (
        <div className="absolute z-50 w-full max-w-xl bg-white border border-[#DCE8E0] rounded-xl shadow-xl overflow-hidden max-h-72 overflow-y-auto">
          {filtered.map((p, i) => (
            <button
              key={i}
              onMouseDown={() => pickProduct(p)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#EAF3DE] text-left transition-colors border-b border-[#F0F4F2] last:border-0"
            >
              <Package className="w-4 h-4 text-[#2D6A4F] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1A2B22] truncate">{p.product_name}</p>
                <p className="text-xs text-[#7A9186] truncate">{p.claims.slice(0, 2).join(" · ")}</p>
              </div>
              <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0",
                SHEET_COLORS[p.sheet] || "bg-gray-100 text-gray-600")}>
                {p.sheet}
              </span>
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      {/* Loaded product panel */}
      {selected && activePack && (
        <div className="bg-[#EAF3DE] border border-[#C5DFAC] rounded-xl p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#2D6A4F] flex-shrink-0" />
              <div>
                <p className="font-bold text-[#1A2B22] text-sm" style={{ fontFamily: "Raleway, sans-serif" }}>
                  {selected.product_name}
                </p>
                <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full",
                  SHEET_COLORS[selected.sheet] || "bg-gray-100 text-gray-600")}>
                  {selected.sheet}
                </span>
              </div>
            </div>
            <button onClick={clear} className="text-[#7A9186] hover:text-red-500 p-1 flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Nutrition preview per 100g */}
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: "Energy",  value: `${selected.nutrition.energy_kcal} kcal` },
              { label: "Protein", value: `${selected.nutrition.protein_g}g` },
              { label: "Fat",     value: `${selected.nutrition.total_fat_g}g` },
              { label: "Fibre",   value: `${selected.nutrition.dietary_fibre_g}g` },
            ].map((n) => (
              <div key={n.label} className="bg-white rounded-lg p-2">
                <p className="text-[10px] text-[#7A9186]">{n.label}</p>
                <p className="text-xs font-bold font-mono text-[#1A2B22]">{n.value}</p>
              </div>
            ))}
          </div>

          {/* Pack sizes — click to switch immediately */}
          {selected.mrp_options.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[#4A6358] mb-1.5">
                Pack size — click to switch:
              </p>
              <div className="flex flex-wrap gap-2">
                {selected.mrp_options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => switchPack(opt)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                      activePack.pack_weight_g === opt.pack_weight_g
                        ? "bg-[#2D6A4F] text-white border-[#2D6A4F]"
                        : "bg-white text-[#2D6A4F] border-[#C5DFAC] hover:border-[#2D6A4F]"
                    )}
                  >
                    {opt.pack_weight_g}g{opt.mrp > 0 ? ` — ₹${opt.mrp}` : ""}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selected.claims.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selected.claims.slice(0, 5).map((c, i) => (
                <span key={i} className="px-2 py-0.5 bg-white text-[#2D6A4F] text-[10px] font-medium rounded-full border border-[#C5DFAC]">
                  {c}
                </span>
              ))}
            </div>
          )}

          <p className="text-[10px] text-[#4A6358] font-medium">
            ✓ Loaded into form. Switch pack size above to update grammage.
          </p>
        </div>
      )}
    </div>
  );
}
