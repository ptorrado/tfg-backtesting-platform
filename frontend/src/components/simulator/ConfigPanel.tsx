import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Calendar, DollarSign } from "lucide-react"

export interface ConfigPanelProps {
  startDate: string
  setStartDate: (value: string) => void
  endDate: string
  setEndDate: (value: string) => void
  initialInvestment: number
  setInitialInvestment: (value: number) => void
}

export default function ConfigPanel({
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  initialInvestment,
  setInitialInvestment,
}: ConfigPanelProps) {
  const durationDays =
    startDate && endDate
      ? Math.ceil(
          (new Date(endDate).getTime() - new Date(startDate).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : null

  return (
    <Card className="glass-card border-white/5">
      <CardHeader className="border-b border-white/5 pb-4">
        <CardTitle className="text-gray-100 flex items-center gap-2 text-base font-semibold">
          <Calendar className="w-4 h-4 text-gray-400" strokeWidth={2} />
          Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-5">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label
              htmlFor="start-date"
              className="text-gray-300 font-medium text-xs uppercase tracking-wider"
            >
              Start Date
            </Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-white/5 border-white/10 text-gray-100 h-11 rounded-xl hover:bg-white/10 transition-colors"
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="end-date"
              className="text-gray-300 font-medium text-xs uppercase tracking-wider"
            >
              End Date
            </Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-white/5 border-white/10 text-gray-100 h-11 rounded-xl hover:bg-white/10 transition-colors"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="investment"
            className="text-gray-300 font-medium text-xs uppercase tracking-wider"
          >
            Initial Investment
          </Label>
          <div className="relative">
            <DollarSign
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              strokeWidth={2}
            />
            <Input
              id="investment"
              type="number"
              min={100}
              step={100}
              value={Number.isNaN(initialInvestment) ? "" : initialInvestment}
              onChange={(e) =>
                setInitialInvestment(
                  e.target.value === "" ? 0 : parseFloat(e.target.value)
                )
              }
              className="bg-white/5 border-white/10 text-gray-100 pl-10 h-12 text-lg font-semibold rounded-xl hover:bg-white/10 transition-colors"
              placeholder="10000"
            />
          </div>
          <p className="text-xs text-gray-500">Minimum: $100</p>
        </div>

        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <h4 className="text-xs font-semibold text-gray-300 mb-3 uppercase tracking-wider">
            Period Summary
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Duration</span>
              <span className="text-gray-200 font-medium">
                {durationDays !== null ? `${durationDays} days` : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Investment</span>
              <span className="text-gray-200 font-medium">
                ${Number(initialInvestment || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
