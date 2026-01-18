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
  Coins,
  Check,
} from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "../../ui/card";
import { Asset, listAssets } from "../../../api/assets";

export type AssetCategoryKey = "stocks" | "crypto" | "etf" | "commodities" | "forex" | "index";

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
  { key: "forex", label: "Forex", icon: Coins },
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
  if (t === "forex" || t === "forex") return "forex";
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

  const filteredAssets: AssetResult[] = useMemo(() => {
    if (isLoading || isError) return [];

    // 1) Filtramos por categoría activa
    const byCategory = assets.filter((a) => {
      const cat = mapAssetTypeToCategory(a.asset_type);
      return cat === currentCategory.key;
    });

    const q = query.toLowerCase().trim();
    if (!q) {
      // sin búsqueda -> solo categoría activa
      return byCategory.map((a) => ({
        asset: a,
        category: currentCategory.key,
      }));
    }

    // 2) Con búsqueda -> buscamos en todas las categorías
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

  const selectedAsset = useMemo(
    () => assets.find((a) => a.symbol === assetName),
    [assets, assetName]
  );

  const selectedCategory =
    (selectedAsset && mapAssetTypeToCategory(selectedAsset.asset_type)) ||
    currentCategory.key;

  return (
    <Card className="relative h-full flex flex-col rounded-2xl border border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Landmark className="w-4 h-4" />
          Asset Selection
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 flex-1 flex flex-col">
        {/* CATEGORY TABS */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Category</p>
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
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium border transition-all ${active
                    ? "bg-primary/20 border-primary/50 text-foreground shadow-sm"
                    : "bg-muted/20 border-border text-muted-foreground hover:bg-accent/50 hover:border-border hover:text-foreground"
                    }`}
                >
                  <Icon
                    className={`w-4 h-4 ${active ? "text-foreground" : "text-muted-foreground"
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
          <p className="text-xs font-medium text-muted-foreground mb-2">Asset</p>
          <div className="relative">
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              className="w-full bg-input border border-border text-foreground h-11 rounded-xl pl-9 pr-10 text-sm placeholder-muted-foreground hover:bg-accent/50 transition-colors focus:outline-none"
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setOpen((o) => !o)}
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""
                  }`}
              />
            </button>
          </div>

          {open && (
            <div className="mt-2 max-h-60 overflow-y-auto rounded-xl border border-border bg-popover shadow-xl custom-scrollbar">
              {isLoading ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  Loading assets…
                </div>
              ) : isError ? (
                <div className="px-3 py-2 text-sm text-destructive">
                  Failed to load assets
                </div>
              ) : filteredAssets.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
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
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors hover:bg-accent/50 ${selected
                        ? "bg-accent text-foreground"
                        : "text-foreground"
                        }`}
                    >
                      <span>
                        {asset.symbol}
                        <span className="ml-2 text-xs text-muted-foreground">
                          {asset.name}
                        </span>
                      </span>
                      <span className="flex items-center gap-2 text-xs text-muted-foreground">
                        {getCategoryLabel(category)}
                        {selected && (
                          <Check className="w-4 h-4 text-primary" />
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
          <div className="mt-4 rounded-xl border border-border bg-muted/20 p-4 space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Asset overview
            </h4>
            <div className="flex justify-between text-sm">
              <span className="text-foreground">
                {selectedAsset.symbol} — {selectedAsset.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {getCategoryLabel(selectedCategory)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
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
