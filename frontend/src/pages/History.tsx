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

export default function History() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [assetFilter, setAssetFilter] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("created_at");
  const [sortDirection, setSortDirection] =
    useState<SortDirection>("desc");

  const [simToDelete, setSimToDelete] = useState<Simulation | null>(
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

  // Filtro + ordenación
  const processedSimulations: Simulation[] = useMemo(() => {
    const filtered = simulations.filter((s) => {
      if (!assetFilter.trim()) return true;
      return s.asset
        .toLowerCase()
        .includes(assetFilter.trim().toLowerCase());
    });

    const sorted = filtered.slice().sort((a, b) => {
      if (sortBy === "created_at") {
        const tA = new Date(a.created_at).getTime();
        const tB = new Date(b.created_at).getTime();
        return sortDirection === "desc" ? tB - tA : tA - tB;
      } else {
        const pA = a.profit_loss;
        const pB = b.profit_loss;
        return sortDirection === "desc" ? pB - pA : pA - pB;
      }
    });

    return sorted;
  }, [simulations, assetFilter, sortBy, sortDirection]);

  const handleOpenSimulation = (id: number) => {
    navigate(createPageUrl("Results") + `?id=${id}`);
  };

  const handleAskDelete = (
    simulation: Simulation,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setSimToDelete(simulation);
  };

  const handleCancelDelete = () => {
    if (isDeleting) return;
    setSimToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!simToDelete) return;
    try {
      setIsDeleting(true);
      await deleteSimulation(simToDelete.id);
      setSimToDelete(null);
      await queryClient.invalidateQueries({
        queryKey: ["simulations"],
      });
    } catch (err) {
      console.error("Error deleting simulation:", err);
    } finally {
      setIsDeleting(false);
    }
  };

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
        ) : processedSimulations.length === 0 ? (
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
            {processedSimulations.map((simulation: Simulation) => {
              const isProfit = simulation.profit_loss >= 0;

              return (
                <Card
                  key={simulation.id}
                  className="glass-card border-white/5 bg-[#111827]/90 hover:border-white/10 transition-all duration-200 cursor-pointer group overflow-hidden rounded-2xl"
                  onClick={() => handleOpenSimulation(simulation.id)}
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
                            {simulation.asset}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {simulation.algorithm.replace(/_/g, " ")}
                          </p>
                        </div>
                      </div>

                      {/* Botón eliminar */}
                      <button
                        className="text-gray-500 hover:text-red-400 transition-colors rounded-full p-1 hover:bg-red-500/10"
                        onClick={(e) => handleAskDelete(simulation, e)}
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
                          {Math.abs(simulation.profit_loss).toFixed(2)}
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
                            simulation.profit_loss_percentage
                          ).toFixed(2)}
                          %
                        </Badge>
                      </div>

                      {/* Periodo en cards */}
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Period</span>
                        <span className="text-xs text-gray-300">
                          {format(
                            new Date(simulation.start_date),
                            "yyyy/MM/dd"
                          )}{" "}
                          -{" "}
                          {format(
                            new Date(simulation.end_date),
                            "yyyy/MM/dd"
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" strokeWidth={2} />
                        {format(
                          new Date(simulation.created_at),
                          "MMM d, yyyy"
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" strokeWidth={2} />
                        ${simulation.initial_capital.toLocaleString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          /* ==== List view (compact) ==== */
          <div className="overflow-hidden rounded-2xl border glass-card border-white/10 bg-[#111827]/90">
            {/* Header row */}
            <div className="grid grid-cols-5 px-4 py-2 text-sm font-semibold text-gray-300 border-b border-white/10 bg-black/20">
              <span>Created</span>
              <span>Period</span>
              <span>Asset / Algo</span>
              <span className="text-right">Initial</span>
              <span className="text-right">P&amp;L</span>
            </div>

            {/* Rows */}
            {processedSimulations.map((simulation: Simulation) => {
              const isProfit = simulation.profit_loss >= 0;

              return (
                <button
                  key={simulation.id}
                  onClick={() => handleOpenSimulation(simulation.id)}
                  className="w-full grid grid-cols-5 px-4 py-2 text-sm text-gray-200 hover:bg-white/5 transition"
                >
                  {/* Fecha de creación */}
                  <span className="text-left">
                    {format(
                      new Date(simulation.created_at),
                      "yyyy-MM-dd"
                    )}
                  </span>

                  {/* Periodo yyyy/MM/dd - yyyy/MM/dd */}
                  <span className="text-left">
                    {format(
                      new Date(simulation.start_date),
                      "yyyy/MM/dd"
                    )}{" "}
                    -{" "}
                    {format(
                      new Date(simulation.end_date),
                      "yyyy/MM/dd"
                    )}
                  </span>

                  {/* Asset / Algo */}
                  <span className="text-left">
                    <span className="block font-medium text-gray-100">
                      {simulation.asset}
                    </span>
                    <span className="block text-xs text-gray-500">
                      {simulation.algorithm.replace(/_/g, " ")}
                    </span>
                  </span>

                  {/* Capital inicial */}
                  <span className="text-right text-gray-200">
                    ${simulation.initial_capital.toLocaleString()}
                  </span>

                  {/* P&L */}
                  <span
                    className={`text-right font-semibold ${
                      isProfit ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {isProfit ? "+" : "-"}$
                    {Math.abs(simulation.profit_loss).toFixed(2)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de confirmación de borrado */}
      {simToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#020617] border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-gray-100 mb-2">
              Delete simulation
            </h2>
            <p className="text-sm text-gray-300 mb-4">
              Are you sure you want to delete this simulation for{" "}
              <span className="font-semibold">{simToDelete.asset}</span>?
              <br />
              <span className="text-red-400">
                This action cannot be undone.
              </span>
            </p>

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
