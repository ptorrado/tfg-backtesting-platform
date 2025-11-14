import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Target,
  Activity,
  BarChart3,
  Award,
} from "lucide-react"

import { base44 } from "../api/base44Client"
import { createPageUrl } from "../utils"

import { Button } from "../components/ui/button"
import { Skeleton } from "../components/ui/skeleton"

import MetricsCard from "../components/results/MetricsCard"
import EquityCurveChart from "../components/results/EquityCurveChart"
import TradesTable from "../components/results/TradesTable"
import BenchmarkComparison from "../components/results/BenchmarkComparison"
import BatchComparison from "../components/results/BatchComparison"

interface EquityPoint {
  date: string
  value: number
}

interface BenchmarkPoint {
  date: string
  value: number
}

interface TradeRow {
  date: string
  type: "buy" | "sell" | string
  price: number
  quantity: number
  profit_loss: number
}

interface Simulation {
  id: string
  asset_type: string
  asset_name: string
  algorithm: string
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
  trades: TradeRow[]
  benchmark_final_value: number
  benchmark_profit_loss: number
  benchmark_profit_loss_percentage: number
  benchmark_equity_curve: BenchmarkPoint[]
  efficiency_ratio: number

  // batch fields
  is_batch?: boolean
  batch_id?: string
  batch_name?: string
  created_date?: string
}

export default function Result() {
  const navigate = useNavigate()
  const [simulation, setSimulation] = useState<Simulation | null>(null)
  const [batchSimulations, setBatchSimulations] = useState<Simulation[] | null>(
    null
  )
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSimulation = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const id = urlParams.get("id")
      const batchId = urlParams.get("batch_id")

      try {
        if (batchId) {
          // Batch simulations
          const sims: Simulation[] = await base44.entities.Simulation.filter({
            batch_id: batchId,
          })
          if (sims.length > 0) {
            setBatchSimulations(sims)
          }
        } else if (id) {
          // Single simulation
          const sims: Simulation[] = await base44.entities.Simulation.filter({
            id,
          })
          if (sims.length > 0) {
            setSimulation(sims[0])
          }
        } else {
          navigate(createPageUrl("Simulator"))
          return
        }
      } catch (err) {
        console.error("Error loading simulation", err)
      } finally {
        setLoading(false)
      }
    }

    loadSimulation()
  }, [navigate])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1419] p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64 bg-white/5" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 bg-white/5" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Nothing loaded
  if (!simulation && !batchSimulations) {
    return (
      <div className="min-h-screen bg-[#0f1419] p-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Simulation not found</p>
          <Button onClick={() => navigate(createPageUrl("Simulator"))}>
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  // ---------- BATCH SIMULATION VIEW ----------
  if (batchSimulations) {
    return (
      <div className="min-h-screen bg-[#0f1419] p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate(createPageUrl("Simulator"))}
              className="mb-3 text-gray-400 hover:text-gray-200 hover:bg-white/5"
            >
              <ArrowLeft className="w-4 h-4 mr-2" strokeWidth={2} />
              New Simulation
            </Button>
            <h1 className="text-3xl font-bold text-gray-100 mb-1">
              Multi-Simulation Results
            </h1>
            <p className="text-gray-400 text-sm">
              {batchSimulations[0].batch_name}
            </p>
          </div>

          <BatchComparison
            simulations={batchSimulations}
            batchName={batchSimulations[0].batch_name ?? "Batch"}
          />
        </div>
      </div>
    )
  }

  // ---------- SINGLE SIMULATION VIEW ----------
  const sim = simulation as Simulation
  const isProfit = sim.profit_loss >= 0

  const totalDays =
    Math.ceil(
      (new Date(sim.end_date).getTime() -
        new Date(sim.start_date).getTime()) /
        (1000 * 60 * 60 * 24)
    ) || 1
  const tradesPerWeek =
    (sim.number_of_trades / totalDays) * 7

  return (
    <div className="min-h-screen bg-[#0f1419] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate(createPageUrl("Simulator"))}
              className="mb-3 text-gray-400 hover:text-gray-200 hover:bg-white/5"
            >
              <ArrowLeft className="w-4 h-4 mr-2" strokeWidth={2} />
              New Simulation
            </Button>
            <h1 className="text-3xl font-bold text-gray-100 mb-1">
              Simulation Results
            </h1>
            <p className="text-gray-400 text-sm">
              {sim.asset_name} • {sim.algorithm.replace(/_/g, " ")}
            </p>
          </div>
        </div>

        {/* Top metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <MetricsCard
              title="Total Profit/Loss"
              value={`${isProfit ? "+" : ""}$${Math.abs(
                sim.profit_loss
              ).toFixed(2)}`}
              subtitle={`${isProfit ? "+" : ""}${sim.profit_loss_percentage.toFixed(
                2
              )}%`}
              icon={DollarSign}
              isPositive={isProfit}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <MetricsCard
              title="Final Value"
              value={`$${sim.final_value.toFixed(2)}`}
              subtitle={`From $${sim.initial_investment}`}
              icon={TrendingUp}
              isPositive={isProfit}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <MetricsCard
              title="Win Rate"
              value={sim.accuracy}
              subtitle={`${sim.winning_trades} wins / ${sim.losing_trades} losses`}
              icon={Target}
              isPercentage
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <MetricsCard
              title="Total Trades"
              value={sim.number_of_trades}
              subtitle={`${tradesPerWeek.toFixed(1)} trades/week`}
              icon={Activity}
            />
          </motion.div>
        </div>

        {/* Benchmark comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <BenchmarkComparison
            equityCurve={sim.equity_curve}
            benchmarkEquityCurve={sim.benchmark_equity_curve}
            profitLoss={sim.profit_loss}
            benchmarkProfitLoss={sim.benchmark_profit_loss}
            efficiencyRatio={sim.efficiency_ratio}
          />
        </motion.div>

        {/* Curve + risk metrics */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="lg:col-span-2"
          >
            <EquityCurveChart data={sim.equity_curve} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="space-y-6"
          >
            <MetricsCard
              title="Sharpe Ratio"
              value={sim.sharpe_ratio.toFixed(2)}
              subtitle="Risk-adjusted return"
              icon={Award}
              isPositive={sim.sharpe_ratio > 1}
            />
            <MetricsCard
              title="Max Drawdown"
              value={sim.max_drawdown}
              subtitle="Largest peak-to-trough decline"
              icon={BarChart3}
              isPositive={false}
              isPercentage
            />
          </motion.div>
        </div>

        {/* Trades table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <TradesTable trades={sim.trades} />
        </motion.div>
      </div>
    </div>
  )
}
