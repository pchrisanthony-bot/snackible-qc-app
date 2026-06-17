"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { QCResult } from "../../lib/types";

interface Props {
  qcResult: QCResult;
}

export default function AllergenAlert({ qcResult }: Props) {
  const { allergen_alerts } = qcResult;

  if (allergen_alerts.length === 0) {
    return (
      <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
        <CheckCircle2 className="w-5 h-5 text-green-600" />
        <p className="text-sm text-green-800 font-medium">All allergens properly declared</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {allergen_alerts.map((alert, i) => (
        <div
          key={i}
          className={
            alert.severity === "CRITICAL"
              ? "flex items-start gap-3 p-4 bg-red-50 border border-red-300 rounded-xl"
              : "flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl"
          }
        >
          <AlertTriangle
            className={
              alert.severity === "CRITICAL"
                ? "w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
                : "w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
            }
          />
          <div>
            <p className={`font-semibold text-sm ${alert.severity === "CRITICAL" ? "text-red-800" : "text-amber-800"}`}>
              {alert.allergen} — {alert.declared_in_artwork ? "Declared ✓" : "NOT DECLARED on artwork"}
            </p>
            <p className="text-xs text-[#4A6358] mt-0.5">
              Found in ingredients list.{" "}
              {!alert.declared_in_artwork && "Must be declared in the allergen box per FSSAI requirements."}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
