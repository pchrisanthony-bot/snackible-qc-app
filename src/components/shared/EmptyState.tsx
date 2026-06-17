"use client";

import Link from "next/link";
import { Upload, Search } from "lucide-react";

interface Props {
  message?: string;
}

export default function EmptyState({ message = "No product loaded yet." }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
      <div className="w-14 h-14 rounded-full bg-[#EAF3DE] flex items-center justify-center">
        <Search className="w-6 h-6 text-[#2D6A4F]" />
      </div>
      <div>
        <p className="font-semibold text-[#1A2B22] text-sm">{message}</p>
        <p className="text-xs text-[#7A9186] mt-1">
          Search for a product and upload a label to get started.
        </p>
      </div>
      <Link
        href="/upload"
        className="flex items-center gap-2 px-4 py-2 bg-[#2D6A4F] text-white text-sm font-semibold rounded-xl hover:bg-[#245c43] transition-colors"
      >
        <Upload className="w-4 h-4" />
        Run New Analysis
      </Link>
    </div>
  );
}
