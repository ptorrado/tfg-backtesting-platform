import React, { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import {
  Bot,
  TrendingUp,
  Activity,
  Target,
  Zap,
  X,
  Search,
} from "lucide-react"

export type AlgoParams = Record<string, string | number>
export type MultiAlgoParams = Record<string, AlgoParams>

const algorithms = [
  {
    id: "moving_average_crossover",
    name: "Moving Average Crossover",
    description: "Buy when short MA crosses above long MA, sell when it crosses below",
    icon: TrendingUp,
    params: [
      { key: "short_window", label: "Short Window", default: 20, min: 5, max: 50 },
      { key: "long_window", label: "Long Window", default: 50, min: 20, max: 200 },
    ],
  },
  {
    id: "rsi_strategy",
    name: "RSI Strategy",
    description: "Buy when RSI is oversold, sell when overbought",
    icon: Activity,
    params: [
      { key: "rsi_period", label: "RSI Period", default: 14, min: 5, max: 30 },
      { key: "rsi_oversold", label: "Oversold Level", default: 30, min: 20, max: 40 },
      { key: "rsi_overbought", label: "Overbought Level", default: 70, min: 60, max: 80 },
    ],
  },
  {
    id: "momentum",
    name: "Momentum Trading",
    description: "Follow strong price trends and momentum indicators",
    icon: Zap,
    params: [
      { key: "momentum_period", label: "Momentum Period", default: 10, min: 5, max: 30 },
      { key: "momentum_threshold", label: "Threshold %", default: 2, min: 1, max: 5 },
    ],
  },
  {
    id: "mean_reversion",
    name: "Mean Reversion",
    description: "Buy when price deviates significantly below average, sell above",
    icon: Target,
    params: [
      { key: "mean_reversion_period", label: "Period", default: 20, min: 10, max: 50 },
      { key: "mean_reversion_std", label: "Std Deviations", default: 2, min: 1, max: 3 },
    ],
  },
  {
    id: "breakout",
    name: "Breakout Strategy",
    description: "Enter positions when price breaks through support/resistance levels",
    icon: TrendingUp,
    params: [
      { key: "breakout_period", label: "Lookback Period", default: 20, min: 10, max: 50 },
      { key: "breakout_threshold", label: "Breakout %", default: 1.5, min: 0.5, max: 3 },
    ],
  },
]

interface BaseProps {
  advancedMode: boolean
}

interface SingleModeProps extends BaseProps {
  multiMode?: false
  algorithm: string
  setAlgorithm: (algo: string) => void
  algorithmParams: AlgoParams
  setAlgorithmParams: React.Dispatch<React.SetStateAction<AlgoParams>>
}

interface MultiModeProps extends BaseProps {
  multiMode: true
  selectedAlgorithms: string[]
  setSelectedAlgorithms: (algs: string[]) => void
  multiAlgoParams: MultiAlgoParams
  setMultiAlgoParams: React.Dispatch<React.SetStateAction<MultiAlgoParams>>
}

type AlgorithmSelectorProps = SingleModeProps | MultiModeProps

const AlgorithmSelector: React.FC<AlgorithmSelectorProps> = (props) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectValue, setSelectValue] = useState("")

  const filteredAlgorithms = useMemo(() => {
    if (!searchQuery) return algorithms
    return algorithms.filter((algo) =>
      algo.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [searchQuery])

  // SINGLE MODE
  if (!props.multiMode) {
    const { algorithm, setAlgorithm, advancedMode, algorithmParams, setAlgorithmParams } =
      props

    const selectedAlgo = algorithms.find((a) => a.id === algorithm)

    const availableAlgorithms = filteredAlgorithms

    const handleParamChange = (key: string, value: string) => {
      setAlgorithmParams((prev) => ({
        ...prev,
        [key]: value === "" ? "" : value,
      }))
    }

    const handleAlgoSelect = (algoId: string) => {
      setAlgorithm(algoId)
      setShowSuggestions(false)
      setSearchQuery("")
    }

    return (
      <Card className="glass-card border-white/5">
        <CardHeader className="border-b border-white/5 pb-4">
          <CardTitle className="text-gray-100 flex items-center gap-2 text-base font-semibold">
            <Bot className="w-4 h-4 text-gray-400" strokeWidth={2} />
            Trading Algorithm
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <Label className="text-gray-300 font-medium text-xs uppercase tracking-wider mb-3 block">
                Select Algorithm
              </Label>
              <div className="relative">
                <div className="relative mb-3">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 z-10"
                    strokeWidth={2}
                  />
                  <Input
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setShowSuggestions(e.target.value.length > 0)
                    }}
                    onFocus={() => searchQuery && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder="Search algorithms..."
                    className="bg-white/5 border-white/10 text-gray-100 h-10 rounded-xl pl-10 hover:bg-white/10 transition-colors"
                  />
                </div>

                {showSuggestions && availableAlgorithms.length > 0 && (
                  <div className="absolute w-full glass-card border border-white/10 rounded-xl overflow-hidden z-20 shadow-lg mb-3">
                    {availableAlgorithms.map((algo) => (
                      <button
                        key={algo.id}
                        onClick={() => handleAlgoSelect(algo.id)}
                        className="w-full text-left px-4 py-2.5 hover:bg-white/10 transition-colors"
                      >
                        <p className="text-gray-200 text-sm font-medium">{algo.name}</p>
                        <p className="text-gray-500 text-xs">{algo.description}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Select value={algorithm} onValueChange={setAlgorithm}>
                <SelectTrigger className="bg-white/5 border-white/10 text-gray-100 h-11 rounded-xl hover:bg-white/10 transition-colors">
                  <SelectValue placeholder="Select algorithm" />
                </SelectTrigger>
                <SelectContent className="glass-card border-white/10">
                  {algorithms.map((algo) => (
                    <SelectItem
                      key={algo.id}
                      value={algo.id}
                      className="text-gray-200 hover:bg-white/10 focus:bg-white/10"
                    >
                      {algo.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedAlgo && (
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                    <selectedAlgo.icon className="w-4 h-4 text-gray-200" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-100 text-sm mb-1">
                      {selectedAlgo.name}
                    </p>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      {selectedAlgo.description}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {advancedMode && selectedAlgo && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h4 className="text-xs font-semibold text-gray-300 mb-3 uppercase tracking-wider">
                  Algorithm Parameters
                </h4>
                <div className="grid md:grid-cols-2 gap-3">
                  {selectedAlgo.params.map((param) => (
                    <div key={param.key}>
                      <Label className="text-gray-400 text-xs font-medium mb-1.5 block">
                        {param.label}
                      </Label>
                      <Input
                        type="number"
                        min={param.min}
                        max={param.max}
                        step={
                          param.key.includes("threshold") || param.key.includes("std")
                            ? 0.1
                            : 1
                        }
                        value={algorithmParams[param.key] ?? ""}
                        onChange={(e) => handleParamChange(param.key, e.target.value)}
                        placeholder={`Default: ${param.default}`}
                        className="bg-white/5 border-white/10 text-gray-100 h-9 rounded-lg hover:bg-white/10 transition-colors text-sm"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Leave empty to use default values
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // MULTI MODE
  const {
    selectedAlgorithms,
    setSelectedAlgorithms,
    advancedMode,
    multiAlgoParams,
    setMultiAlgoParams,
  } = props as MultiModeProps

  const availableAlgorithms = filteredAlgorithms.filter(
    (a) => !selectedAlgorithms.includes(a.id)
  )

  const handleParamChangeMulti = (algoId: string, key: string, value: string) => {
    setMultiAlgoParams((prev) => ({
      ...prev,
      [algoId]: {
        ...(prev[algoId] || {}),
        [key]: value === "" ? "" : value,
      },
    }))
  }

  const addAlgorithm = (algoId: string) => {
    if (!selectedAlgorithms.includes(algoId)) {
      setSelectedAlgorithms([...selectedAlgorithms, algoId])
      setSelectValue("")
      setSearchQuery("")
    }
  }

  const removeAlgorithm = (algoId: string) => {
    setSelectedAlgorithms(selectedAlgorithms.filter((a) => a !== algoId))
    setMultiAlgoParams((prev) => {
      const next = { ...prev }
      delete next[algoId]
      return next
    })
  }

  const handleAlgoSelect = (algoId: string) => {
    addAlgorithm(algoId)
    setShowSuggestions(false)
    setSearchQuery("")
  }

  return (
    <Card className="glass-card border-white/5">
      <CardHeader className="border-b border-white/5 pb-4">
        <CardTitle className="text-gray-100 flex items-center gap-2 text-base font-semibold">
          <Bot className="w-4 h-4 text-gray-400" strokeWidth={2} />
          Trading Algorithms
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div>
            <Label className="text-gray-300 font-medium text-xs uppercase tracking-wider mb-3 block">
              Add Algorithms
            </Label>
            <div className="relative">
              <div className="relative mb-3">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 z-10"
                  strokeWidth={2}
                />
                <Input
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setShowSuggestions(e.target.value.length > 0)
                  }}
                  onFocus={() => searchQuery && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="Search algorithms..."
                  className="bg-white/5 border-white/10 text-gray-100 h-10 rounded-xl pl-10 hover:bg-white/10 transition-colors"
                />
              </div>

              {showSuggestions && availableAlgorithms.length > 0 && (
                <div className="absolute w-full glass-card border border-white/10 rounded-xl overflow-hidden z-20 shadow-lg mb-3">
                  {availableAlgorithms.map((algo) => (
                    <button
                      key={algo.id}
                      onClick={() => handleAlgoSelect(algo.id)}
                      className="w-full text-left px-4 py-2.5 hover:bg-white/10 transition-colors"
                    >
                      <p className="text-gray-200 text-sm font-medium">{algo.name}</p>
                      <p className="text-gray-500 text-xs">{algo.description}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Select
              value={selectValue}
              onValueChange={(value) => {
                addAlgorithm(value)
                setSelectValue("")
              }}
            >
              <SelectTrigger className="bg-white/5 border-white/10 text-gray-100 h-11 rounded-xl hover:bg-white/10 transition-colors">
                <SelectValue placeholder="Select algorithm to add" />
              </SelectTrigger>
              <SelectContent className="glass-card border-white/10">
                {availableAlgorithms.map((algo) => (
                  <SelectItem
                    key={algo.id}
                    value={algo.id}
                    className="text-gray-200 hover:bg-white/10 focus:bg-white/10"
                  >
                    {algo.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {selectedAlgorithms.map((algoId) => {
              const algo = algorithms.find((a) => a.id === algoId)
              if (!algo) return null
              const Icon = algo.icon

              return (
                <div key={algoId} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-gray-200" strokeWidth={2} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-100 text-sm">{algo.name}</h4>
                        <p className="text-xs text-gray-500">{algo.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeAlgorithm(algoId)}
                      className="text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" strokeWidth={2} />
                    </button>
                  </div>

                  {advancedMode && (
                    <div className="pt-3 border-t border-white/10">
                      <h5 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">
                        Parameters
                      </h5>
                      <div className="grid md:grid-cols-2 gap-3">
                        {algo.params.map((param) => (
                          <div key={param.key}>
                            <Label className="text-gray-400 text-xs font-medium mb-1.5 block">
                              {param.label}
                            </Label>
                            <Input
                              type="number"
                              min={param.min}
                              max={param.max}
                              step={
                                param.key.includes("threshold") ||
                                param.key.includes("std")
                                  ? 0.1
                                  : 1
                              }
                              value={multiAlgoParams[algoId]?.[param.key] ?? ""}
                              onChange={(e) =>
                                handleParamChangeMulti(algoId, param.key, e.target.value)
                              }
                              placeholder={`Default: ${param.default}`}
                              className="bg-white/5 border-white/10 text-gray-100 h-9 rounded-lg hover:bg-white/10 transition-colors text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {selectedAlgorithms.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-sm">
              No algorithms selected. Add algorithms using the dropdown above.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default AlgorithmSelector
