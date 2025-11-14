import React from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Trophy, Target } from "lucide-react"

export interface BenchmarkPoint {
  date: string
  value: number
}

export interface BenchmarkComparisonProps {
  equityCurve: BenchmarkPoint[]
  benchmarkEquityCurve: BenchmarkPoint[]
  profitLoss: number
  benchmarkProfitLoss: number
  efficiencyRatio: number
}

export default function BenchmarkComparison({
  equityCurve,
  benchmarkEquityCurve,
  profitLoss,
  benchmarkProfitLoss,
  efficiencyRatio,
}: BenchmarkComparisonProps) {
  const combinedData = equityCurve.map((point, index) => ({
    date: point.date,
    algorithm: point.value,
    perfect:
      benchmarkEquityCurve[index]?.value !== undefined
        ? benchmarkEquityCurve[index].value
        : point.value,
  }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card border border-slate-700 rounded-lg p-3">
          <p className="text-slate-400 text-xs mb-2">
            {payload[0].payload.date}
          </p>
          <div className="space-y-1">
            <p className="text-emerald-400 font-semibold text-sm">
              Your Algorithm: ${payload[0].value.toLocaleString()}
            </p>
            {payload[1] && (
              <p className="text-purple-400 font-semibold text-sm">
                Perfect Algorithm: ${payload[1].value.toLocaleString()}
              </p>
            )}
          </div>
        </div>
      )
    }
    return null
  }

  const algorithmProfit = profitLoss >= 0
  const benchmarkProfit = benchmarkProfitLoss >= 0

  const efficiencyBadgeClass =
    efficiencyRatio >= 80
      ? "bg-green-500/10 text-green-400 border-green-500/30"
      : efficiencyRatio >= 50
      ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
      : "bg-red-500/10 text-red-400 border-red-500/30"

  return (
    <Card className="glass-card border-white/5">
      <CardHeader className="border-b border-white/5 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-gray-100 flex items-center gap-2 text-base font-semibold">
            <Trophy
              className="w-4 h-4 text-purple-500"
              strokeWidth={2}
            />
            Benchmark Comparison
          </CardTitle>
          <Badge
            className={efficiencyBadgeClass}
            variant="outline"
          >
            {efficiencyRatio.toFixed(1)}% Efficiency
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-emerald-500/5 rounded-xl p-4 border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Target
                className="w-4 h-4 text-emerald-400"
                strokeWidth={2}
              />
              <p className="text-xs text-gray-400 uppercase font-medium">
                Your Algorithm
              </p>
            </div>
            <p
              className={`text-2xl font-bold ${
                algorithmProfit ? "text-green-400" : "text-red-400"
              }`}
            >
              {algorithmProfit ? "+" : "-"}$
              {Math.abs(profitLoss).toFixed(2)}
            </p>
          </div>

          <div className="bg-purple-500/5 rounded-xl p-4 border border-purple-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Trophy
                className="w-4 h-4 text-purple-400"
                strokeWidth={2}
              />
              <p className="text-xs text-gray-400 uppercase font-medium">
                Perfect Algorithm
              </p>
            </div>
            <p
              className={`text-2xl font-bold ${
                benchmarkProfit ? "text-green-400" : "text-red-400"
              }`}
            >
              {benchmarkProfit ? "+" : "-"}$
              {Math.abs(benchmarkProfitLoss).toFixed(2)}
            </p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={combinedData}>
            <defs>
              <linearGradient
                id="colorAlgorithm"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor="#10b981"
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor="#10b981"
                  stopOpacity={0}
                />
              </linearGradient>
              <linearGradient
                id="colorPerfect"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor="#a855f7"
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor="#a855f7"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
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
            <Area
              type="monotone"
              dataKey="algorithm"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#colorAlgorithm)"
              name="Your Algorithm"
            />
            <Area
              type="monotone"
              dataKey="perfect"
              stroke="#a855f7"
              strokeWidth={2}
              fill="url(#colorPerfect)"
              name="Perfect Algorithm"
              strokeDasharray="5 5"
            />
          </AreaChart>
        </ResponsiveContainer>

        <div className="mt-6 bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-xs text-gray-400 mb-2">
            <span className="font-semibold text-purple-400">
              Perfect Algorithm
            </span>{" "}
            uses omniscient market knowledge
          </p>
          <p className="text-xs text-gray-500">
            This theoretical benchmark always buys at local minimums
            and sells at local maximums. It represents the maximum
            possible profit from the given price movements and serves
            as a reference point to evaluate your algorithm&apos;s
            efficiency.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
