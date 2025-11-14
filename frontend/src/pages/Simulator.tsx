import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { PlayCircle, Loader2 } from "lucide-react"

import { base44 } from "../api/base44Client"
import { createPageUrl } from "../utils"
import { Button } from "../components/ui/button"

import AssetSelector, {
  AssetCategoryKey,
} from "../components/simulator/AssetSelector"
import AlgorithmSelector, {
  AlgoParams,
  MultiAlgoParams,
} from "../components/simulator/AlgorithmSelector"
import ConfigPanel from "../components/simulator/ConfigPanel"
import PriceChart from "../components/simulator/PriceChart"
import BatchModeToggle from "../components/simulator/BatchModeToggle"
import BatchConfiguration from "../components/simulator/BatchConfiguration"

export interface EquityPoint {
  date: string
  value: number
}

export interface Trade {
  date: string
  type: "buy" | "sell"
  price: number
  quantity: number
  profit_loss: number
}

export interface SimulationPayload {
  asset_type: string
  asset_name: string
  algorithm: string
  algorithm_params: AlgoParams | MultiAlgoParams
  start_date: string
  end_date: string
  initial_investment: number
  final_value: number
  profit_loss: number
  profit_loss_percentage: number
  number_of_trades: number
  winning_trades: number
  losing_trades: number
  accuracy: number
  max_drawdown: number
  sharpe_ratio: number
  equity_curve: EquityPoint[]
  trades: Trade[]
  benchmark_final_value: number
  benchmark_profit_loss: number
  benchmark_profit_loss_percentage: number
  benchmark_equity_curve: EquityPoint[]
  efficiency_ratio: number
  is_batch?: boolean
  batch_id?: string
  batch_name?: string
}

const Simulator: React.FC = () => {
  const navigate = useNavigate()

  const [assetType, setAssetType] = useState<AssetCategoryKey>("stocks")
  const [assetName, setAssetName] = useState<string>("")
  const [algorithm, setAlgorithm] = useState<string>("")
  const [startDate, setStartDate] = useState<string>("2023-01-01")
  const [endDate, setEndDate] = useState<string>("2024-01-01")
  const [initialInvestment, setInitialInvestment] = useState<number>(10000)
  const [isRunning, setIsRunning] = useState<boolean>(false)

  // Batch mode
  const [batchMode, setBatchMode] = useState<boolean>(false)
  const [batchName, setBatchName] = useState<string>("")
  const [batchType, setBatchType] = useState<"assets" | "algorithms">("assets")
  const [selectedAssets, setSelectedAssets] = useState<string[]>([])
  const [selectedAlgorithms, setSelectedAlgorithms] = useState<string[]>([])
  const [baseAsset, setBaseAsset] = useState<string>("")
  const [baseAlgorithm, setBaseAlgorithm] = useState<string>("")

  // Advanced mode
  const [advancedMode, setAdvancedMode] = useState<boolean>(false)
  const [algorithmParams, setAlgorithmParams] = useState<AlgoParams>({})
  const [multiAlgoParams, setMultiAlgoParams] = useState<MultiAlgoParams>({})

  const generatePriceData = (days: number): number[] => {
    const prices: number[] = []
    let basePrice = 100 + Math.random() * 50
    const volatility = 0.02
    const drift = 0.0003

    for (let i = 0; i <= days; i++) {
      const randomReturn = (Math.random() - 0.5) * volatility + drift
      basePrice *= 1 + randomReturn
      prices.push(basePrice)
    }

    return prices
  }

  const generateBenchmarkData = (
    prices: number[],
    initialInv: number,
    startDateStr: string
  ) => {
    const benchmarkCurve: EquityPoint[] = []
    const lookback = 3
    let cash = initialInv
    let shares = 0
    let position: "long" | null = null

    for (let i = 0; i < prices.length; i++) {
      const date = new Date(startDateStr)
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split("T")[0]

      if (i >= lookback && i < prices.length - lookback) {
        const isLocalMin =
          prices.slice(i - lookback, i).every((p) => p >= prices[i]) &&
          prices.slice(i + 1, i + lookback + 1).every((p) => p >= prices[i])

        const isLocalMax =
          prices.slice(i - lookback, i).every((p) => p <= prices[i]) &&
          prices.slice(i + 1, i + lookback + 1).every((p) => p <= prices[i])

        if (isLocalMin && position === null && cash > 0) {
          shares = cash / prices[i]
          cash = 0
          position = "long"
        }

        if (isLocalMax && position === "long" && shares > 0) {
          cash = shares * prices[i]
          shares = 0
          position = null
        }
      }

      const portfolioValue = cash + shares * prices[i]
      benchmarkCurve.push({
        date: dateStr,
        value: Math.round(portfolioValue),
      })
    }

    if (shares > 0) {
      cash = shares * prices[prices.length - 1]
      shares = 0
    }

    const finalValue = benchmarkCurve[benchmarkCurve.length - 1].value
    const profitLoss = finalValue - initialInv
    const profitLossPercentage = (profitLoss / initialInv) * 100

    return {
      equity_curve: benchmarkCurve,
      final_value: finalValue,
      profit_loss: profitLoss,
      profit_loss_percentage: profitLossPercentage,
    }
  }

  const generateSimulationData = (
    asset: string,
    algo: string,
    params: AlgoParams | MultiAlgoParams = {}
  ): SimulationPayload => {
    const days = Math.ceil(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) /
        (1000 * 60 * 60 * 24)
    )

    const prices = generatePriceData(days)
    const benchmark = generateBenchmarkData(prices, initialInvestment, startDate)

    const equityCurve: EquityPoint[] = []
    const trades: Trade[] = []

    let currentValue = initialInvestment
    const volatility = 0.02
    const drift = 0.0003

    let position = 0
    let entryPrice = 0

    for (let i = 0; i <= days; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split("T")[0]

      const randomReturn = (Math.random() - 0.5) * volatility + drift
      currentValue *= 1 + randomReturn

      equityCurve.push({
        date: dateStr,
        value: Math.round(currentValue),
      })

      if (i % 15 === 0 && i > 0) {
        const price = prices[i]
        const quantity = Math.floor((currentValue * 0.5) / price)

        if (position === 0 && Math.random() > 0.5) {
          position = quantity
          entryPrice = price
          trades.push({
            date: dateStr,
            type: "buy",
            price,
            quantity,
            profit_loss: 0,
          })
        } else if (position > 0) {
          const profitLoss = (price - entryPrice) * position
          trades.push({
            date: dateStr,
            type: "sell",
            price,
            quantity: position,
            profit_loss: profitLoss,
          })
          position = 0
        }
      }
    }

    const finalValue = equityCurve[equityCurve.length - 1].value
    const profitLoss = finalValue - initialInvestment
    const profitLossPercentage = (profitLoss / initialInvestment) * 100

    const winningTrades = trades.filter((t) => t.profit_loss > 0).length
    const losingTrades = trades.filter((t) => t.profit_loss < 0).length
    const accuracy =
      trades.length > 0 ? (winningTrades / trades.length) * 100 : 0

    const returns = equityCurve.map((point, i) => {
      if (i === 0) return 0
      return (
        (point.value - equityCurve[i - 1].value) / equityCurve[i - 1].value
      )
    })

    const avgReturn =
      returns.reduce((a, b) => a + b, 0) / (returns.length || 1)
    const stdDev =
      returns.length === 0
        ? 0
        : Math.sqrt(
            returns.reduce((sq, r) => sq + Math.pow(r - avgReturn, 2), 0) /
              returns.length
          )
    const sharpeRatio = stdDev !== 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0

    let maxDrawdown = 0
    let peak = equityCurve[0].value
    for (const point of equityCurve) {
      if (point.value > peak) peak = point.value
      const drawdown = ((peak - point.value) / peak) * 100
      if (drawdown > maxDrawdown) maxDrawdown = drawdown
    }

    const efficiencyRatio =
      benchmark.profit_loss > 0
        ? Math.min(100, Math.max(0, (profitLoss / benchmark.profit_loss) * 100))
        : profitLoss >= 0
        ? 100
        : 0

    return {
      asset_type: assetType,
      asset_name: asset,
      algorithm: algo,
      algorithm_params: params,
      start_date: startDate,
      end_date: endDate,
      initial_investment: initialInvestment,
      final_value: finalValue,
      profit_loss: profitLoss,
      profit_loss_percentage: profitLossPercentage,
      number_of_trades: trades.length,
      winning_trades: winningTrades,
      losing_trades: losingTrades,
      accuracy,
      max_drawdown: maxDrawdown,
      sharpe_ratio: sharpeRatio,
      equity_curve: equityCurve,
      trades,
      benchmark_final_value: benchmark.final_value,
      benchmark_profit_loss: benchmark.profit_loss,
      benchmark_profit_loss_percentage: benchmark.profit_loss_percentage,
      benchmark_equity_curve: benchmark.equity_curve,
      efficiency_ratio: efficiencyRatio,
    }
  }

  const runSimulation = async () => {
    if (batchMode) {
      if (batchType === "assets" && selectedAssets.length < 2) return
      if (batchType === "algorithms" && selectedAlgorithms.length < 2) return
      if (!batchName) return

      setIsRunning(true)
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const batchId = `batch_${Date.now()}`

      if (batchType === "assets") {
        for (const asset of selectedAssets) {
          const params = advancedMode ? algorithmParams : {}
          const simData = generateSimulationData(asset, baseAlgorithm, params)
          await base44.entities.Simulation.create({
            ...simData,
            is_batch: true,
            batch_id: batchId,
            batch_name: batchName,
          })
        }
      } else {
        for (const algo of selectedAlgorithms) {
          const params = advancedMode ? multiAlgoParams[algo] || {} : {}
          const simData = generateSimulationData(baseAsset, algo, params)
          await base44.entities.Simulation.create({
            ...simData,
            is_batch: true,
            batch_id: batchId,
            batch_name: batchName,
          })
        }
      }

      setIsRunning(false)
      navigate(createPageUrl("Results") + `?batch_id=${batchId}`)
    } else {
      if (!assetName || !algorithm || !startDate || !endDate || !initialInvestment)
        return

      setIsRunning(true)
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const params = advancedMode ? algorithmParams : {}
      const simulationData = generateSimulationData(assetName, algorithm, params)
      const simulation = await base44.entities.Simulation.create(simulationData)

      setIsRunning(false)
      navigate(createPageUrl("Results") + `?id=${simulation.id}`)
    }
  }

  const canRunSimulation = batchMode
    ? batchName &&
      ((batchType === "assets" &&
        selectedAssets.length >= 2 &&
        !!baseAlgorithm) ||
        (batchType === "algorithms" &&
          selectedAlgorithms.length >= 2 &&
          !!baseAsset))
    : assetName && algorithm && startDate && endDate && initialInvestment >= 100

  return (
    <div className="min-h-screen bg-[#0f1419] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-100 mb-2">New Simulation</h1>
          <p className="text-gray-400 text-sm">
            Configure parameters and backtest your trading strategy
          </p>
        </div>

        <div className="mb-6">
          <BatchModeToggle
            batchMode={batchMode}
            setBatchMode={setBatchMode}
            advancedMode={advancedMode}
            setAdvancedMode={setAdvancedMode}
          />
        </div>

        {batchMode ? (
          <>
            <div className="mb-6">
              <BatchConfiguration
                batchName={batchName}
                setBatchName={setBatchName}
                batchType={batchType}
                setBatchType={setBatchType}
                assetType={assetType}
                selectedAssets={selectedAssets}
                setSelectedAssets={setSelectedAssets}
                selectedAlgorithms={selectedAlgorithms}
                setSelectedAlgorithms={setSelectedAlgorithms}
                baseAsset={baseAsset}
                setBaseAsset={setBaseAsset}
                baseAlgorithm={baseAlgorithm}
                setBaseAlgorithm={setBaseAlgorithm}
                advancedMode={advancedMode}
                algorithmParams={algorithmParams}
                setAlgorithmParams={setAlgorithmParams}
                multiAlgoParams={multiAlgoParams}
                setMultiAlgoParams={setMultiAlgoParams}
              />
            </div>

            <div className="mb-6">
              <ConfigPanel
                startDate={startDate}
                setStartDate={setStartDate}
                endDate={endDate}
                setEndDate={setEndDate}
                initialInvestment={initialInvestment}
                setInitialInvestment={setInitialInvestment}
              />
            </div>
          </>
        ) : (
          <>
            <div className="grid lg:grid-cols-2 gap-6 mb-6">
              <div>
                <AssetSelector
                  assetType={assetType}
                  setAssetType={setAssetType}
                  assetName={assetName}
                  setAssetName={setAssetName}
                />
              </div>

              <div>
                <ConfigPanel
                  startDate={startDate}
                  setStartDate={setStartDate}
                  endDate={endDate}
                  setEndDate={setEndDate}
                  initialInvestment={initialInvestment}
                  setInitialInvestment={setInitialInvestment}
                />
              </div>
            </div>

            {assetName && (
              <div className="mb-6">
                <PriceChart assetName={assetName} assetType={assetType} />
              </div>
            )}

            <div className="mb-6">
              <AlgorithmSelector
                multiMode={false}
                algorithm={algorithm}
                setAlgorithm={setAlgorithm}
                advancedMode={advancedMode}
                algorithmParams={algorithmParams}
                setAlgorithmParams={setAlgorithmParams}
              />
            </div>
          </>
        )}

        <div className="flex justify-center">
          <Button
            onClick={runSimulation}
            disabled={!canRunSimulation || isRunning}
            size="lg"
            className="bg-white/15 hover:bg-white/20 text-white px-12 py-6 text-base font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed border border-white/30"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" strokeWidth={2} />
                Running {batchMode ? "Multi-" : ""}Simulation
              </>
            ) : (
              <>
                <PlayCircle className="w-5 h-5 mr-2" strokeWidth={2} />
                Run {batchMode ? "Multi-" : ""}Simulation
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Simulator
