import React, { useMemo, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card"
import {
  Search,
  ChevronDown,
  Check,
  SlidersHorizontal,
  Brain,
} from "lucide-react"

export type AlgoParams = Record<string, number | "">
export type MultiAlgoParams = Record<string, AlgoParams>

type BaseProps = {
  advancedMode: boolean
}

type SingleModeProps = BaseProps & {
  multiMode?: false
  algorithm: string
  setAlgorithm: (algo: string) => void
  algorithmParams: AlgoParams
  setAlgorithmParams: React.Dispatch<React.SetStateAction<AlgoParams>>
}

type MultiModeProps = BaseProps & {
  multiMode: true
  selectedAlgorithms: string[]
  setSelectedAlgorithms: (algs: string[]) => void
  multiAlgoParams: MultiAlgoParams
  setMultiAlgoParams: React.Dispatch<React.SetStateAction<MultiAlgoParams>>
}

export type AlgorithmSelectorProps = SingleModeProps | MultiModeProps

type AlgorithmDef = {
  id: string
  label: string
  description: string
}

const ALGORITHMS: AlgorithmDef[] = [
  {
    id: "sma_crossover",
    label: "SMA Crossover",
    description:
      "Dual simple moving average strategy that goes long when the short SMA crosses above the long SMA.",
  },
  {
    id: "ema_crossover",
    label: "EMA Crossover",
    description:
      "Similar to SMA crossover but using exponential moving averages, reacting faster to recent price changes.",
  },
  {
    id: "donchian_breakout",
    label: "Donchian Breakout",
    description:
      "Trend-following strategy that buys on breakouts above a price channel and sells on breakdowns.",
  },
  {
    id: "rsi_reversion",
    label: "RSI Mean Reversion",
    description:
      "Mean-reversion approach based on the RSI indicator, buying oversold conditions and selling overbought ones.",
  },
  {
    id: "buy_and_hold",
    label: "Buy & Hold Baseline",
    description:
      "Simple benchmark: invest at the start date and hold the position until the end of the simulation.",
  },
]

type ParamDef = {
  key: string
  label: string
  min: number
  max: number
  step: number
  defaultValue: number
}

const ALGO_PARAM_DEFS: Record<string, ParamDef[]> = {
  sma_crossover: [
    {
      key: "short_window",
      label: "Short SMA window",
      min: 5,
      max: 50,
      step: 1,
      defaultValue: 20,
    },
    {
      key: "long_window",
      label: "Long SMA window",
      min: 20,
      max: 200,
      step: 5,
      defaultValue: 50,
    },
  ],
  ema_crossover: [
    {
      key: "fast_ema",
      label: "Fast EMA period",
      min: 5,
      max: 50,
      step: 1,
      defaultValue: 12,
    },
    {
      key: "slow_ema",
      label: "Slow EMA period",
      min: 20,
      max: 200,
      step: 5,
      defaultValue: 26,
    },
  ],
  donchian_breakout: [
    {
      key: "channel_period",
      label: "Channel period",
      min: 10,
      max: 200,
      step: 5,
      defaultValue: 55,
    },
  ],
  rsi_reversion: [
    {
      key: "rsi_period",
      label: "RSI period",
      min: 5,
      max: 50,
      step: 1,
      defaultValue: 14,
    },
    {
      key: "oversold",
      label: "Oversold threshold",
      min: 5,
      max: 40,
      step: 1,
      defaultValue: 30,
    },
    {
      key: "overbought",
      label: "Overbought threshold",
      min: 60,
      max: 95,
      step: 1,
      defaultValue: 70,
    },
  ],
  buy_and_hold: [],
}

const AlgorithmSelector: React.FC<AlgorithmSelectorProps> = (props) => {
  const isMulti = props.multiMode === true

  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)

  const filteredAlgos = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return ALGORITHMS
    return ALGORITHMS.filter(
      (a) =>
        a.label.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q)
    )
  }, [query])

  const selectedIds: string[] = isMulti
    ? (props as MultiModeProps).selectedAlgorithms
    : (props as SingleModeProps).algorithm
    ? [(props as SingleModeProps).algorithm]
    : []

  const currentAlgoDef =
    !isMulti && (props as SingleModeProps).algorithm
      ? ALGORITHMS.find(
          (a) => a.id === (props as SingleModeProps).algorithm
        )
      : undefined

  const handleSelect = (algoId: string) => {
    if (isMulti) {
      const multi = props as MultiModeProps
      if (multi.selectedAlgorithms.includes(algoId)) {
        multi.setSelectedAlgorithms(
          multi.selectedAlgorithms.filter((id) => id !== algoId)
        )
      } else {
        multi.setSelectedAlgorithms([
          ...multi.selectedAlgorithms,
          algoId,
        ])
      }
    } else {
      const single = props as SingleModeProps
      single.setAlgorithm(algoId)
    }

    setQuery("")
    setOpen(false)
  }

  // advanced params single-mode
  const renderAdvancedParams = () => {
    if (isMulti || !props.advancedMode) return null

    const single = props as SingleModeProps
    const defs = ALGO_PARAM_DEFS[single.algorithm] ?? []
    if (!defs.length) return null

    return (
      <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-300 uppercase tracking-wide">
          <SlidersHorizontal className="w-4 h-4" />
          <span>Advanced Parameters</span>
        </div>
        {defs.map((def) => {
          const valueRaw = single.algorithmParams[def.key]
          const value =
            typeof valueRaw === "number"
              ? valueRaw
              : def.defaultValue
          return (
            <div key={def.key} className="flex flex-col gap-1">
              <div className="flex justify-between text-xs text-gray-400">
                <span>{def.label}</span>
                <span>
                  {value} ({def.min}–{def.max})
                </span>
              </div>
              <input
                type="range"
                min={def.min}
                max={def.max}
                step={def.step}
                value={value}
                onChange={(e) => {
                  const num = Number(e.target.value)
                  single.setAlgorithmParams((prev) => ({
                    ...prev,
                    [def.key]: num,
                  }))
                }}
                className="w-full accent-blue-400"
              />
            </div>
          )
        })}
      </div>
    )
  }

  // advanced params multi-mode
  const renderMultiAdvancedParams = () => {
    if (!isMulti || !props.advancedMode) return null

    const multi = props as MultiModeProps
    const selected = multi.selectedAlgorithms

    const handleParamChange = (
      algoId: string,
      key: string,
      value: number
    ) => {
      multi.setMultiAlgoParams((prev) => ({
        ...prev,
        [algoId]: {
          ...(prev[algoId] || {}),
          [key]: value,
        },
      }))
    }

    return (
      <div className="mt-4 space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-300 uppercase tracking-wide">
          <SlidersHorizontal className="w-4 h-4" />
          <span>Algorithm Parameters</span>
        </div>

        {selected.length === 0 ? (
          <p className="text-xs text-gray-500">
            Select at least one algorithm to customize its parameters.
          </p>
        ) : (
          selected.map((algoId) => {
            const defs = ALGO_PARAM_DEFS[algoId] ?? []
            if (!defs.length) return null

            const algoDef = ALGORITHMS.find(
              (a) => a.id === algoId
            )

            return (
              <div
                key={algoId}
                className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-3"
              >
                <div className="flex justify-between items-center text-xs font-semibold text-gray-200">
                  <span>{algoDef?.label ?? algoId}</span>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider">
                    {algoId.replace(/_/g, " ")}
                  </span>
                </div>

                {defs.map((def) => {
                  const raw =
                    multi.multiAlgoParams[algoId]?.[def.key]
                  const value =
                    typeof raw === "number"
                      ? raw
                      : def.defaultValue

                  return (
                    <div
                      key={def.key}
                      className="flex flex-col gap-1"
                    >
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>{def.label}</span>
                        <span>
                          {value} ({def.min}–{def.max})
                        </span>
                      </div>
                      <input
                        type="range"
                        min={def.min}
                        max={def.max}
                        step={def.step}
                        value={value}
                        onChange={(e) =>
                          handleParamChange(
                            algoId,
                            def.key,
                            Number(e.target.value)
                          )
                        }
                        className="w-full accent-blue-400"
                      />
                    </div>
                  )
                })}
              </div>
            )
          })
        )}
      </div>
    )
  }

  const multiProps = props as MultiModeProps

  return (
    <Card className="relative h-full flex flex-col rounded-2xl border border-white/10 bg-white/[0.03]">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-gray-100 flex items-center gap-2">
          <Brain className="w-4 h-4" />
          Trading Algorithm
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 flex flex-col">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">
            {isMulti ? "Algorithms" : "Algorithm"}
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              className="w-full bg-white/5 border border-white/10 text-gray-100 h-11 rounded-xl pl-9 pr-10 text-sm placeholder-gray-500 hover:bg-white/10 transition-colors focus:outline-none"
              placeholder={
                isMulti
                  ? "Search & select algorithms..."
                  : "Search algorithm (e.g. SMA, RSI)..."
              }
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setOpen(true)
              }}
              onFocus={() => setOpen(true)}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
              onClick={() => setOpen((o) => !o)}
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  open ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>

          {open && (
            <div className="mt-2 max-h-60 overflow-y-auto rounded-xl border border-white/10 bg-white/5 shadow-xl custom-scrollbar">
              {filteredAlgos.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-400">
                  No algorithms found
                </div>
              ) : (
                filteredAlgos.map((algo) => {
                  const selected = selectedIds.includes(algo.id)
                  return (
                    <button
                      key={algo.id}
                      type="button"
                      onClick={() => handleSelect(algo.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors hover:bg-white/10 ${
                        selected
                          ? "bg-white/10 text-gray-50"
                          : "text-gray-100"
                      }`}
                    >
                      <span>{algo.label}</span>
                      {selected && (
                        <Check className="w-4 h-4 text-gray-100" />
                      )}
                    </button>
                  )
                })
              )}
            </div>
          )}

          {/* chips multi-modo con estilo neutro + X */}
          {isMulti &&
            multiProps.selectedAlgorithms.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {multiProps.selectedAlgorithms.map((id) => {
                  const algo = ALGORITHMS.find(
                    (a) => a.id === id
                  )
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => handleSelect(id)}
                      className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs text-gray-100 border border-white/30 hover:bg-white/20"
                    >
                      <span>{algo?.label ?? id}</span>
                      <span className="text-gray-300 text-sm">
                        ×
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
        </div>

        {/* overview solo en single-mode */}
        {!isMulti && currentAlgoDef && (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
            <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
              Algorithm overview
            </h4>
            <div className="flex justify-between text-sm">
              <span className="text-gray-100">
                {currentAlgoDef.label}
              </span>
              <span className="text-xs text-gray-400 uppercase tracking-wider">
                {currentAlgoDef.id.replace(/_/g, " ")}
              </span>
            </div>
            <p className="text-xs text-gray-400">
              {currentAlgoDef.description}
            </p>
          </div>
        )}

        {renderAdvancedParams()}
        {renderMultiAdvancedParams()}
      </CardContent>
    </Card>
  )
}

export default AlgorithmSelector
