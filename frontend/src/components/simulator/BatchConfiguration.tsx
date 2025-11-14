import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Input } from "../ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"
import { RadioGroup, RadioGroupItem } from "../ui/radio-group"
import { Label } from "../ui/label"
import { X, Layers } from "lucide-react"
import { Badge } from "../ui/badge"
import AlgorithmSelector, {
  AlgoParams,
  MultiAlgoParams,
} from "./AlgorithmSelector"
import type { AssetCategoryKey } from "./AssetSelector"

interface BatchConfigurationProps {
  batchName: string
  setBatchName: (name: string) => void
  batchType: "assets" | "algorithms"
  setBatchType: (type: "assets" | "algorithms") => void
  assetType: AssetCategoryKey
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
  setMultiAlgoParams: React.Dispatch<React.SetStateAction<MultiAlgoParams>>
}

const assetsByType: Record<AssetCategoryKey, string[]> = {
  stocks: ["AAPL", "GOOGL", "MSFT", "AMZN", "TSLA", "META", "NVDA", "JPM"],
  crypto: ["BTC/USD", "ETH/USD", "BNB/USD", "SOL/USD", "ADA/USD", "XRP/USD"],
  etf: ["SPY", "QQQ", "IWM", "VTI", "VOO", "DIA", "EFA", "AGG"],
  commodities: ["Gold", "Silver", "Crude Oil", "Natural Gas", "Copper", "Platinum"],
  index: ["S&P 500", "NASDAQ", "Dow Jones", "Russell 2000", "FTSE 100", "DAX"],
}

const BatchConfiguration: React.FC<BatchConfigurationProps> = ({
  batchName,
  setBatchName,
  batchType,
  setBatchType,
  assetType,
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
}) => {
  const addAsset = (asset: string) => {
    if (!selectedAssets.includes(asset)) {
      setSelectedAssets([...selectedAssets, asset])
    }
  }

  const removeAsset = (asset: string) => {
    setSelectedAssets(selectedAssets.filter((a) => a !== asset))
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card border-white/5">
        <CardHeader className="border-b border-white/5 pb-4">
          <CardTitle className="text-gray-100 flex items-center gap-2 text-base font-semibold">
            <Layers className="w-4 h-4 text-blue-500" strokeWidth={2} />
            Multi-Simulation Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          <div>
            <Label className="text-gray-300 font-medium text-xs uppercase tracking-wider mb-3 block">
              Batch Name
            </Label>
            <Input
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
              placeholder="e.g., Tech Stocks Comparison"
              className="bg-white/5 border-white/10 text-gray-100 h-11 rounded-xl hover:bg-white/10 transition-colors"
            />
          </div>

          <div>
            <Label className="text-gray-300 font-medium text-xs uppercase tracking-wider mb-3 block">
              Comparison Type
            </Label>
            <RadioGroup value={batchType} onValueChange={setBatchType}>
              <div className="grid grid-cols-2 gap-3">
                <Label
                  htmlFor="compare-assets"
                  className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all ${
                    batchType === "assets"
                      ? "bg-white/10 border-blue-500"
                      : "bg-white/5 border-white/5 hover:bg-white/10"
                  }`}
                >
                  <RadioGroupItem value="assets" id="compare-assets" className="mr-3" />
                  <div>
                    <p className="font-medium text-gray-100 text-sm">Multiple Assets</p>
                    <p className="text-xs text-gray-500">
                      Same algorithm, different assets
                    </p>
                  </div>
                </Label>

                <Label
                  htmlFor="compare-algorithms"
                  className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all ${
                    batchType === "algorithms"
                      ? "bg-white/10 border-blue-500"
                      : "bg-white/5 border-white/5 hover:bg-white/10"
                  }`}
                >
                  <RadioGroupItem
                    value="algorithms"
                    id="compare-algorithms"
                    className="mr-3"
                  />
                  <div>
                    <p className="font-medium text-gray-100 text-sm">Multiple Algorithms</p>
                    <p className="text-xs text-gray-500">
                      Same asset, different algorithms
                    </p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {batchType === "assets" ? (
            <div>
              <Label className="text-gray-300 font-medium text-xs uppercase tracking-wider mb-3 block">
                Select Assets to Compare
              </Label>
              <div className="flex gap-2 mb-3">
                <Select onValueChange={addAsset}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-gray-100 h-11 rounded-xl flex-1">
                    <SelectValue placeholder="Add asset" />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-white/10">
                    {assetsByType[assetType].map((asset) => (
                      <SelectItem key={asset} value={asset} className="text-gray-200">
                        {asset}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedAssets.map((asset) => (
                  <Badge
                    key={asset}
                    className="bg-blue-500/10 text-blue-400 border-blue-500/30 px-3 py-1.5"
                    variant="outline"
                  >
                    {asset}
                    <button
                      onClick={() => removeAsset(asset)}
                      className="ml-2 hover:text-blue-300"
                    >
                      <X className="w-3 h-3" strokeWidth={2} />
                    </button>
                  </Badge>
                ))}
                {selectedAssets.length === 0 && (
                  <p className="text-xs text-gray-500">No assets selected</p>
                )}
              </div>
            </div>
          ) : (
            <div>
              <Label className="text-gray-300 font-medium text-xs uppercase tracking-wider mb-3 block">
                Asset (Applied to all)
              </Label>
              <Select value={baseAsset} onValueChange={setBaseAsset}>
                <SelectTrigger className="bg-white/5 border-white/10 text-gray-100 h-11 rounded-xl">
                  <SelectValue placeholder="Select asset" />
                </SelectTrigger>
                <SelectContent className="glass-card border-white/10">
                  {assetsByType[assetType].map((asset) => (
                    <SelectItem key={asset} value={asset} className="text-gray-200">
                      {asset}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {batchType === "assets" ? (
        <AlgorithmSelector
          multiMode={false}
          algorithm={baseAlgorithm}
          setAlgorithm={setBaseAlgorithm}
          advancedMode={advancedMode}
          algorithmParams={algorithmParams}
          setAlgorithmParams={setAlgorithmParams}
        />
      ) : (
        <AlgorithmSelector
          multiMode
          advancedMode={advancedMode}
          selectedAlgorithms={selectedAlgorithms}
          setSelectedAlgorithms={setSelectedAlgorithms}
          multiAlgoParams={multiAlgoParams}
          setMultiAlgoParams={setMultiAlgoParams}
        />
      )}
    </div>
  )
}

export default BatchConfiguration
