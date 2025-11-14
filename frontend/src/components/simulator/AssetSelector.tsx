import React, { useMemo, useState } from "react"
import { TrendingUp, Bitcoin, Landmark, BarChart3, DollarSign, Search } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Input } from "../ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"

export type AssetCategoryKey = "stocks" | "crypto" | "etf" | "commodities" | "index"

interface AssetCategoryConfig {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  label: string
  assets: string[]
}

const assetCategories: Record<AssetCategoryKey, AssetCategoryConfig> = {
  stocks: {
    icon: TrendingUp,
    label: "Stocks",
    assets: ["AAPL", "GOOGL", "MSFT", "AMZN", "TSLA", "META", "NVDA", "JPM"],
  },
  crypto: {
    icon: Bitcoin,
    label: "Crypto",
    assets: ["BTC/USD", "ETH/USD", "BNB/USD", "SOL/USD", "ADA/USD", "XRP/USD"],
  },
  etf: {
    icon: BarChart3,
    label: "ETF",
    assets: ["SPY", "QQQ", "IWM", "VTI", "VOO", "DIA", "EFA", "AGG"],
  },
  commodities: {
    icon: Landmark,
    label: "Commodities",
    assets: ["Gold", "Silver", "Crude Oil", "Natural Gas", "Copper", "Platinum"],
  },
  index: {
    icon: DollarSign,
    label: "Index",
    assets: ["S&P 500", "NASDAQ", "Dow Jones", "Russell 2000", "FTSE 100", "DAX"],
  },
}

export interface AssetSelectorProps {
  assetType: AssetCategoryKey
  setAssetType: (type: AssetCategoryKey) => void
  assetName: string
  setAssetName: (name: string) => void
}

export default function AssetSelector({
  assetType,
  setAssetType,
  assetName,
  setAssetName,
}: AssetSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)

  const currentCategory = assetCategories[assetType]
  const Icon = currentCategory.icon

  const filteredAssets = useMemo<string[]>(() => {
    const assets = currentCategory.assets
    if (!searchQuery) return assets
    return assets.filter((asset: string) =>
      asset.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [currentCategory, searchQuery])

  const handleCategoryChange = (newType: AssetCategoryKey) => {
    setAssetType(newType)
    setAssetName("")
    setSearchQuery("")
    setShowSuggestions(false)
  }

  const handleAssetSelect = (asset: string) => {
    setAssetName(asset)
    setSearchQuery("")
    setShowSuggestions(false)
  }

  return (
    <Card className="glass-card border-white/5">
      <CardHeader className="border-b border-white/5 pb-4">
        <CardTitle className="text-gray-100 flex items-center gap-2 text-base font-semibold">
          <Icon className="w-4 h-4 text-gray-400" strokeWidth={2} />
          Asset Selection
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-5">
        {/* CATEGORY */}
        <div>
          <label className="text-xs font-medium text-gray-400 mb-3 block uppercase tracking-wider">
            Category
          </label>
          <div className="grid grid-cols-5 gap-2">
            {(
              Object.keys(assetCategories) as AssetCategoryKey[]
            ).map((key) => {
              const CategoryIcon = assetCategories[key].icon
              const label = assetCategories[key].label
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleCategoryChange(key)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200 border ${
                    assetType === key
                      ? "bg-white/15 text-white border-white/30"
                      : "bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:border-white/10"
                  }`}
                >
                  <CategoryIcon className="w-4 h-4" strokeWidth={2} />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* SEARCH + SELECT */}
        <div>
          <label className="text-xs font-medium text-gray-400 mb-3 block uppercase tracking-wider">
            Asset
          </label>
          <div className="relative">
            <div className="relative mb-3">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 z-10"
                strokeWidth={2}
              />
              <Input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setShowSuggestions(e.target.value.length > 0)
                }}
                onFocus={() => searchQuery && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Search assets..."
                className="bg-white/5 border-white/10 text-gray-100 h-10 rounded-xl pl-10 hover:bg-white/10 transition-colors"
              />
            </div>

            {showSuggestions && filteredAssets.length > 0 && (
              <div className="absolute w-full glass-card border border-white/10 rounded-xl overflow-hidden z-20 shadow-lg">
                {filteredAssets.map((asset: string) => (
                  <button
                    key={asset}
                    type="button"
                    onClick={() => handleAssetSelect(asset)}
                    className="w-full text-left px-4 py-2.5 text-gray-200 hover:bg-white/10 transition-colors text-sm"
                  >
                    {asset}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Select value={assetName} onValueChange={setAssetName}>
            <SelectTrigger className="bg-white/5 border-white/10 text-gray-100 h-11 rounded-xl hover:bg-white/10 transition-colors">
              <SelectValue placeholder="Select asset" />
            </SelectTrigger>
            <SelectContent className="glass-card border-white/10">
              {currentCategory.assets.map((asset: string) => (
                <SelectItem
                  key={asset}
                  value={asset}
                  className="text-gray-200 hover:bg-white/10 focus:bg-white/10"
                >
                  {asset}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* SUMMARY */}
        {assetName && (
          <div className="bg-white/5 p-4 rounded-xl border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center border border-white/30">
                <Icon className="w-5 h-5 text-gray-200" strokeWidth={2} />
              </div>
              <div>
                <p className="text-gray-100 font-semibold">{assetName}</p>
                <p className="text-gray-400 text-xs">{currentCategory.label}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
