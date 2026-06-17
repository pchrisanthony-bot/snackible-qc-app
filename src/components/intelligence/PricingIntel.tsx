"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { CompetitorData, ProductMeta } from "../../lib/types";

interface Props {
  product: ProductMeta;
  competitors: CompetitorData[];
}

export default function PricingIntel({ product, competitors }: Props) {
  const costPerGram = product.mrp / product.pack_weight_g;

  // Build price-per-gram data (normalize to 100g for comparison)
  const productPricePer100 = costPerGram * 100;
  const competitorData = competitors.map((c) => ({
    name: c.brand,
    price: c.price,
    rating: c.rating,
  }));

  const categoryAvg =
    competitorData.length > 0
      ? competitorData.reduce((sum, c) => sum + c.price, 0) / competitorData.length
      : 0;

  const chartData = [
    { name: "Snackible\nRagi Chips", price: product.mrp, isProduct: true },
    ...competitors.map((c) => ({ name: c.brand, price: c.price, isProduct: false })),
  ];

  return (
    <div className="space-y-4">
      {/* Metric row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#EAF3DE] rounded-xl p-3 text-center">
          <p className="text-xs text-[#7A9186] mb-1">Price / 100g</p>
          <p className="font-bold font-mono text-[#1A2B22]">₹{productPricePer100.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#DCE8E0] p-3 text-center">
          <p className="text-xs text-[#7A9186] mb-1">Category Avg MRP</p>
          <p className="font-bold font-mono text-[#1A2B22]">₹{categoryAvg.toFixed(0)}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#DCE8E0] p-3 text-center">
          <p className="text-xs text-[#7A9186] mb-1">vs Category Avg</p>
          <p className={`font-bold font-mono ${product.mrp < categoryAvg ? "text-green-600" : "text-amber-600"}`}>
            {product.mrp < categoryAvg ? "↓" : "↑"}{" "}
            {Math.abs(((product.mrp - categoryAvg) / categoryAvg) * 100).toFixed(0)}%
          </p>
        </div>
      </div>

      {/* Bar chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: "#7A9186" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#7A9186" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `₹${v}`}
            />
            <Tooltip
              formatter={(v) => [`₹${v}`, "MRP"]}
              contentStyle={{ borderRadius: 8, border: "1px solid #DCE8E0", fontSize: 12 }}
            />
            <ReferenceLine y={categoryAvg} stroke="#FBAE25" strokeDasharray="4 4" label={{ value: "Avg", fontSize: 10, fill: "#FBAE25" }} />
            <Bar dataKey="price" radius={[4, 4, 0, 0]} maxBarSize={40}>
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.isProduct ? "#2D6A4F" : "#C5DFAC"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
