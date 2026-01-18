import React, { useState, useEffect, useRef } from "react"
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card"
import { Layers, ChevronDown } from "lucide-react"
import BatchSummaryCards from "./BatchSummaryCards"
import ComparisonTable from "./ComparisonTable"
import RiskRewardScatter from "./RiskRewardScatter"
import SingleSimulationDashboard from "./SingleSimulationDashboard"
import { formatDate } from "../../../utils"
import { SimulationDetail } from "../../../api/simulations"

export interface SimulationForBatch {
  id: number
  asset_name?: string
  algorithm: string
  profit_loss: number
  profit_loss_percentage: number
  accuracy: number
  sharpe_ratio: number
  max_drawdown: number
  efficiency_ratio: number
  equity_curve: { date: string; value: number }[]
  params?: Record<string, number> | null
}

export interface BatchComparisonProps {
  simulations: SimulationForBatch[]
  allSimulations: SimulationDetail[]
  batchName: string
}

const COLORS = [
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#06b6d4",
]

// Helper para formatear el nombre del algoritmo
const formatAlgo = (algo: string) =>
  algo
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase())

export default function BatchComparison({
  simulations,
  allSimulations,
  batchName,
}: BatchComparisonProps) {
  const [selectedSimId, setSelectedSimId] = useState<number | null>(null);
  const detailsRef = useRef<HTMLDivElement>(null);

  const selectedSimulation = allSimulations.find(s => s.id === selectedSimId);

  useEffect(() => {
    if (selectedSimId && detailsRef.current) {
      // Small timeout to allow render to happen
      setTimeout(() => {
        detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [selectedSimId]);

  // Contamos cuántos activos y cuántos algoritmos distintos hay en el batch
  const assetNames = simulations.map((s) => s.asset_name ?? "")
  const algoNames = simulations.map((s) => s.algorithm)

  const uniqueAssetCount = new Set(assetNames).size
  const uniqueAlgoCount = new Set(algoNames).size

  // Etiqueta “inteligente”:
  const getSeriesLabel = (sim: SimulationForBatch): string => {
    const algoLabel = formatAlgo(sim.algorithm)
    const assetLabel = sim.asset_name ?? ""

    if (uniqueAssetCount === 1 && uniqueAlgoCount > 1) {
      return algoLabel
    }
    if (uniqueAssetCount > 1 && uniqueAlgoCount === 1) {
      return assetLabel || algoLabel
    }
    return assetLabel ? `${assetLabel} · ${algoLabel}` : algoLabel
  }

  // Datos para el gráfico de equity: usamos la curva de la primera simulación como base de fechas
  const equityData =
    simulations.length > 0
      ? simulations[0].equity_curve.map((point, index) => {
        const dataPoint: Record<string, any> = {
          date: point.date,
        }
        simulations.forEach((sim) => {
          const label = getSeriesLabel(sim)
          dataPoint[label] = sim.equity_curve[index]
            ? sim.equity_curve[index].value
            : 0
        })
        return dataPoint
      })
      : []

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card border border-border bg-popover rounded-lg p-3 max-h-64 overflow-auto">
          <p className="text-muted-foreground text-xs mb-2">
            {formatDate(payload[0].payload.date)}
          </p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <p
                key={index}
                className="font-semibold text-sm"
                style={{ color: entry.color }}
              >
                {entry.name}: ${entry.value.toLocaleString()}
              </p>
            ))}
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-8">

      {/* 1. Summary Cards */}
      <BatchSummaryCards simulations={simulations} />

      {/* 2. Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Equity Curve (2/3 width) */}
        <Card className="glass-card border-border bg-card lg:col-span-2 h-full">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-foreground flex items-center gap-2 text-base font-semibold">
              <Layers className="w-4 h-4 text-emerald-500" strokeWidth={2} />
              Equity Curve Comparison
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pb-8">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={equityData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  minTickGap={30}
                  tickFormatter={(value) => formatDate(value)}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  tickFormatter={(value: number) =>
                    `$${(value / 1000).toFixed(0)}k`
                  }
                  width={40}
                  tickCount={6}
                  minTickGap={20}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: "10px" }}
                  iconType="line"
                />
                {simulations.map((sim, index) => {
                  const label = getSeriesLabel(sim)
                  return (
                    <Line
                      key={`${label}-${index}`}
                      type="monotone"
                      dataKey={label}
                      name={label}
                      stroke={COLORS[index % COLORS.length]}
                      strokeWidth={2}
                      dot={false}
                    />
                  )
                })}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Risk/Reward Scatter (1/3 width) */}
        <div className="h-full">
          <RiskRewardScatter simulations={simulations} />
        </div>
      </div>

      {/* 3. Detailed Table */}
      <div id="comparison-table">
        <ComparisonTable
          simulations={simulations}
          onSelect={setSelectedSimId}
          selectedId={selectedSimId}
        />
      </div>

      {/* 4. DRILLED DOWN SINGLE DETAIL VIEW */}
      {selectedSimulation && (
        <div
          ref={detailsRef}
          className="pt-8 border-t border-border mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <div className="flex items-center gap-2 mb-6">
            <ChevronDown className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">
              Detailed Analysis: <span className="text-primary">{selectedSimulation.asset} - {selectedSimulation.algorithm.replace(/_/g, " ")}</span>
            </h2>
          </div>

          <SingleSimulationDashboard simulation={selectedSimulation} />
        </div>
      )}

    </div>
  )
}
