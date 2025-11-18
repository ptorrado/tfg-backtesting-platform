import React, { useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Calendar as CalendarIcon, DollarSign } from "lucide-react"

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
  const durationInDays =
    startDate && endDate
      ? Math.ceil(
          (new Date(endDate).getTime() - new Date(startDate).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : null

  // refs a los <input type="date">
  const startRef = useRef<HTMLInputElement | null>(null)
  const endRef = useRef<HTMLInputElement | null>(null)

  // 👇 aceptar RefObject<HTMLInputElement | null>, no solo HTMLInputElement
  const openPicker = (ref: React.RefObject<HTMLInputElement | null>) => {
    if (!ref.current) return

    // showPicker existe en Chrome/Edge recientes
    if (typeof (ref.current as any).showPicker === "function") {
      ;(ref.current as any).showPicker()
    } else {
      // fallback: focus + click
      ref.current.focus()
      ref.current.click()
    }
  }

  return (
    <Card className="glass-card border-white/5 h-full">
      <CardHeader className="border-b border-white/5 pb-4">
        <CardTitle className="text-gray-100 flex items-center gap-2 text-base font-semibold">
          <CalendarIcon className="w-4 h-4 text-gray-400" strokeWidth={2} />
          Configuration
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 space-y-5">
        {/* DATES */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* START DATE */}
          <div className="space-y-2">
            <Label
              htmlFor="start-date"
              className="text-gray-300 font-medium text-xs uppercase tracking-wider"
            >
              Start Date
            </Label>
            <div className="relative">
              <Input
                ref={startRef}
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-white/5 border-white/10 text-gray-100 h-11 rounded-xl pr-10 hover:bg-white/10 transition-colors"
              />
              {/* ÚNICO icono visible, que abre el datepicker nativo */}
              <button
                type="button"
                onClick={() => openPicker(startRef)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
              >
                <CalendarIcon className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* END DATE */}
          <div className="space-y-2">
            <Label
              htmlFor="end-date"
              className="text-gray-300 font-medium text-xs uppercase tracking-wider"
            >
              End Date
            </Label>
            <div className="relative">
              <Input
                ref={endRef}
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-white/5 border-white/10 text-gray-100 h-11 rounded-xl pr-10 hover:bg-white/10 transition-colors"
              />
              <button
                type="button"
                onClick={() => openPicker(endRef)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
              >
                <CalendarIcon className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>

        {/* INVESTMENT */}
        <div className="space-y-2">
          <Label
            htmlFor="investment"
            className="text-gray-300 font-medium text-xs uppercase tracking-wider"
          >
            Initial Investment
          </Label>
          <div className="relative">
            <DollarSign
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              strokeWidth={2}
            />
            <Input
              id="investment"
              type="number"
              min={100}
              step={100}
              value={Number.isFinite(initialInvestment) ? initialInvestment : ""}
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

        {/* SUMMARY */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <h4 className="text-xs font-semibold text-gray-300 mb-3 uppercase tracking-wider">
            Period Summary
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Duration</span>
              <span className="text-gray-200 font-medium">
                {durationInDays !== null ? `${durationInDays} days` : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Investment</span>
              <span className="text-gray-200 font-medium">
                ${initialInvestment.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
