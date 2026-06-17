"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { ProductMeta, OCRExtract } from "../../lib/types";

interface Props {
  master: ProductMeta;
  ocr: OCRExtract | null;
}

export default function BarcodeValidator({ master, ocr }: Props) {
  const artworkBarcode = ocr?.barcode_number ?? "Not extracted";
  const match = ocr?.barcode_number === master.barcode;

  return (
    <div className={`p-4 rounded-xl border ${match ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
      <div className="flex items-center gap-2 mb-3">
        {match ? (
          <CheckCircle2 className="w-5 h-5 text-green-600" />
        ) : (
          <XCircle className="w-5 h-5 text-red-600" />
        )}
        <span className={`font-semibold text-sm ${match ? "text-green-800" : "text-red-800"}`}>
          Barcode {match ? "Match ✓" : "Mismatch"}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-[#7A9186] mb-1">Master (Sheet)</p>
          <p className="font-mono text-sm font-bold text-green-700">{master.barcode}</p>
        </div>
        <div>
          <p className="text-xs text-[#7A9186] mb-1">Artwork (OCR)</p>
          <p className={`font-mono text-sm font-bold ${match ? "text-green-700" : "text-red-600"}`}>
            {artworkBarcode}
          </p>
        </div>
      </div>
    </div>
  );
}
