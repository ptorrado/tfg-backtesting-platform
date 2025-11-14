import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Activity, TrendingUp, TrendingDown } from "lucide-react"

export interface PriceChartProps {
  assetName: string
  assetType: string
}

interface PricePoint {
  date: string
  price: number
}

export default function PriceChart({ assetName, assetType }: PriceChartProps) {
  const [priceData, setPriceData] = useState<PricePoint[]>([])
  const [currentPrice, setCurrentPrice] = useState(0)
  const [priceChange, setPriceChange] = useState(0)

  useEffect(() => {
    if (!assetName) return

    const generatePriceData = () => {
      const data: PricePoint[] = []
      let basePrice = 100 + Math.random() * 400
      const volatility = assetType === "crypto" ? 0.03 : 0.015

      for (let i = 30; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)

        const change = (Math.random() - 0.5) * volatility * basePrice
        basePrice += change

        data.push({
          date: date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          price: parseFloat(basePrice.toFixed(2)),
        })
      }

      return data
    }

    const data = generatePriceData()
    setPriceData(data)
    setCurrentPrice(data[data.length - 1].price)

    const firstPrice = data[0].price
    const lastPrice = data[data.length - 1].price
    const change = ((lastPrice - firstPrice) / firstPrice) * 100
    setPriceChange(change)
  }, [assetName, assetType])

  if (!assetName) return null

  const isPositive = priceChange >= 0

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean
    payload?: any[]
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card rounded-lg p-3 border border-slate-700">
          <p className="text-slate-400 text-xs mb-1">
            {payload[0].payload.date}
          </p>
          <p className="text-slate-100 font-semibold text-base">
            ${payload[0].value.toFixed(2)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="glass-card border-white/5">
      <CardHeader className="border-b border-white/5 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-gray-100 flex items-center gap-2 text-base font-semibold">
            <Activity className="w-4 h-4 text-emerald-500" strokeWidth={2} />
            Price Chart
          </CardTitle>
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-lg ${
              isPositive
                ? "bg-green-500/10 text-green-400"
                : "bg-red-500/10 text-red-400"
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3" strokeWidth={2} />
            ) : (
              <TrendingDown className="w-3 h-3" strokeWidth={2} />
            )}
            <span className="font-semibold text-xs">
              {isPositive ? "+" : ""}
              {priceChange.toFixed(2)}%
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="mb-6">
          <p className="text-xs text-gray-400 mb-1">{assetName}</p>
          <div className="flex items-baseline gap-3">
            <p className="text-3xl font-bold text-gray-100">
              ${currentPrice.toFixed(2)}
            </p>
            <p
              className={`text-sm font-semibold ${
                isPositive ? "text-green-400" : "text-red-400"
              }`}
            >
              {isPositive ? "+" : ""}
              {(
                (priceData[priceData.length - 1]?.price || 0) -
                (priceData[0]?.price || 0)
              ).toFixed(2)}
            </p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={priceData}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={isPositive ? "#10b981" : "#ef4444"}
                  stopOpacity={0.2}
                />
                <stop
                  offset="95%"
                  stopColor={isPositive ? "#10b981" : "#ef4444"}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="date"
              stroke="#475569"
              tick={{ fill: "#6b7280", fontSize: 10 }}
              tickLine={false}
            />
            <YAxis
              stroke="#475569"
              tick={{ fill: "#6b7280", fontSize: 10 }}
              tickFormatter={(value) => `$${(value as number).toFixed(0)}`}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="price"
              stroke={isPositive ? "#10b981" : "#ef4444"}
              strokeWidth={2}
              fill="url(#priceGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
