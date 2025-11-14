import React from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import {
  History as HistoryIcon,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  LineChart,
  Bitcoin,
  PieChart,
  Gem,
  BarChart,
  Layers,
} from "lucide-react"

import { base44 } from "../api/base44Client"
import { createPageUrl } from "../utils"

import { Card, CardContent } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Skeleton } from "../components/ui/skeleton"

interface EquityPoint {
  date: string
  value: number
}

interface Simulation {
  id: string
  asset_type: string
  asset_name: string
  algorithm: string
  created_date: string
  initial_investment: number
  profit_loss: number
  profit_loss_percentage: number
  accuracy: number
  equity_curve: EquityPoint[]

  // batch fields
  is_batch?: boolean
  batch_id?: string
  batch_name?: string
}

type GroupedItem =
  | {
      type: "batch"
      batch_id: string
      batch_name?: string
      simulations: Simulation[]
      created_date: string
    }
  | {
      type: "single"
      simulation: Simulation
    }

export default function History() {
  const navigate = useNavigate()

  const { data: simulations = [], isLoading } = useQuery<Simulation[]>({
    queryKey: ["simulations"],
    queryFn: () => base44.entities.Simulation.list("-created_date"),
  })

  const groupedSimulations: GroupedItem[] = React.useMemo(() => {
    const groups: GroupedItem[] = []
    const seenBatches = new Set<string>()

    simulations.forEach((sim) => {
      if (sim.is_batch && sim.batch_id) {
        if (!seenBatches.has(sim.batch_id)) {
          seenBatches.add(sim.batch_id)
          const batchSims = simulations.filter(
            (s) => s.batch_id === sim.batch_id
          )
          groups.push({
            type: "batch",
            batch_id: sim.batch_id,
            batch_name: sim.batch_name,
            simulations: batchSims,
            created_date: sim.created_date,
          })
        }
      } else if (!sim.is_batch) {
        groups.push({
          type: "single",
          simulation: sim,
        })
      }
    })

    return groups
  }, [simulations])

  const getAssetIcon = (type: string) => {
    const iconProps = {
      className: "w-6 h-6 text-gray-400",
      strokeWidth: 1.5,
    }

    switch (type) {
      case "stocks":
        return <LineChart {...iconProps} />
      case "crypto":
        return <Bitcoin {...iconProps} />
      case "etf":
        return <PieChart {...iconProps} />
      case "commodities":
        return <Gem {...iconProps} />
      case "index":
        return <BarChart {...iconProps} />
      default:
        return <LineChart {...iconProps} />
    }
  }

  return (
    <div className="min-h-screen bg-[#0f1419] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-100 mb-2">
            Simulation History
          </h1>
          <p className="text-gray-400 text-sm">
            Review past backtesting results and performance metrics
          </p>
        </div>

        {/* Loading */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-56 bg-white/5 rounded-xl" />
            ))}
          </div>
        ) : groupedSimulations.length === 0 ? (
          // Empty state
          <Card className="glass-card border-white/5">
            <CardContent className="p-12 text-center">
              <HistoryIcon
                className="w-12 h-12 text-gray-600 mx-auto mb-4"
                strokeWidth={1.5}
              />
              <h3 className="text-lg font-semibold text-gray-300 mb-2">
                No simulations yet
              </h3>
              <p className="text-gray-500 text-sm">
                Run your first simulation to see results here
              </p>
            </CardContent>
          </Card>
        ) : (
          // Content
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groupedSimulations.map((group) => {
              if (group.type === "batch") {
                const avgProfitLoss =
                  group.simulations.reduce(
                    (sum, s) => sum + s.profit_loss,
                    0
                  ) / group.simulations.length
                const isProfit = avgProfitLoss >= 0
                const avgAccuracy =
                  group.simulations.reduce(
                    (sum, s) => sum + s.accuracy,
                    0
                  ) / group.simulations.length

                return (
                  <Card
                    key={`batch-${group.batch_id}`}
                    className="glass-card border-white/5 hover:border-blue-500/30 transition-all duration-200 cursor-pointer group"
                    onClick={() =>
                      navigate(
                        createPageUrl("Results") +
                          `?batch_id=${group.batch_id}`
                      )
                    }
                  >
                    <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="text-2xl">
                            <Layers
                              className="w-6 h-6 text-blue-400"
                              strokeWidth={1.5}
                            />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-100 group-hover:text-blue-400 transition-colors">
                              {group.batch_name ?? "Batch Simulation"}
                            </h3>
                            <p className="text-xs text-gray-500">
                              Multi-Simulation ({group.simulations.length} runs)
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Avg P&amp;L</span>
                          <span
                            className={`font-semibold ${
                              isProfit
                                ? "text-green-400"
                                : "text-red-400"
                            }`}
                          >
                            {isProfit ? (
                              <TrendingUp
                                className="w-3 h-3 inline mr-1"
                                strokeWidth={2}
                              />
                            ) : (
                              <TrendingDown
                                className="w-3 h-3 inline mr-1"
                                strokeWidth={2}
                              />
                            )}
                            {isProfit ? "+" : "-"}$
                            {Math.abs(avgProfitLoss).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">
                            Avg Win Rate
                          </span>
                          <span className="text-gray-200 font-medium">
                            {avgAccuracy.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar
                            className="w-3 h-3"
                            strokeWidth={2}
                          />
                          {format(
                            new Date(group.created_date),
                            "MMM d, yyyy"
                          )}
                        </div>
                        <Badge
                          variant="outline"
                          className="bg-blue-500/10 text-blue-400 border-blue-500/30"
                        >
                          Batch
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )
              }

              // single simulation card
              const simulation = group.simulation
              const isProfit = simulation.profit_loss >= 0

              return (
                <Card
                  key={simulation.id}
                  className="glass-card border-white/5 hover:border-white/10 transition-all duration-200 cursor-pointer group"
                  onClick={() =>
                    navigate(
                      createPageUrl("Results") + `?id=${simulation.id}`
                    )
                  }
                >
                  <div
                    className={`h-1 ${
                      isProfit ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="text-2xl">
                          {getAssetIcon(simulation.asset_type)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-100 group-hover:text-emerald-400 transition-colors">
                            {simulation.asset_name}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {simulation.algorithm.replace(/_/g, " ")}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">P&amp;L</span>
                        <span
                          className={`font-semibold ${
                            isProfit ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {isProfit ? (
                            <TrendingUp
                              className="w-3 h-3 inline mr-1"
                              strokeWidth={2}
                            />
                          ) : (
                            <TrendingDown
                              className="w-3 h-3 inline mr-1"
                              strokeWidth={2}
                            />
                          )}
                          {isProfit ? "+" : "-"}$
                          {Math.abs(
                            simulation.profit_loss
                          ).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Return</span>
                        <Badge
                          variant="outline"
                          className={
                            isProfit
                              ? "bg-green-500/10 text-green-400 border-green-500/30"
                              : "bg-red-500/10 text-red-400 border-red-500/30"
                          }
                        >
                          {isProfit ? "+" : "-"}
                          {Math.abs(
                            simulation.profit_loss_percentage
                          ).toFixed(2)}
                          %
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Win Rate</span>
                        <span className="text-gray-200 font-medium">
                          {simulation.accuracy.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar
                          className="w-3 h-3"
                          strokeWidth={2}
                        />
                        {format(
                          new Date(simulation.created_date),
                          "MMM d, yyyy"
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign
                          className="w-3 h-3"
                          strokeWidth={2}
                        />
                        ${simulation.initial_investment.toLocaleString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
