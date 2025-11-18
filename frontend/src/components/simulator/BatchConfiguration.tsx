import React, { useMemo, useState } from "react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../ui/card"
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
} from "lucide-react"
import AlgorithmSelector, {
  AlgoParams,
  MultiAlgoParams,
} from "./AlgorithmSelector"
import { AssetCategoryKey } from "./AssetSelector"

type BatchType = "assets" | "algorithms"

export type BatchConfigurationProps = {
  batchName: string
  setBatchName: (name: string) => void
  batchType: BatchType
  setBatchType: (type: BatchType) => void

  assetType: AssetCategoryKey
  setAssetType: (type: AssetCategoryKey) => void
  selectedAssets: string[]
  setSelectedAssets: (assets: string[]) => void

  selectedAlgorithms: string[]
  setSelectedAlgorithms: (algs: string[]) => void

  baseAsset: string
  setBaseAsset: (asset: string) => void
  baseAlgorithm: string
  setBaseAlgorithm: (algo: string) => void

  advancedMode: boolean
  algorithmParams: AlgoParams
  setAlgorithmParams: React.Dispatch<React.SetStateAction<AlgoParams>>
  multiAlgoParams: MultiAlgoParams
  setMultiAlgoParams: React.Dispatch<
    React.SetStateAction<MultiAlgoParams>
  >
}

// mismo catálogo que en AssetSelector
const CATEGORY_ASSETS: Record<AssetCategoryKey, string[]> = {
  stocks: ["AAPL", "GOOGL", "MSFT", "AMZN", "TSLA", "META", "NVDA", "JPM"],
  crypto: ["BTC/USD", "ETH/USD", "SOL/USD", "XRP/USD", "ADA/USD"],
  etf: ["SPY", "QQQ", "ARKK", "IWM", "EFA", "HYG"],
  commodities: ["Gold", "Silver", "Crude Oil", "Natural Gas", "Copper", "Corn", "Wheat"],
  index: ["S&P 500", "NASDAQ", "Dow Jones", "Russell 2000", "FTSE 100", "DAX"],
}

const CATEGORY_LABELS: Record<AssetCategoryKey, string> = {
  stocks: "Stocks",
  crypto: "Crypto",
  etf: "ETF",
  commodities: "Commodities",
  index: "Index",
}

const CATEGORY_ICONS: Record<AssetCategoryKey, React.ElementType> = {
  stocks: TrendingUp,
  crypto: Bitcoin,
  etf: BarChart3,
  commodities: Landmark,
  index: DollarSign,
}

type AssetResult = {
  asset: string
  category: AssetCategoryKey
}

const findCategoryForAsset = (asset: string): AssetCategoryKey | undefined => {
  const keys = Object.keys(CATEGORY_ASSETS) as AssetCategoryKey[]
  for (const k of keys) {
    if (CATEGORY_ASSETS[k].includes(asset)) return k
  }
  return undefined
}

const BatchConfiguration: React.FC<BatchConfigurationProps> = (props) => {
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
  } = props

  // búsqueda para selección múltiple de assets
  const [assetQuery, setAssetQuery] = useState("")
  const [assetDropdownOpen, setAssetDropdownOpen] = useState(false)

  // búsqueda para base asset en multi-algorithms
  const [baseAssetQuery, setBaseAssetQuery] = useState("")
  const [baseAssetDropdownOpen, setBaseAssetDropdownOpen] =
    useState(false)

  const currentAssets: AssetResult[] = useMemo(() => {
    const q = assetQuery.toLowerCase().trim()
    if (!q) {
      return CATEGORY_ASSETS[assetType].map((a) => ({
        asset: a,
        category: assetType,
      }))
    }
    const results: AssetResult[] = []
    ;(Object.keys(CATEGORY_ASSETS) as AssetCategoryKey[]).forEach(
      (cat) => {
        CATEGORY_ASSETS[cat].forEach((a) => {
          if (a.toLowerCase().includes(q)) {
            results.push({ asset: a, category: cat })
          }
        })
      }
    )
    return results
  }, [assetType, assetQuery])

  const baseAssetResults: AssetResult[] = useMemo(() => {
    const q = baseAssetQuery.toLowerCase().trim()
    if (!q) {
      return CATEGORY_ASSETS[assetType].map((a) => ({
        asset: a,
        category: assetType,
      }))
    }
    const results: AssetResult[] = []
    ;(Object.keys(CATEGORY_ASSETS) as AssetCategoryKey[]).forEach(
      (cat) => {
        CATEGORY_ASSETS[cat].forEach((a) => {
          if (a.toLowerCase().includes(q)) {
            results.push({ asset: a, category: cat })
          }
        })
      }
    )
    return results
  }, [assetType, baseAssetQuery])

  const toggleSelectedAsset = (asset: string) => {
    if (selectedAssets.includes(asset)) {
      setSelectedAssets(selectedAssets.filter((a) => a !== asset))
    } else {
      setSelectedAssets([...selectedAssets, asset])
    }
  }

  const renderCategoryChips = (forBaseAsset = false) => (
  <div className="flex flex-wrap gap-3">
    {(Object.keys(CATEGORY_ASSETS) as AssetCategoryKey[]).map(
      (key) => {
        const active = key === assetType
        const Icon = CATEGORY_ICONS[key]

        return (
          <button
            key={key}
            type="button"
            onClick={() => {
              setAssetType(key)
              if (forBaseAsset) {
                // En modo multi-algo: solo reseteamos el asset base
                setBaseAsset("")
                setBaseAssetQuery("")
              } else {
                // En modo multi-asset: cambiamos categoría y limpiamos la búsqueda,
                // PERO MANTENEMOS LA LISTA DE ASSETS SELECCIONADOS
                setAssetQuery("")
                // ❌ antes: setSelectedAssets([])
              }
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
              {key === "commodities" ? "Cmdty" : CATEGORY_LABELS[key]}
            </span>
            <span className="hidden sm:inline">
              {CATEGORY_LABELS[key]}
            </span>
          </button>
        )
      }
    )}
  </div>
)


  // ----- MULTI-ASSET MODE -----
  const renderMultiAssetSection = () => (
    <div className="space-y-6">
      {/* Asset selection block */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 md:px-5 md:py-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-100 mb-4">
          <Layers className="w-4 h-4" />
          <span>Asset Selection</span>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-gray-400 mb-2">
              Asset category
            </p>
            {renderCategoryChips(false)}
          </div>

          <div>
            <p className="text-xs font-medium text-gray-400 mb-2">
              Assets to compare
            </p>

            <div className="relative">
              <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                className="w-full bg-white/5 border border-white/10 text-gray-100 h-11 rounded-xl pl-9 pr-10 text-sm placeholder-gray-500 hover:bg-white/10 transition-colors focus:outline-none"
                placeholder="Search & select multiple assets..."
                value={assetQuery}
                onChange={(e) => {
                  setAssetQuery(e.target.value)
                  setAssetDropdownOpen(true)
                }}
                onFocus={() => setAssetDropdownOpen(true)}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                onClick={() =>
                  setAssetDropdownOpen((o) => !o)
                }
              >
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    assetDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>

            {assetDropdownOpen && (
              <div className="mt-2 max-h-60 overflow-y-auto rounded-xl border border-white/10 bg-white/5 shadow-xl custom-scrollbar">
                {currentAssets.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-400">
                    No assets found
                  </div>
                ) : (
                  currentAssets.map(({ asset, category }) => {
                    const active = selectedAssets.includes(asset)
                    return (
                      <button
                        key={`${category}-${asset}`}
                        type="button"
                        onClick={() => {
                          toggleSelectedAsset(asset)
                          setAssetDropdownOpen(false)
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors hover:bg-white/10 ${
                          active
                            ? "bg-white/10 text-gray-50"
                            : "text-gray-100"
                        }`}
                      >
                        <span>{asset}</span>
                        <span className="flex items-center gap-2 text-xs text-gray-400">
                          {CATEGORY_LABELS[category]}
                          {active && (
                            <Check className="w-4 h-4 text-gray-100" />
                          )}
                        </span>
                      </button>
                    )
                  })
                )}
              </div>
            )}

            {selectedAssets.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedAssets.map((asset) => (
                  <button
                    key={asset}
                    type="button"
                    onClick={() => toggleSelectedAsset(asset)}
                    className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs text-gray-100 border border-white/30 hover:bg-white/20"
                  >
                    <span>{asset}</span>
                    <span className="text-gray-300 text-sm">×</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trading algorithm (applied to all assets) */}
      <div className="pt-2">
        <p className="text-xs font-medium text-gray-400 mb-2">
          Algorithm (applied to all assets)
        </p>
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
  )

  // ----- MULTI-ALGO MODE -----
  const renderMultiAlgoSection = () => {
    const baseCategory =
      findCategoryForAsset(baseAsset) ?? assetType

    return (
      <div className="space-y-6">
        {/* Asset selection (base asset) */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 md:px-5 md:py-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-100 mb-4">
            <Layers className="w-4 h-4" />
            <span>Asset Selection</span>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-gray-400 mb-2">
                Base asset category
              </p>
              {renderCategoryChips(true)}
            </div>

            <div>
              <p className="text-xs font-medium text-gray-400 mb-2">
                Base asset (applied to all algorithms)
              </p>

              <div className="relative">
                <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  className="w-full bg-white/5 border border-white/10 text-gray-100 h-11 rounded-xl pl-9 pr-10 text-sm placeholder-gray-500 hover:bg-white/10 transition-colors focus:outline-none"
                  placeholder="Search base asset..."
                  value={baseAssetQuery}
                  onChange={(e) => {
                    setBaseAssetQuery(e.target.value)
                    setBaseAssetDropdownOpen(true)
                  }}
                  onFocus={() => setBaseAssetDropdownOpen(true)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                  onClick={() =>
                    setBaseAssetDropdownOpen((o) => !o)
                  }
                >
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      baseAssetDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>

              {baseAssetDropdownOpen && (
                <div className="mt-2 max-h-60 overflow-y-auto rounded-xl border border-white/10 bg-white/5 shadow-xl custom-scrollbar">
                  {baseAssetResults.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-400">
                      No assets found
                    </div>
                  ) : (
                    baseAssetResults.map(
                      ({ asset, category }) => {
                        const selected = baseAsset === asset
                        return (
                          <button
                            key={`${category}-${asset}`}
                            type="button"
                            onClick={() => {
                              setBaseAsset(asset)
                              setBaseAssetQuery("")
                              setBaseAssetDropdownOpen(false)
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors hover:bg-white/10 ${
                              selected
                                ? "bg-white/10 text-gray-50"
                                : "text-gray-100"
                            }`}
                          >
                            <span>{asset}</span>
                            <span className="flex items-center gap-2 text-xs text-gray-400">
                              {CATEGORY_LABELS[category]}
                              {selected && (
                                <Check className="w-4 h-4 text-gray-100" />
                              )}
                            </span>
                          </button>
                        )
                      }
                    )
                  )}
                </div>
              )}

              {baseAsset && (
                <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
                  <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
                    Asset overview
                  </h4>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-100">
                      {baseAsset}
                    </span>
                    <span className="text-xs text-gray-400">
                      {CATEGORY_LABELS[baseCategory]}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    This asset will be used as the common benchmark for all
                    selected algorithms.
                  </p>
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
    )
  }

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-gray-100 flex items-center gap-2">
          <Layers className="w-4 h-4" />
          Batch configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* BATCH NAME */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">
            Batch name
          </label>
          <input
            type="text"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-100 placeholder-gray-500 hover:bg-white/10 transition-colors focus:outline-none"
            placeholder="e.g., Tech Stocks Comparison"
            value={batchName}
            onChange={(e) => setBatchName(e.target.value)}
          />
        </div>

        {/* COMPARISON TYPE */}
        <div>
          <p className="text-xs font-medium text-gray-400 mb-2">
            Comparison type
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setBatchType("assets")}
              className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                batchType === "assets"
                  ? "bg-white/10 border-white/60 text-gray-50 shadow-sm"
                  : "bg-white/[0.03] border-white/10 text-gray-200 hover:bg-white/10 hover:border-white/40"
              }`}
            >
              <div className="mt-1">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold">
                  Multiple Assets
                </div>
                <div className="text-[11px] text-gray-400">
                  Same algorithm, different assets
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setBatchType("algorithms")}
              className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                batchType === "algorithms"
                  ? "bg-white/10 border-white/60 text-gray-50 shadow-sm"
                  : "bg-white/[0.03] border-white/10 text-gray-200 hover:bg-white/10 hover:border-white/40"
              }`}
            >
              <div className="mt-1">
                <GitBranch className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold">
                  Multiple Algorithms
                </div>
                <div className="text-[11px] text-gray-400">
                  Same asset, different algorithms
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* MODE-SPECIFIC CONTENT */}
        {batchType === "assets"
          ? renderMultiAssetSection()
          : renderMultiAlgoSection()}
      </CardContent>
    </Card>
  )
}

export default BatchConfiguration
