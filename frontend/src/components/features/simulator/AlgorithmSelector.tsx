import React, { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../../ui/card";
import {
  Search,
  ChevronDown,
  Check,
  SlidersHorizontal,
  Brain,
} from "lucide-react";

import {
  listAlgorithms,
  AlgorithmInfo,
  AlgoParam,
} from "../../../api/algorithms";

// ===== Tipos usados por el resto de la app (NO TOCAR) =====

export type AlgoParams = Record<string, number | "">;
export type MultiAlgoParams = Record<string, AlgoParams>;

type BaseProps = {
  advancedMode: boolean;
};

type SingleModeProps = BaseProps & {
  multiMode?: false;
  algorithm: string;
  setAlgorithm: (algo: string) => void;
  algorithmParams: AlgoParams;
  setAlgorithmParams: React.Dispatch<React.SetStateAction<AlgoParams>>;
};

type MultiModeProps = BaseProps & {
  multiMode: true;
  selectedAlgorithms: string[];
  setSelectedAlgorithms: (algs: string[]) => void;
  multiAlgoParams: MultiAlgoParams;
  setMultiAlgoParams: React.Dispatch<React.SetStateAction<MultiAlgoParams>>;
};

export type AlgorithmSelectorProps = SingleModeProps | MultiModeProps;

// =========================================================

const AlgorithmSelector: React.FC<AlgorithmSelectorProps> = (props) => {
  const isMulti = props.multiMode === true;

  const [algorithms, setAlgorithms] = useState<AlgorithmInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  // ---- Cargar algoritmos desde el backend ----
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        const data = await listAlgorithms();
        if (!mounted) return;
        setAlgorithms(data);
        // 👇 Importante: NO seleccionamos ningún algoritmo por defecto.
        // El padre decide qué valor tiene `algorithm`.
      } catch (err) {
        console.error("Failed to load algorithms", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []); // solo al montar

  // ---- Búsqueda ----
  const filteredAlgos = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return algorithms;
    return algorithms.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
    );
  }, [algorithms, query]);

  // ---- IDs seleccionados (single o multi) ----
  const selectedIds: string[] = isMulti
    ? (props as MultiModeProps).selectedAlgorithms
    : (props as SingleModeProps).algorithm
      ? [(props as SingleModeProps).algorithm]
      : [];

  // ---- Definición del algoritmo actual (single-mode) ----
  const currentAlgoDef: AlgorithmInfo | undefined =
    !isMulti && (props as SingleModeProps).algorithm
      ? algorithms.find(
        (a) => a.id === (props as SingleModeProps).algorithm
      )
      : undefined;

  // ---- Selección de algoritmo ----
  const handleSelect = (algoId: string) => {
    if (isMulti) {
      const multi = props as MultiModeProps;
      if (multi.selectedAlgorithms.includes(algoId)) {
        multi.setSelectedAlgorithms(
          multi.selectedAlgorithms.filter((id) => id !== algoId)
        );
      } else {
        multi.setSelectedAlgorithms([...multi.selectedAlgorithms, algoId]);
      }
    } else {
      const single = props as SingleModeProps;
      single.setAlgorithm(algoId);

      const algoDef = algorithms.find((a) => a.id === algoId);
      if (algoDef) {
        const defaults: AlgoParams = {};
        algoDef.params.forEach((p) => {
          defaults[p.name] = p.default;
        });
        single.setAlgorithmParams(defaults);
      }
    }

    setQuery("");
    setOpen(false);
  };

  // =========================================================
  //      ADVANCED PARAMS – SINGLE MODE
  // =========================================================

  const renderAdvancedParams = () => {
    if (isMulti || !props.advancedMode) return null;

    const single = props as SingleModeProps;
    const algo = algorithms.find((a) => a.id === single.algorithm);
    if (!algo || algo.params.length === 0) return null;

    return (
      <div className="mt-4 rounded-xl border border-border bg-muted/20 p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <SlidersHorizontal className="w-4 h-4" />
          <span>Advanced Parameters</span>
        </div>
        {algo.params.map((def: AlgoParam) => {
          const rawValue = single.algorithmParams[def.name];
          const value =
            typeof rawValue === "number" ? rawValue : def.default;

          return (
            <div key={def.name} className="flex flex-col gap-1">
              <div className="flex justify-between text-xs text-muted-foreground">
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
                  const num = Number(e.target.value);
                  single.setAlgorithmParams((prev) => ({
                    ...prev,
                    [def.name]:
                      def.type === "int" ? Math.round(num) : num,
                  }));
                }}
                className="w-full accent-primary"
              />
              {def.description && (
                <p className="text-[11px] text-muted-foreground">
                  {def.description}
                </p>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // =========================================================
  //      ADVANCED PARAMS – MULTI MODE
  // =========================================================

  const renderMultiAdvancedParams = () => {
    if (!isMulti || !props.advancedMode) return null;

    const multi = props as MultiModeProps;
    const selected = multi.selectedAlgorithms;

    const handleParamChange = (
      algoId: string,
      param: AlgoParam,
      value: number
    ) => {
      const v = param.type === "int" ? Math.round(value) : value;
      multi.setMultiAlgoParams((prev) => ({
        ...prev,
        [algoId]: {
          ...(prev[algoId] || {}),
          [param.name]: v,
        },
      }));
    };

    return (
      <div className="mt-4 space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <SlidersHorizontal className="w-4 h-4" />
          <span>Algorithm Parameters</span>
        </div>

        {selected.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Select at least one algorithm to customize its parameters.
          </p>
        ) : (
          selected.map((algoId) => {
            const algo = algorithms.find((a) => a.id === algoId);
            if (!algo || algo.params.length === 0) return null;

            return (
              <div
                key={algoId}
                className="rounded-xl border border-border bg-muted/20 p-3 space-y-3"
              >
                <div className="flex justify-between items-center text-xs font-semibold text-foreground">
                  <span>{algo.name}</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    {algo.id.replace(/_/g, " ")}
                  </span>
                </div>

                {algo.params.map((def) => {
                  const raw =
                    multi.multiAlgoParams[algoId]?.[def.name];
                  const value =
                    typeof raw === "number" ? raw : def.default;

                  return (
                    <div key={def.name} className="flex flex-col gap-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
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
                            def,
                            Number(e.target.value)
                          )
                        }
                        className="w-full accent-primary"
                      />
                      {def.description && (
                        <p className="text-[11px] text-muted-foreground">
                          {def.description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>
    );
  };

  const multiProps = props as MultiModeProps;

  return (
    <Card className="relative h-full flex flex-col rounded-2xl border border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Brain className="w-4 h-4" />
          Trading Algorithm
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 flex flex-col">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
            {isMulti ? "Algorithms" : "Algorithm"}
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              className="w-full bg-input border border-border text-foreground h-11 rounded-xl pl-9 pr-10 text-sm placeholder-muted-foreground hover:bg-accent/50 transition-colors focus:outline-none"
              placeholder={
                isMulti
                  ? "Search & select algorithms..."
                  : "Search algorithm (e.g. SMA, RSI)..."
              }
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setOpen((o) => !o)}
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""
                  }`}
              />
            </button>
          </div>

          {open && (
            <div className="mt-2 max-h-60 overflow-y-auto rounded-xl border border-border bg-popover shadow-xl custom-scrollbar">
              {loading && (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  Loading algorithms...
                </div>
              )}
              {!loading && filteredAlgos.length === 0 && (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No algorithms found
                </div>
              )}
              {!loading &&
                filteredAlgos.map((algo) => {
                  const selected = selectedIds.includes(algo.id);
                  return (
                    <button
                      key={algo.id}
                      type="button"
                      onClick={() => handleSelect(algo.id)}
                      className={`w-full flex flex-col items-start px-3 py-2 text-sm text-left transition-colors hover:bg-accent/50 ${selected ? "bg-accent/50 text-foreground" : "text-foreground"
                        }`}
                    >
                      <div className="flex justify-between w-full">
                        <span className="font-medium">{algo.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {algo.category}
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-400">
                        {algo.description}
                      </span>
                      {selected && (
                        <div className="mt-1 text-xs text-primary flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Selected
                        </div>
                      )}
                    </button>
                  );
                })}
            </div>
          )}

          {/* Chips multi-mode */}
          {isMulti && multiProps.selectedAlgorithms.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {multiProps.selectedAlgorithms.map((id) => {
                const algo = algorithms.find((a) => a.id === id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleSelect(id)}
                    className="inline-flex items-center gap-1 rounded-full bg-accent/50 px-3 py-1 text-xs text-foreground border border-border hover:bg-accent"
                  >
                    <span>{algo?.name ?? id}</span>
                    <span className="text-muted-foreground text-sm">×</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* overview solo en single-mode */}
        {!isMulti && currentAlgoDef && (
          <div className="mt-4 rounded-xl border border-border bg-muted/20 p-4 space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Algorithm overview
            </h4>
            <div className="flex justify-between text-sm">
              <span className="text-foreground">
                {currentAlgoDef.name}
              </span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                {currentAlgoDef.id.replace(/_/g, " ")}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {currentAlgoDef.description}
            </p>
          </div>
        )}

        {renderAdvancedParams()}
        {renderMultiAdvancedParams()}
      </CardContent>
    </Card>
  );
};

export default AlgorithmSelector;
