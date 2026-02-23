import React from "react"
import { Card, CardContent } from "../../ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"

export interface MetricsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  isPositive?: boolean | null
  isPercentage?: boolean
}

export default function MetricsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  isPositive,
  isPercentage,
}: MetricsCardProps) {
  const displayValue =
    isPercentage && typeof value === "number"
      ? `${value.toFixed(2)}%`
      : value

  const colorClass =
    isPositive === true
      ? "text-green-400"
      : isPositive === false
        ? "text-red-500"
        : "text-foreground"

  const iconColorClass =
    isPositive === true
      ? "text-green-400"
      : isPositive === false
        ? "text-red-400"
        : "text-emerald-400"

  return (
    <Card className="glass-card">
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="w-10 h-10 rounded-xl bg-muted/20 flex items-center justify-center">
            <Icon
              className={`w-5 h-5 ${iconColorClass}`}
              strokeWidth={2}
            />
          </div>
          {isPositive !== null && isPositive !== undefined && (
            isPositive ? (
              <TrendingUp
                className="w-4 h-4 text-green-400"
                strokeWidth={2}
              />
            ) : (
              <TrendingDown
                className="w-4 h-4 text-red-400"
                strokeWidth={2}
              />
            )
          )}
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">
            {title}
          </p>
          <p className={`text-2xl font-bold ${colorClass}`}>
            {displayValue}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
