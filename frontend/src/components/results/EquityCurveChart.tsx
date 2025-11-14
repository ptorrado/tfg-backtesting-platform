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
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { TrendingUp } from "lucide-react"

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
        <div className="glass-card border border-slate-700 rounded-lg p-3">
          <p className="text-slate-400 text-xs">
            {payload[0].payload.date}
          </p>
          <p className="text-slate-100 font-semibold text-base">
            ${payload[0].value.toLocaleString()}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="glass-card border-white/5">
      <CardHeader className="border-b border-white/5 pb-4">
        <CardTitle className="text-gray-100 flex items-center gap-2 text-base font-semibold">
          <TrendingUp
            className="w-4 h-4 text-emerald-500"
            strokeWidth={2}
          />
          Equity Curve
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data}>
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
