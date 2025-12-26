// src/pages/History.tsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  History as HistoryIcon,
  LayoutGrid,
  List as ListIcon,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  LineChart,
  X,
} from "lucide-react";

import {
  listSimulations,
  deleteSimulation,
  SimulationSummary,
} from "../api/simulations";
import { createPageUrl } from "../utils";

import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";

type Simulation = SimulationSummary;
type ViewMode = "cards" | "list";
type SortBy = "created_at" | "profit_loss";
type SortDirection = "asc" | "desc";

// ---- Tipos internos para manejar singles vs batches ----

type HistorySingleItem = {
  kind: "single";
  sim: Simulation;
};

type HistoryBatchItem = {
  kind: "batch";
  batch_group_id: string;
  batch_name: string | null;
  created_at: string;
  simulations: Simulation[];
};

type HistoryItem = HistorySingleItem | HistoryBatchItem;

// ---- Helpers ----

function getItemProfitLoss(item: HistoryItem): number {
  if (item.kind === "single") return item.sim.profit_loss;
  return item.simulations.reduce(
    (sum, s) => sum + s.profit_loss,
    0
  );
}

function getItemCreatedAt(item: HistoryItem): string {
  return item.kind === "single" ? item.sim.created_at : item.created_at;
}

function getBatchLabels(batch: HistoryBatchItem): {
  title: string;
  subtitle: string;
} {
  const sims = batch.simulations;
  const assetSet = new Set(sims.map((s) => s.asset));
  const algoSet = new Set(sims.map((s) => s.algorithm));

  let title = batch.batch_name || "";
  let subtitle = "";

  // Caso típico: mismo asset, varios algoritmos (multi-algo)
  if (assetSet.size === 1 && algoSet.size > 1) {
    title = Array.from(assetSet)[0];
    subtitle = Array.from(algoSet)
      .map((a) => a.replace(/_/g, " "))
      .join(", ");
  }
  // Varios assets, mismo algoritmo
  else if (assetSet.size > 1 && algoSet.size === 1) {
    title = Array.from(algoSet)[0].replace(/_/g, " ");
    subtitle = Array.from(assetSet).join(", ");
  }
  // Mezcla o batch_name arbitrario
  else {
    if (!title) {
      title = `${sims.length} simulations batch`;
    }
    subtitle = `${assetSet.size} assets · ${algoSet.size} algos`;
  }

  return { title, subtitle };
}

export default function History() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [assetFilter, setAssetFilter] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("created_at");
  const [sortDirection, setSortDirection] =
    useState<SortDirection>("desc");

  const [itemToDelete, setItemToDelete] = useState<HistoryItem | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    data: simulations = [],
    isLoading,
    isError,
  } = useQuery<Simulation[]>({
    queryKey: ["simulations"],
    queryFn: () => listSimulations(),
  });

  const getAssetIcon = () => (
    <LineChart className="w-6 h-6 text-gray-400" strokeWidth={1.5} />
  );

  // ====== Filtro + agrupación por batch + ordenación ======
  const processedItems: HistoryItem[] = useMemo(() => {
    // 1) Separamos singles y agrupamos por batch_group_id
    const batchMap = new Map<string, Simulation[]>();
    const singles: Simulation[] = [];

    for (const sim of simulations) {
      if (sim.batch_group_id) {
        const key = sim.batch_group_id;
        const arr = batchMap.get(key) || [];
        arr.push(sim);
        batchMap.set(key, arr);
      } else {
        singles.push(sim);
      }
    }

    const items: HistoryItem[] = [];

    // 2) Metemos singles como items
    singles.forEach((sim) => {
      items.push({ kind: "single", sim });
    });

    // 3) Metemos batches
    Array.from(batchMap.entries()).forEach(
      ([groupId, simsInBatchRaw]) => {
        if (!simsInBatchRaw.length) return;

        // Ordenamos dentro del batch por created_at para tener fechas consistentes
        const sims = [...simsInBatchRaw].sort(
          (a, b) =>
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime()
        );

        const created_at = sims[0].created_at;
        const batch_name = sims[0].batch_name ?? null;

        items.push({
          kind: "batch",
          batch_group_id: groupId,
          batch_name,
          created_at,
          simulations: sims,
        });
      }
    );

    // 4) Filtro por asset (si se ha puesto algo)
    const filtered = items.filter((item) => {
      if (!assetFilter.trim()) return true;
      const needle = assetFilter.trim().toLowerCase();

      if (item.kind === "single") {
        return item.sim.asset.toLowerCase().includes(needle);
      } else {
        return item.simulations.some((s) =>
          s.asset.toLowerCase().includes(needle)
        );
      }
    });

    // 5) Ordenación
    const sorted = filtered.slice().sort((a, b) => {
      if (sortBy === "created_at") {
        const tA = new Date(getItemCreatedAt(a)).getTime();
        const tB = new Date(getItemCreatedAt(b)).getTime();
        return sortDirection === "desc" ? tB - tA : tA - tB;
      } else {
        const pA = getItemProfitLoss(a);
        const pB = getItemProfitLoss(b);
        return sortDirection === "desc" ? pB - pA : pA - pB;
      }
    });

    return sorted;
  }, [simulations, assetFilter, sortBy, sortDirection]);

  // ====== Navegación ======

  const handleOpenSingle = (id: number) => {
    navigate(createPageUrl("Results") + `?id=${id}`);
  };

  const handleOpenBatch = (batch: HistoryBatchItem) => {
    const { title } = getBatchLabels(batch);
    const ids = batch.simulations.map((s) => s.id).join(",");
    const url =
      createPageUrl("Results") +
      `?ids=${ids}&batchName=${encodeURIComponent(title)}`;
    navigate(url);
  };

  // ====== Borrado ======

  const handleAskDeleteSingle = (
    sim: Simulation,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setItemToDelete({ kind: "single", sim });
  };

  const handleAskDeleteBatch = (
    batch: HistoryBatchItem,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setItemToDelete(batch);
  };

  const handleCancelDelete = () => {
    if (isDeleting) return;
    setItemToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      setIsDeleting(true);

      if (itemToDelete.kind === "single") {
        await deleteSimulation(itemToDelete.sim.id);
      } else {
        await Promise.all(
          itemToDelete.simulations.map((s) =>
            deleteSimulation(s.id)
          )
        );
      }

      setItemToDelete(null);
      await queryClient.invalidateQueries({
        queryKey: ["simulations"],
      });
    } catch (err) {
      console.error("Error deleting simulation(s):", err);
    } finally {
      setIsDeleting(false);
    }
  };

  // =========================================================

  return (
    <div className="min-h-screen bg-[#0f1419] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header + toggle */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-100 mb-2">
              Simulation History
            </h1>
            <p className="text-gray-400 text-sm">
              Review past backtesting results and performance metrics
            </p>
          </div>

          <div className="inline-flex items-center glass-card rounded-full bg-[#111827]/95 p-1 shadow-lg shadow-black/40 border border-white/10">
            <button
              className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
                viewMode === "cards"
                  ? "bg-white text-gray-900"
                  : "text-gray-300 hover:text-white"
              }`}
              onClick={() => setViewMode("cards")}
            >
              <LayoutGrid
                className={`w-4 h-4 ${
                  viewMode === "cards" ? "text-gray-900" : "text-gray-400"
                }`}
                strokeWidth={1.8}
              />
              Cards
            </button>
            <button
              className={`ml-1 flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
                viewMode === "list"
                  ? "bg-white text-gray-900"
                  : "text-gray-300 hover:text-white"
              }`}
              onClick={() => setViewMode("list")}
            >
              <ListIcon
                className={`w-4 h-4 ${
                  viewMode === "list" ? "text-gray-900" : "text-gray-400"
                }`}
                strokeWidth={1.8}
              />
              List
            </button>
          </div>
        </div>

        {/* Filtros y orden */}
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Filter by asset:</span>
            <input
              type="text"
              value={assetFilter}
              onChange={(e) => setAssetFilter(e.target.value)}
              placeholder="AAPL, BTCUSD, EURUSD..."
              className="bg-[#020617]/80 border border-white/10 rounded-full px-3 py-1.5 text-xs text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/60"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="bg-[#020617]/80 border border-white/10 rounded-full px-3 py-1.5 text-xs text-gray-100 focus:outline-none focus:border-emerald-500/60"
            >
              <option value="created_at">Date</option>
              <option value="profit_loss">P&amp;L</option>
            </select>
            <button
              onClick={() =>
                setSortDirection((prev) =>
                  prev === "desc" ? "asc" : "desc"
                )
              }
              className="flex items-center gap-1 bg-[#020617]/80 border border-white/10 rounded-full px-3 py-1.5 text-xs text-gray-100 hover:border-emerald-500/60 transition-colors"
            >
              {sortDirection === "desc" ? (
                <>
                  <TrendingDown className="w-3 h-3" strokeWidth={2} />
                  <span>Desc</span>
                </>
              ) : (
                <>
                  <TrendingUp className="w-3 h-3" strokeWidth={2} />
                  <span>Asc</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Loading / error / contenido */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-56 bg-white/5 rounded-2xl" />
            ))}
          </div>
        ) : isError ? (
          <Card className="glass-card border-red-500/30 bg-red-500/5">
            <CardContent className="p-6 text-center">
              <p className="text-red-300 text-sm">
                Error loading simulations. Please try again.
              </p>
            </CardContent>
          </Card>
        ) : processedItems.length === 0 ? (
          <Card className="glass-card border-white/5 bg-[#111827]/80">
            <CardContent className="p-12 text-center">
              <HistoryIcon
                className="w-12 h-12 text-gray-600 mx-auto mb-4"
                strokeWidth={1.5}
              />
              <h3 className="text-lg font-semibold text-gray-300 mb-2">
                No simulations yet
              </h3>
              <p className="text-gray-500 text-sm">
                Run your first simulation to see results here
              </p>
            </CardContent>
          </Card>
        ) : viewMode === "cards" ? (
          /* ==== Cards view ==== */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {processedItems.map((item) => {
              if (item.kind === "single") {
                const sim = item.sim;
                const isProfit = sim.profit_loss >= 0;

                return (
                  <Card
                    key={sim.id}
                    className="glass-card border-white/5 bg-[#111827]/90 hover:border-white/10 transition-all duration-200 cursor-pointer group overflow-hidden rounded-2xl"
                    onClick={() => handleOpenSingle(sim.id)}
                  >
                    <div
                      className={`h-[3px] ${
                        isProfit ? "bg-emerald-500" : "bg-red-500"
                      } rounded-t-2xl`}
                    />
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div>{getAssetIcon()}</div>
                          <div>
                            <h3 className="font-semibold text-gray-100 group-hover:text-emerald-400 transition-colors">
                              {sim.asset}
                            </h3>
                            <p className="text-xs text-gray-500">
                              {sim.algorithm.replace(/_/g, " ")}
                            </p>
                          </div>
                        </div>

                        {/* Botón eliminar single */}
                        <button
                          className="text-gray-500 hover:text-red-400 transition-colors rounded-full p-1 hover:bg-red-500/10"
                          onClick={(e) => handleAskDeleteSingle(sim, e)}
                          aria-label="Delete simulation"
                        >
                          <X className="w-4 h-4" strokeWidth={1.8} />
                        </button>
                      </div>

                      <div className="space-y-2 mb-4 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">P&amp;L</span>
                          <span
                            className={`font-semibold ${
                              isProfit ? "text-green-400" : "text-red-400"
                            }`}
                          >
                            {isProfit ? (
                              <TrendingUp
                                className="w-3 h-3 inline mr-1"
                                strokeWidth={2}
                              />
                            ) : (
                              <TrendingDown
                                className="w-3 h-3 inline mr-1"
                                strokeWidth={2}
                              />
                            )}
                            {isProfit ? "+" : "-"}$
                            {Math.abs(sim.profit_loss).toFixed(2)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Return</span>
                          <Badge
                            variant="outline"
                            className={
                              isProfit
                                ? "bg-green-500/10 text-green-400 border-green-500/30"
                                : "bg-red-500/10 text-red-400 border-red-500/30"
                            }
                          >
                            {isProfit ? "+" : "-"}
                            {Math.abs(
                              sim.profit_loss_percentage
                            ).toFixed(2)}
                            %
                          </Badge>
                        </div>

                        {/* Periodo en cards */}
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Period</span>
                          <span className="text-xs text-gray-300">
                            {format(
                              new Date(sim.start_date),
                              "yyyy/MM/dd"
                            )}{" "}
                            -{" "}
                            {format(
                              new Date(sim.end_date),
                              "yyyy/MM/dd"
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" strokeWidth={2} />
                          {format(
                            new Date(sim.created_at),
                            "MMM d, yyyy"
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" strokeWidth={2} />
                          ${sim.initial_capital.toLocaleString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              } else {
                // -------- Batch card --------
                const batch = item;
                const { title, subtitle } = getBatchLabels(batch);

                const totalPnl = getItemProfitLoss(batch);
                const totalInitial = batch.simulations.reduce(
                  (sum, s) => sum + s.initial_capital,
                  0
                );
                const totalReturnPct =
                  totalInitial !== 0
                    ? (totalPnl / totalInitial) * 100
                    : 0;
                const isProfit = totalPnl >= 0;

                const numSims = batch.simulations.length;
                const startTs = Math.min(
                  ...batch.simulations.map((s) =>
                    new Date(s.start_date).getTime()
                  )
                );
                const endTs = Math.max(
                  ...batch.simulations.map((s) =>
                    new Date(s.end_date).getTime()
                  )
                );
                const periodStart = new Date(startTs);
                const periodEnd = new Date(endTs);

                return (
                  <Card
                    key={batch.batch_group_id}
                    className="glass-card border-white/5 bg-[#111827]/90 hover:border-white/10 transition-all duration-200 cursor-pointer group overflow-hidden rounded-2xl"
                    onClick={() => handleOpenBatch(batch)}
                  >
                    <div
                      className={`h-[3px] ${
                        isProfit ? "bg-emerald-500" : "bg-red-500"
                      } rounded-t-2xl`}
                    />
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div>{getAssetIcon()}</div>
                          <div>
                            <h3 className="font-semibold text-gray-100 group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                              {title}
                              <Badge
                                variant="outline"
                                className="text-[10px] bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                              >
                                Batch • {numSims} sims
                              </Badge>
                            </h3>
                            {subtitle && (
                              <p className="text-xs text-gray-500">
                                {subtitle}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Botón eliminar batch */}
                        <button
                          className="text-gray-500 hover:text-red-400 transition-colors rounded-full p-1 hover:bg-red-500/10"
                          onClick={(e) => handleAskDeleteBatch(batch, e)}
                          aria-label="Delete batch"
                        >
                          <X className="w-4 h-4" strokeWidth={1.8} />
                        </button>
                      </div>

                      <div className="space-y-2 mb-4 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Total P&amp;L</span>
                          <span
                            className={`font-semibold ${
                              isProfit ? "text-green-400" : "text-red-400"
                            }`}
                          >
                            {isProfit ? (
                              <TrendingUp
                                className="w-3 h-3 inline mr-1"
                                strokeWidth={2}
                              />
                            ) : (
                              <TrendingDown
                                className="w-3 h-3 inline mr-1"
                                strokeWidth={2}
                              />
                            )}
                            {isProfit ? "+" : "-"}$
                            {Math.abs(totalPnl).toFixed(2)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">
                            Total return (agg.)
                          </span>
                          <Badge
                            variant="outline"
                            className={
                              isProfit
                                ? "bg-green-500/10 text-green-400 border-green-500/30"
                                : "bg-red-500/10 text-red-400 border-red-500/30"
                            }
                          >
                            {isProfit ? "+" : "-"}
                            {Math.abs(totalReturnPct).toFixed(2)}%
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Period</span>
                          <span className="text-xs text-gray-300">
                            {format(periodStart, "yyyy/MM/dd")} -{" "}
                            {format(periodEnd, "yyyy/MM/dd")}
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" strokeWidth={2} />
                          {format(
                            new Date(batch.created_at),
                            "MMM d, yyyy"
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" strokeWidth={2} />
                          $
                          {totalInitial.toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              }
            })}
          </div>
        ) : (
          /* ==== List view (compact) ==== */
          <div className="overflow-hidden rounded-2xl border glass-card border-white/10 bg-[#111827]/90">
            {/* Header row */}
            <div className="grid grid-cols-5 px-4 py-2 text-sm font-semibold text-gray-300 border-b border-white/10 bg-black/20">
              <span>Created</span>
              <span>Period</span>
              <span>Asset / Algo / Batch</span>
              <span className="text-right">Initial</span>
              <span className="text-right">P&amp;L</span>
            </div>

            {/* Rows */}
            {processedItems.map((item) => {
              if (item.kind === "single") {
                const sim = item.sim;
                const isProfit = sim.profit_loss >= 0;

                return (
                  <button
                    key={sim.id}
                    onClick={() => handleOpenSingle(sim.id)}
                    className="w-full grid grid-cols-5 px-4 py-2 text-sm text-gray-200 hover:bg:white/5 hover:bg-white/5 transition"
                  >
                    {/* Fecha de creación */}
                    <span className="text-left">
                      {format(
                        new Date(sim.created_at),
                        "yyyy-MM-dd"
                      )}
                    </span>

                    {/* Periodo */}
                    <span className="text-left">
                      {format(
                        new Date(sim.start_date),
                        "yyyy/MM/dd"
                      )}{" "}
                      -{" "}
                      {format(
                        new Date(sim.end_date),
                        "yyyy/MM/dd"
                      )}
                    </span>

                    {/* Asset / Algo */}
                    <span className="text-left">
                      <span className="block font-medium text-gray-100">
                        {sim.asset}
                      </span>
                      <span className="block text-xs text-gray-500">
                        {sim.algorithm.replace(/_/g, " ")}
                      </span>
                    </span>

                    {/* Capital inicial */}
                    <span className="text-right text-gray-200">
                      ${sim.initial_capital.toLocaleString()}
                    </span>

                    {/* P&L */}
                    <span
                      className={`text-right font-semibold ${
                        isProfit ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {isProfit ? "+" : "-"}$
                      {Math.abs(sim.profit_loss).toFixed(2)}
                    </span>
                  </button>
                );
              } else {
                const batch = item;
                const { title, subtitle } = getBatchLabels(batch);
                const totalPnl = getItemProfitLoss(batch);
                const totalInitial = batch.simulations.reduce(
                  (sum, s) => sum + s.initial_capital,
                  0
                );
                const isProfit = totalPnl >= 0;
                const numSims = batch.simulations.length;

                const startTs = Math.min(
                  ...batch.simulations.map((s) =>
                    new Date(s.start_date).getTime()
                  )
                );
                const endTs = Math.max(
                  ...batch.simulations.map((s) =>
                    new Date(s.end_date).getTime()
                  )
                );
                const periodStart = new Date(startTs);
                const periodEnd = new Date(endTs);

                return (
                  <button
                    key={batch.batch_group_id}
                    onClick={() => handleOpenBatch(batch)}
                    className="w-full grid grid-cols-5 px-4 py-2 text-sm text-gray-200 hover:bg-white/5 transition"
                  >
                    <span className="text-left">
                      {format(
                        new Date(batch.created_at),
                        "yyyy-MM-dd"
                      )}
                    </span>

                    <span className="text-left">
                      {format(periodStart, "yyyy/MM/dd")} -{" "}
                      {format(periodEnd, "yyyy/MM/dd")}
                    </span>

                    <span className="text-left">
                      <span className="block font-medium text-gray-100">
                        {title}
                      </span>
                      <span className="block text-xs text-gray-500">
                        Batch • {numSims} sims
                        {subtitle ? ` · ${subtitle}` : ""}
                      </span>
                    </span>

                    <span className="text-right text-gray-200">
                      $
                      {totalInitial.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </span>

                    <span
                      className={`text-right font-semibold ${
                        isProfit ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {isProfit ? "+" : "-"}$
                      {Math.abs(totalPnl).toFixed(2)}
                    </span>
                  </button>
                );
              }
            })}
          </div>
        )}
      </div>

      {/* Modal de confirmación de borrado (single o batch) */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#020617] border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-gray-100 mb-2">
              {itemToDelete.kind === "single"
                ? "Delete simulation"
                : "Delete batch"}
            </h2>

            {itemToDelete.kind === "single" ? (
              <p className="text-sm text-gray-300 mb-4">
                Are you sure you want to delete this simulation for{" "}
                <span className="font-semibold">
                  {itemToDelete.sim.asset}
                </span>{" "}
                (
                {itemToDelete.sim.algorithm.replace(/_/g, " ")}
                )?
                <br />
                <span className="text-red-400">
                  This action cannot be undone.
                </span>
              </p>
            ) : (
              <p className="text-sm text-gray-300 mb-4">
                Are you sure you want to delete this batch with{" "}
                <span className="font-semibold">
                  {itemToDelete.simulations.length} simulations
                </span>
                ?
                <br />
                <span className="text-red-400">
                  All simulations in this batch will be removed. This
                  action cannot be undone.
                </span>
              </p>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelDelete}
                disabled={isDeleting}
                className="px-4 py-1.5 text-sm rounded-full border border-white/15 text-gray-200 hover:bg-white/5 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-1.5 text-sm rounded-full bg-red-500/90 text-white hover:bg-red-500 disabled:opacity-60"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
