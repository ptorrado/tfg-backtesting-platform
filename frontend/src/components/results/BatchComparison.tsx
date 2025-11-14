import React from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Layers, Trophy } from "lucide-react"

export interface SimulationForBatch {
  asset_name?: string
  algorithm: string
  profit_loss: number
  profit_loss_percentage: number
  accuracy: number
  sharpe_ratio: number
  max_drawdown: number
  efficiency_ratio: number
  equity_curve: { date: string; value: number }[]
}

export interface BatchComparisonProps {
  simulations: SimulationForBatch[]
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

export default function BatchComparison({
  simulations,
  batchName,
}: BatchComparisonProps) {
  const equityData =
    simulations.length > 0
      ? simulations[0].equity_curve.map((point, index) => {
          const dataPoint: Record<string, any> = {
            date: point.date,
          }
          simulations.forEach((sim) => {
            const label =
              sim.asset_name || sim.algorithm.replace(/_/g, " ")
            dataPoint[label] = sim.equity_curve[index]
              ? sim.equity_curve[index].value
              : 0
          })
          return dataPoint
        })
      : []

  const metricsData = simulations.map((sim) => ({
    name: sim.asset_name || sim.algorithm.replace(/_/g, " "),
    profitLoss: sim.profit_loss,
    accuracy: sim.accuracy,
    sharpeRatio: sim.sharpe_ratio,
    maxDrawdown: sim.max_drawdown,
    efficiency: sim.efficiency_ratio,
  }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card border border-white/10 rounded-lg p-3 max-h-64 overflow-auto">
          <p className="text-gray-400 text-xs mb-2">
            {payload[0].payload.date}
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
    <div className="space-y-6">
      <Card className="glass-card border-white/5">
        <CardHeader className="border-b border-white/5 pb-4">
          <CardTitle className="text-gray-100 flex items-center gap-2 text-base font-semibold">
            <Layers
              className="w-4 h-4 text-blue-500"
              strokeWidth={2}
            />
            {batchName} - Performance Comparison
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {simulations.map((sim, index) => {
              const label =
                sim.asset_name || sim.algorithm.replace(/_/g, " ")
              const isProfit = sim.profit_loss >= 0
              return (
                <div
                  key={index}
                  className="bg-white/5 rounded-xl p-4 border border-white/10"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor:
                          COLORS[index % COLORS.length],
                      }}
                    />
                    <p className="text-xs text-gray-400 font-medium truncate">
                      {label}
                    </p>
                  </div>
                  <p
                    className={`text-2xl font-bold ${
                      isProfit ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {isProfit ? "+" : "-"}$
                    {Math.abs(sim.profit_loss).toFixed(2)}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge
                      variant="outline"
                      className={`${
                        isProfit
                          ? "bg-green-500/10 text-green-400 border-green-500/30"
                          : "bg-red-500/10 text-red-400 border-red-500/30"
                      } text-xs`}
                    >
                      {isProfit ? "+" : "-"}
                      {Math.abs(
                        sim.profit_loss_percentage
                      ).toFixed(2)}
                      %
                    </Badge>
                    <span className="text-xs text-gray-500">
                      Win: {sim.accuracy.toFixed(1)}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={equityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="date"
                stroke="#475569"
                tick={{ fill: "#6b7280", fontSize: 11 }}
              />
              <YAxis
                stroke="#475569"
                tick={{ fill: "#6b7280", fontSize: 11 }}
                tickFormatter={(value: number) =>
                  `$${(value / 1000).toFixed(0)}k`
                }
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: "20px" }}
                iconType="line"
              />
              {simulations.map((sim, index) => {
                const label =
                  sim.asset_name || sim.algorithm.replace(/_/g, " ")
                return (
                  <Line
                    key={label}
                    type="monotone"
                    dataKey={label}
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

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="glass-card border-white/5">
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="text-gray-100 flex items-center gap-2 text-sm font-semibold">
              Profit/Loss Comparison
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={metricsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="name"
                  stroke="#475569"
                  tick={{ fill: "#6b7280", fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  stroke="#475569"
                  tick={{ fill: "#6b7280", fontSize: 10 }}
                />
                <Tooltip />
                <Bar dataKey="profitLoss" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5">
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="text-gray-100 flex items-center gap-2 text-sm font-semibold">
              <Trophy
                className="w-4 h-4 text-amber-500"
                strokeWidth={2}
              />
              Efficiency vs Perfect Algorithm
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={metricsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="name"
                  stroke="#475569"
                  tick={{ fill: "#6b7280", fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  stroke="#475569"
                  tick={{ fill: "#6b7280", fontSize: 10 }}
                  domain={[0, 100]}
                />
                <Tooltip />
                <Bar dataKey="efficiency" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
