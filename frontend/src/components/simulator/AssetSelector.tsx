// src/components/simulator/AssetSelector.tsx
import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  TrendingUp,
  Bitcoin,
  BarChart3,
  Landmark,
  DollarSign,
  ChevronDown,
  Check,
} from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Asset, listAssets } from "../../api/assets";

export type AssetCategoryKey =
  | "stocks"
  | "crypto"
  | "etf"
  | "commodities"
  | "index";

type AssetCategory = {
  key: AssetCategoryKey;
  label: string;
  icon: React.ElementType;
};

const ASSET_CATEGORIES: AssetCategory[] = [
  { key: "stocks", label: "Stocks", icon: TrendingUp },
  { key: "crypto", label: "Crypto", icon: Bitcoin },
  { key: "etf", label: "ETF", icon: BarChart3 },
  { key: "commodities", label: "Commodities", icon: Landmark },
  { key: "index", label: "Index", icon: DollarSign },
];

type AssetSelectorProps = {
  assetType: AssetCategoryKey;
  setAssetType: (type: AssetCategoryKey) => void;
  assetName: string;
  setAssetName: (asset: string) => void;
};

type AssetResult = {
  asset: Asset;
  category: AssetCategoryKey;
};

const getCategoryLabel = (key: AssetCategoryKey) =>
  ASSET_CATEGORIES.find((c) => c.key === key)?.label ?? key;

// Mapeo sencillo de asset_type (DB) -> categoría del selector
function mapAssetTypeToCategory(assetType: string): AssetCategoryKey | null {
  const t = assetType.toLowerCase();
  if (t === "stock" || t === "stocks") return "stocks";
  if (t === "crypto" || t === "cryptocurrency") return "crypto";
  if (t === "etf" || t === "fund") return "etf";
  if (t === "commodity" || t === "commodities") return "commodities";
  if (t === "index" || t === "indices") return "index";
  return null;
}

const AssetSelector: React.FC<AssetSelectorProps> = ({
  assetType,
  setAssetType,
  assetName,
  setAssetName,
}) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  // Cargamos assets desde la API
  const {
    data: assets = [],
    isLoading,
    isError,
  } = useQuery<Asset[]>({
    queryKey: ["assets"],
    queryFn: listAssets,
  });

  const currentCategory =
    ASSET_CATEGORIES.find((c) => c.key === assetType) ?? ASSET_CATEGORIES[0];

  // Filtrado por categoría + búsqueda
  const filteredAssets: AssetResult[] = useMemo(() => {
    if (isLoading || isError) return [];

    // 1) Filtramos por categoría activa
    const byCategory = assets.filter((a) => {
      const cat = mapAssetTypeToCategory(a.asset_type);
      return cat === currentCategory.key;
    });

    // 2) Si no hay query, devolvemos todos los de la categoría
    const q = query.toLowerCase().trim();
    if (!q) {
      return byCategory.map((a) => ({
        asset: a,
        category: currentCategory.key,
      }));
    }

    // 3) Si hay query, buscamos en symbol + name en TODAS las categorías
    const results: AssetResult[] = [];
    for (const a of assets) {
      const cat = mapAssetTypeToCategory(a.asset_type);
      if (!cat) continue;

      const text = `${a.symbol} ${a.name}`.toLowerCase();
      if (text.includes(q)) {
        results.push({ asset: a, category: cat });
      }
    }
    return results;
  }, [assets, currentCategory.key, query, isLoading, isError]);

  const handleSelect = (asset: Asset, category: AssetCategoryKey) => {
    setAssetType(category);
    setAssetName(asset.symbol);
    setQuery("");
    setOpen(false);
  };

  // Encontrar categoría del asset seleccionado (para el overview)
  const selectedAsset = useMemo(
    () => assets.find((a) => a.symbol === assetName),
    [assets, assetName]
  );
  const selectedCategory =
    (selectedAsset && mapAssetTypeToCategory(selectedAsset.asset_type)) ||
    currentCategory.key;

  return (
    <Card className="relative h-full flex flex-col rounded-2xl border border-white/10 bg-white/[0.03]">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-gray-100 flex items-center gap-2">
          <Landmark className="w-4 h-4" />
          Asset Selection
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 flex-1 flex flex-col">
        {/* CATEGORY TABS */}
        <div>
          <p className="text-xs font-medium text-gray-400 mb-2">Category</p>
          <div className="flex flex-wrap gap-3">
            {ASSET_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const active = cat.key === assetType;

              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => {
                    setAssetType(cat.key);
                    setAssetName("");
                    setQuery("");
                  }}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium border transition-all
                    ${
                      active
                        ? "bg-white/15 border-white/60 text-gray-100 shadow-sm"
                        : "bg-white/[0.03] border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/40 hover:text-gray-100"
                    }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      active ? "text-gray-100" : "text-gray-400"
                    }`}
                  />
                  <span className="sm:hidden">
                    {cat.key === "commodities" ? "Cmdty" : cat.label}
                  </span>
                  <span className="hidden sm:inline">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ASSET DROPDOWN */}
        <div>
          <p className="text-xs font-medium text-gray-400 mb-2">Asset</p>
          <div className="relative">
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              className="w-full bg-white/5 border border-white/10 text-gray-100 h-11 rounded-xl pl-9 pr-10 text-sm placeholder-gray-500 hover:bg-white/10 transition-colors focus:outline-none"
              placeholder="Search by symbol (e.g. AAPL, BTC/USD, SPY)..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
              onClick={() => setOpen((o) => !o)}
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  open ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>

          {/* Lista de resultados */}
          {open && (
            <div className="mt-2 max-h-60 overflow-y-auto rounded-xl border border-white/10 bg-white/5 shadow-xl custom-scrollbar">
              {isLoading ? (
                <div className="px-3 py-2 text-sm text-gray-400">
                  Loading assets…
                </div>
              ) : isError ? (
                <div className="px-3 py-2 text-sm text-red-400">
                  Failed to load assets
                </div>
              ) : filteredAssets.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-400">
                  No assets found
                </div>
              ) : (
                filteredAssets.map(({ asset, category }) => {
                  const selected = assetName === asset.symbol;
                  return (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => handleSelect(asset, category)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors
                        hover:bg-white/10 ${
                          selected
                            ? "bg-white/10 text-gray-50"
                            : "text-gray-100"
                        }`}
                    >
                      <span>
                        {asset.symbol}
                        <span className="ml-2 text-xs text-gray-400">
                          {asset.name}
                        </span>
                      </span>
                      <span className="flex items-center gap-2 text-xs text-gray-400">
                        {getCategoryLabel(category)}
                        {selected && (
                          <Check className="w-4 h-4 text-gray-100" />
                        )}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* OVERVIEW */}
        {assetName && selectedAsset && (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
            <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
              Asset overview
            </h4>
            <div className="flex justify-between text-sm">
              <span className="text-gray-100">
                {selectedAsset.symbol} — {selectedAsset.name}
              </span>
              <span className="text-xs text-gray-400">
                {getCategoryLabel(selectedCategory)}
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Synthetic historical data will be used to simulate this asset&apos;s
              performance over the selected period.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AssetSelector;
