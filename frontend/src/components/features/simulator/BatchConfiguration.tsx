// frontend/src/components/simulator/BatchConfiguration.tsx

import React, { useMemo, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../ui/card";
import {
  Search,
  ChevronDown,
  Layers,
  GitBranch,
  Check,
  TrendingUp,
  Bitcoin,
  BarChart3,
  Landmark,
  DollarSign,
  Coins,
} from "lucide-react";
import AlgorithmSelector, {
  AlgoParams,
  MultiAlgoParams,
} from "./AlgorithmSelector";
import { AssetCategoryKey } from "./AssetSelector";

import { useQuery } from "@tanstack/react-query";
import { Asset, listAssets } from "../../../api/assets";

type BatchType = "assets" | "algorithms";

export type BatchConfigurationProps = {
  batchName: string;
  setBatchName: (name: string) => void;
  batchType: BatchType;
  setBatchType: (type: BatchType) => void;

  assetType: AssetCategoryKey;
  setAssetType: (type: AssetCategoryKey) => void;
  selectedAssets: string[];
  setSelectedAssets: (assets: string[]) => void;

  selectedAlgorithms: string[];
  setSelectedAlgorithms: (algs: string[]) => void;

  baseAsset: string;
  setBaseAsset: (asset: string) => void;
  baseAlgorithm: string;
  setBaseAlgorithm: (algo: string) => void;

  advancedMode: boolean;
  algorithmParams: AlgoParams;
  setAlgorithmParams: React.Dispatch<React.SetStateAction<AlgoParams>>;
  multiAlgoParams: MultiAlgoParams;
  setMultiAlgoParams: React.Dispatch<
    React.SetStateAction<MultiAlgoParams>
  >;
  children?: React.ReactNode;
};

const CATEGORY_LABELS: Record<AssetCategoryKey, string> = {
  stocks: "Stocks",
  crypto: "Crypto",
  etf: "ETF",
  commodities: "Commodities",
  forex: "Forex",
  index: "Index",
};

const CATEGORY_ICONS: Record<AssetCategoryKey, React.ElementType> = {
  stocks: TrendingUp,
  crypto: Bitcoin,
  etf: BarChart3,
  commodities: Landmark,
  forex: Coins,
  index: DollarSign,
};

const CATEGORY_KEYS: AssetCategoryKey[] = [
  "stocks",
  "crypto",
  "etf",
  "commodities",
  "forex",
  "index",
];

type AssetResult = {
  asset: Asset;
  category: AssetCategoryKey;
};

function mapAssetTypeToCategory(
  assetType: string
): AssetCategoryKey | null {
  const t = assetType.toLowerCase();
  if (t === "stock" || t === "stocks") return "stocks";
  if (t === "crypto" || t === "cryptocurrency") return "crypto";
  if (t === "etf" || t === "fund") return "etf";
  if (t === "commodity" || t === "commodities") return "commodities";
  if (t === "forex" || t === "forex") return "forex";
  if (t === "index" || t === "indices") return "index";
  return null;
}

const BatchConfiguration: React.FC<BatchConfigurationProps> = (
  props
) => {
  const {
    batchName,
    setBatchName,
    batchType,
    setBatchType,
    assetType,
    setAssetType,
    selectedAssets,
    setSelectedAssets,
    selectedAlgorithms,
    setSelectedAlgorithms,
    baseAsset,
    setBaseAsset,
    baseAlgorithm,
    setBaseAlgorithm,
    advancedMode,
    algorithmParams,
    setAlgorithmParams,
    multiAlgoParams,
    setMultiAlgoParams,
  } = props;

  // ====== Assets reales desde la API ======
  const {
    data: assets = [],
    isLoading,
    isError,
  } = useQuery<Asset[]>({
    queryKey: ["assets"],
    queryFn: listAssets,
  });

  // búsqueda para selección múltiple de assets
  const [assetQuery, setAssetQuery] = useState("");
  const [assetDropdownOpen, setAssetDropdownOpen] = useState(false);

  // búsqueda para base asset en multi-algorithms
  const [baseAssetQuery, setBaseAssetQuery] = useState("");
  const [baseAssetDropdownOpen, setBaseAssetDropdownOpen] =
    useState(false);

  // ====== Filtrado multi-asset (assets a comparar) ======
  const currentAssets: AssetResult[] = useMemo(() => {
    if (isLoading || isError) return [];

    // 1) por categoría activa
    const byCategory = assets.filter((a) => {
      const cat = mapAssetTypeToCategory(a.asset_type);
      return cat === assetType;
    });

    const q = assetQuery.toLowerCase().trim();

    // sin query -> sólo categoría activa
    if (!q) {
      return byCategory.map((a) => ({
        asset: a,
        category: assetType,
      }));
    }

    // con query -> buscamos en todas las categorías
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
  }, [assets, isLoading, isError, assetType, assetQuery]);

  // ====== Filtrado para base asset en multi-algorithms ======
  const baseAssetResults: AssetResult[] = useMemo(() => {
    if (isLoading || isError) return [];

    const byCategory = assets.filter((a) => {
      const cat = mapAssetTypeToCategory(a.asset_type);
      return cat === assetType;
    });

    const q = baseAssetQuery.toLowerCase().trim();

    if (!q) {
      return byCategory.map((a) => ({
        asset: a,
        category: assetType,
      }));
    }

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
  }, [assets, isLoading, isError, assetType, baseAssetQuery]);

  const toggleSelectedAsset = (symbol: string) => {
    if (selectedAssets.includes(symbol)) {
      setSelectedAssets(selectedAssets.filter((a) => a !== symbol));
    } else {
      setSelectedAssets([...selectedAssets, symbol]);
    }
  };

  const renderCategoryChips = (forBaseAsset = false) => (
    <div className="flex flex-wrap gap-2">
      {CATEGORY_KEYS.map((key) => {
        const active = key === assetType;
        const Icon = CATEGORY_ICONS[key];

        return (
          <button
            key={key}
            type="button"
            onClick={() => {
              setAssetType(key);
              if (forBaseAsset) {
                setBaseAsset("");
                setBaseAssetQuery("");
              } else {
                setAssetQuery("");
              }
            }}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium border transition-all
              ${active
                ? "bg-primary/10 border-primary/50 text-primary shadow-sm"
                : "bg-muted/10 border-transparent text-muted-foreground hover:bg-muted/20 hover:text-foreground"
              }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{CATEGORY_LABELS[key]}</span>
          </button>
        );
      })}
    </div>
  );

  // ----- MULTI-ASSET MODE -----
  const renderMultiAssetSection = () => (
    <div className="space-y-6">
      {/* Asset selection block */}
      <div className="rounded-xl border border-border bg-card/30 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-4">
          <Layers className="w-4 h-4 text-primary" />
          <span>Asset Selection</span>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
              Asset Category
            </p>
            {renderCategoryChips(false)}
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
              Assets to compare
            </p>

            <div className="relative group">
              <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                className="w-full bg-background border border-border text-foreground h-11 rounded-lg pl-9 pr-10 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                placeholder="Search & select multiple assets..."
                value={assetQuery}
                onChange={(e) => {
                  setAssetQuery(e.target.value);
                  setAssetDropdownOpen(true);
                }}
                onFocus={() => setAssetDropdownOpen(true)}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setAssetDropdownOpen((o) => !o)}
              >
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${assetDropdownOpen ? "rotate-180" : ""
                    }`}
                />
              </button>
            </div>

            {assetDropdownOpen && (
              <div className="mt-2 max-h-60 overflow-y-auto rounded-lg border border-border bg-card shadow-xl custom-scrollbar z-50">
                {isLoading ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    Loading assets…
                  </div>
                ) : isError ? (
                  <div className="px-3 py-2 text-sm text-destructive">
                    Failed to load assets
                  </div>
                ) : currentAssets.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No assets found
                  </div>
                ) : (
                  currentAssets.map(({ asset, category }) => {
                    const active = selectedAssets.includes(asset.symbol);
                    return (
                      <button
                        key={asset.id}
                        type="button"
                        onClick={() => {
                          toggleSelectedAsset(asset.symbol);
                          setAssetDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors hover:bg-muted/10 ${active
                          ? "bg-primary/5 text-primary"
                          : "text-foreground"
                          }`}
                      >
                        <span>
                          <span className="font-medium">{asset.symbol}</span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            {asset.name}
                          </span>
                        </span>
                        <span className="flex items-center gap-2 text-xs text-muted-foreground">
                          {CATEGORY_LABELS[category]}
                          {active && (
                            <Check className="w-4 h-4 text-primary" />
                          )}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            )}

            {selectedAssets.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedAssets.map((symbol) => (
                  <button
                    key={symbol}
                    type="button"
                    onClick={() => toggleSelectedAsset(symbol)}
                    className="inline-flex items-center gap-1.5 rounded-md bg-secondary/50 px-2.5 py-1 text-xs font-medium text-foreground border border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors group"
                  >
                    <span>{symbol}</span>
                    <span className="text-muted-foreground group-hover:text-destructive transition-colors">×</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trading algorithm (applied to all assets) */}
      <div className="pt-2">
        <AlgorithmSelector
          advancedMode={advancedMode}
          multiMode={false}
          algorithm={baseAlgorithm}
          setAlgorithm={setBaseAlgorithm}
          algorithmParams={algorithmParams}
          setAlgorithmParams={setAlgorithmParams}
        />
      </div>
    </div>
  );

  // ----- MULTI-ALGO MODE -----
  const renderMultiAlgoSection = () => {
    const baseAssetRow = assets.find((a) => a.symbol === baseAsset);
    const baseCategory =
      baseAssetRow &&
        mapAssetTypeToCategory(baseAssetRow.asset_type || "")
        ? (mapAssetTypeToCategory(
          baseAssetRow.asset_type
        ) as AssetCategoryKey)
        : assetType;

    return (
      <div className="space-y-6">
        {/* Asset selection (base asset) */}
        <div className="rounded-xl border border-border bg-card/30 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-4">
            <Layers className="w-4 h-4 text-primary" />
            <span>Asset Selection</span>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                Base Asset Category
              </p>
              {renderCategoryChips(true)}
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                Base Asset
              </p>

              <div className="relative group">
                <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  className="w-full bg-background border border-border text-foreground h-11 rounded-lg pl-9 pr-10 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                  placeholder="Search base asset..."
                  value={baseAssetQuery}
                  onChange={(e) => {
                    setBaseAssetQuery(e.target.value);
                    setBaseAssetDropdownOpen(true);
                  }}
                  onFocus={() => setBaseAssetDropdownOpen(true)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() =>
                    setBaseAssetDropdownOpen((o) => !o)
                  }
                >
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${baseAssetDropdownOpen ? "rotate-180" : ""
                      }`}
                  />
                </button>
              </div>

              {baseAssetDropdownOpen && (
                <div className="mt-2 max-h-60 overflow-y-auto rounded-lg border border-border bg-card shadow-xl custom-scrollbar z-50">
                  {isLoading ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      Loading assets…
                    </div>
                  ) : isError ? (
                    <div className="px-3 py-2 text-sm text-destructive">
                      Failed to load assets
                    </div>
                  ) : baseAssetResults.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      No assets found
                    </div>
                  ) : (
                    baseAssetResults.map(({ asset, category }) => {
                      const selected = baseAsset === asset.symbol;
                      return (
                        <button
                          key={asset.id}
                          type="button"
                          onClick={() => {
                            setBaseAsset(asset.symbol);
                            setBaseAssetQuery("");
                            setBaseAssetDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors hover:bg-muted/10 ${selected
                            ? "bg-primary/5 text-primary"
                            : "text-foreground"
                            }`}
                        >
                          <span>
                            <span className="font-medium">{asset.symbol}</span>
                            <span className="ml-2 text-xs text-muted-foreground">
                              {asset.name}
                            </span>
                          </span>
                          <span className="flex items-center gap-2 text-xs text-muted-foreground">
                            {CATEGORY_LABELS[category]}
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

              {baseAsset && baseAssetRow && (
                <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
                  <h4 className="text-xs font-semibold text-primary uppercase tracking-wide flex items-center gap-2">
                    <Check className="w-3 h-3" />
                    Selected Asset
                  </h4>
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground font-medium">
                      {baseAssetRow.symbol} — {baseAssetRow.name}
                    </span>
                    <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded border border-border">
                      {CATEGORY_LABELS[baseCategory]}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Trading algorithm (multi-algo) */}
        <AlgorithmSelector
          advancedMode={advancedMode}
          multiMode={true}
          selectedAlgorithms={selectedAlgorithms}
          setSelectedAlgorithms={setSelectedAlgorithms}
          multiAlgoParams={multiAlgoParams}
          setMultiAlgoParams={setMultiAlgoParams}
        />
      </div>
    );
  };

  const { children } = props;

  return (
    <div className="space-y-6">
      <div className="grid gap-8 md:grid-cols-12 items-start">
        {/* Main Configuration Column */}
        <div className="md:col-span-8 space-y-6">

          {/* 1. Comparison Type Selection */}
          <div className="grid md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setBatchType("assets")}
              className={`relative group flex flex-col gap-3 rounded-xl border p-5 text-left transition-all duration-200 ${batchType === "assets"
                ? "bg-primary/5 border-primary ring-1 ring-primary/20 shadow-md"
                : "bg-card border-border hover:bg-accent/50 hover:border-accent-foreground/20"
                }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className={`p-2 rounded-lg ${batchType === "assets" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:text-foreground"
                  }`}>
                  <Layers className="w-5 h-5" />
                </div>
                {batchType === "assets" && <Check className="w-5 h-5 text-primary" />}
              </div>
              <div>
                <div className={`text-base font-semibold mb-1.5 ${batchType === "assets" ? "text-primary" : "text-foreground"
                  }`}>
                  Multi-Asset Analysis
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Run the same strategy across multiple assets simultaneously to compare performance.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setBatchType("algorithms")}
              className={`relative group flex flex-col gap-3 rounded-xl border p-5 text-left transition-all duration-200 ${batchType === "algorithms"
                ? "bg-primary/5 border-primary ring-1 ring-primary/20 shadow-md"
                : "bg-card border-border hover:bg-accent/50 hover:border-accent-foreground/20"
                }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className={`p-2 rounded-lg ${batchType === "algorithms" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:text-foreground"
                  }`}>
                  <GitBranch className="w-5 h-5" />
                </div>
                {batchType === "algorithms" && <Check className="w-5 h-5 text-primary" />}
              </div>
              <div>
                <div className={`text-base font-semibold mb-1.5 ${batchType === "algorithms" ? "text-primary" : "text-foreground"
                  }`}>
                  Multi-Strategy Analysis
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Compare different algorithms or parameter sets against a single benchmark asset.
                </p>
              </div>
            </button>
          </div>

          {/* 2. Mode Specific Configuration */}
          <Card className="glass-card border-border bg-card">
            <CardContent className="p-6">
              {batchType === "assets"
                ? renderMultiAssetSection()
                : renderMultiAlgoSection()}
            </CardContent>
          </Card>

        </div>

        {/* Sidebar Configuration Column */}
        <div className="md:col-span-4 space-y-6">
          <Card className="glass-card border-white/10 bg-card/50 h-fit sticky top-6">
            <CardHeader className="pb-3 border-b border-white/5">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                Batch Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Batch Name
                </label>
                <input
                  type="text"
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                  placeholder="e.g. Q1 Tech Momentum"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground">
                  Give this simulation run a descriptive name to identify it later in history.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-white/5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Summary
                </label>
                <div className="rounded-lg bg-black/20 p-3 space-y-2 border border-white/5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Mode</span>
                    <span className="font-medium text-foreground">
                      {batchType === "assets" ? "Multi-Asset" : "Multi-Strategy"}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Assets</span>
                    <span className="font-medium text-foreground">
                      {batchType === "assets"
                        ? selectedAssets.length
                        : baseAsset ? 1 : 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Strategies</span>
                    <span className="font-medium text-foreground">
                      {batchType === "assets"
                        ? baseAlgorithm ? 1 : 0
                        : selectedAlgorithms.length}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Configuration Passed as Children */}
          {children}
        </div>
      </div>
    </div>
  );
};

export default BatchConfiguration;
