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
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card"
import { Badge } from "../../ui/badge"
import { Trophy, Target } from "lucide-react"
import { formatDate } from "../../../utils"

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
        <div className="glass-card border border-border bg-popover rounded-lg p-3">
          <p className="text-muted-foreground text-xs mb-2">
            {formatDate(payload[0].payload.date)}
          </p>
          <div className="space-y-1">
            <p className="text-emerald-400 font-semibold text-sm">
              Your Algorithm: ${payload[0].value.toLocaleString()}
            </p>
            {payload[1] && (
              <p className="text-purple-400 font-semibold text-sm">
                Market Benchmark: ${payload[1].value.toLocaleString()}
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
    <Card className="glass-card border-border bg-card h-full flex flex-col">
      <CardHeader className="border-b border-border pb-4 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-foreground flex items-center gap-2 text-base font-semibold">
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
      <CardContent className="p-6 flex-1 flex flex-col min-h-0">
        <div className="grid grid-cols-2 gap-4 mb-4 shrink-0">
          <div className="bg-emerald-500/5 rounded-xl p-4 border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Target
                className="w-4 h-4 text-emerald-400"
                strokeWidth={2}
              />
              <p className="text-xs text-muted-foreground uppercase font-medium">
                Your Algorithm
              </p>
            </div>
            <p
              className={`text-2xl font-bold ${algorithmProfit ? "text-green-400" : "text-red-400"
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
              <p className="text-xs text-muted-foreground uppercase font-medium">
                Market Benchmark
              </p>
            </div>
            <p
              className={`text-2xl font-bold ${benchmarkProfit ? "text-green-400" : "text-red-400"
                }`}
            >
              {benchmarkProfit ? "+" : "-"}$
              {Math.abs(benchmarkProfitLoss).toFixed(2)}
            </p>
          </div>
        </div>

        <div className="flex-1 w-full min-h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={combinedData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
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
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                minTickGap={20}
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
                name="Market Benchmark"
                strokeDasharray="5 5"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 bg-muted/20 rounded-xl p-4 border border-border shrink-0">
          <p className="text-xs text-muted-foreground mb-2">
            <span className="font-semibold text-purple-400">
              Market Benchmark
            </span>{" "}
            represents buying and holding the asset
          </p>
          <p className="text-xs text-muted-foreground">
            This benchmark compares your strategy against simply holding the asset
            for the entire duration. It represents the market growth
            and serves as a reference point to evaluate your algorithm&apos;s
            efficiency.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
