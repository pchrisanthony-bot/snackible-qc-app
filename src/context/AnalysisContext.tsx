"use client";

import React, { createContext, useContext, useReducer, ReactNode } from "react";
import {
  AnalysisState,
  ProductMeta,
  NutritionPer100g,
  QCResult,
  IntelligenceResult,
} from "../lib/types";
import { runFSSAIEngine } from "../lib/fssai-engine";
import { runBenchmarkEngine } from "../lib/benchmark-engine";

const EMPTY_NUTRITION: NutritionPer100g = {
  energy_kcal: 0, protein_g: 0, total_fat_g: 0, saturated_fat_g: 0,
  trans_fat_g: 0, carbohydrates_g: 0, total_sugar_g: 0, added_sugar_g: 0,
  dietary_fibre_g: 0, sodium_mg: 0, calcium_mg: 0,
};

const EMPTY_PRODUCT_META: ProductMeta = {
  sku: "", product_name: "", pack_weight_g: 0, serving_size_g: 0,
  mrp: 0, barcode: "", oil_type: "", product_category: "",
  ingredients_list: [], claims_on_pack: [],
};

const initialState: AnalysisState = {
  productMeta: EMPTY_PRODUCT_META,
  nutrition: EMPTY_NUTRITION,
  fssaiResult: null,
  qcResult: null,
  intelligenceResult: null,
  benchmarkResults: [],
  competitors: [],
  isDemo: false,
  hasAnalysis: false,
  artworkFile: null,
  comparisonPackG: 100,
  masterAtPack: EMPTY_NUTRITION,
  ocrAtPack: null,
  ocrServingG: null,
};

type Action =
  | { type: "SET_ANALYSIS"; payload: Partial<AnalysisState> }
  | { type: "TOGGLE_DEMO" }
  | { type: "SET_INTELLIGENCE"; payload: IntelligenceResult }
  | { type: "SET_QC"; payload: QCResult }
  | { type: "SET_ARTWORK"; payload: string };

function reducer(state: AnalysisState, action: Action): AnalysisState {
  switch (action.type) {
    case "SET_ANALYSIS":
      return { ...state, ...action.payload, hasAnalysis: true };
    case "TOGGLE_DEMO":
      return { ...state, isDemo: !state.isDemo };
    case "SET_INTELLIGENCE":
      return { ...state, intelligenceResult: action.payload };
    case "SET_QC":
      return { ...state, qcResult: action.payload };
    case "SET_ARTWORK":
      return { ...state, artworkFile: action.payload };
    default:
      return state;
  }
}

interface AnalysisContextType {
  state: AnalysisState;
  dispatch: React.Dispatch<Action>;
  runAnalysis: (meta: ProductMeta, nutrition: NutritionPer100g) => void;
}

const AnalysisContext = createContext<AnalysisContextType | null>(null);

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  function runAnalysis(meta: ProductMeta, nutrition: NutritionPer100g) {
    const fssaiResult = runFSSAIEngine(nutrition, meta);
    const benchmarkResults = runBenchmarkEngine(nutrition, meta);
    dispatch({
      type: "SET_ANALYSIS",
      payload: { productMeta: meta, nutrition, fssaiResult, benchmarkResults },
    });
  }

  return (
    <AnalysisContext.Provider value={{ state, dispatch, runAnalysis }}>
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error("useAnalysis must be used within AnalysisProvider");
  return ctx;
}
