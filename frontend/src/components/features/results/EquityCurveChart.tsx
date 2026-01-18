import React from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card"
import { TrendingUp } from "lucide-react"
import { formatDate } from "../../../utils"

export interface EquityPoint {
  date: string
  value: number
}

export interface EquityCurveChartProps {
  data: EquityPoint[]
}

export default function EquityCurveChart({ data }: EquityCurveChartProps) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card border border-border bg-popover rounded-lg p-3">
          <p className="text-muted-foreground text-xs">
            {formatDate(payload[0].payload.date)}
          </p>
          <p className="text-foreground font-semibold text-base">
            ${payload[0].value.toLocaleString()}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="glass-card border-border bg-card h-full">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="text-foreground flex items-center gap-2 text-base font-semibold">
          <TrendingUp
            className="w-4 h-4 text-emerald-500"
            strokeWidth={2}
          />
          Equity Curve
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
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
            <Area
              type="monotone"
              dataKey="value"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#colorValue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
