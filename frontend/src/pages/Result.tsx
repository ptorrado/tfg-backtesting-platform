// src/pages/Result.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Target,
  Activity,
  BarChart3,
  Award,
} from "lucide-react";

import {
  SimulationDetail,
  EquityPoint as ApiEquityPoint,
  getSimulation,
} from "../api/simulations";
import { createPageUrl } from "../utils";

import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";

import MetricsCard from "../components/results/MetricsCard";
import EquityCurveChart from "../components/results/EquityCurveChart";
import TradesTable from "../components/results/TradesTable";
import BenchmarkComparison from "../components/results/BenchmarkComparison";

// ===== Tipos internos =====

interface EquityPoint {
  date: string;
  value: number;
}

interface TradeRow {
  date: string;
  type: "buy" | "sell" | string;
  price: number;
  quantity: number;
  profit_loss: number;
}

// ===== Helpers métricas =====

function computeMaxDrawdown(curve: EquityPoint[]): number {
  if (curve.length === 0) return 0;
  let peak = curve[0].value;
  let maxDd = 0;

  for (const point of curve) {
    if (point.value > peak) peak = point.value;
    const dd = ((peak - point.value) / peak) * 100;
    if (dd > maxDd) maxDd = dd;
  }

  return maxDd;
}

function computeSharpe(curve: EquityPoint[]): number {
  if (curve.length < 2) return 0;

  const returns: number[] = [];
  for (let i = 1; i < curve.length; i++) {
    const prev = curve[i - 1].value;
    const curr = curve[i].value;
    if (prev !== 0) {
      returns.push((curr - prev) / prev);
    }
  }

  if (returns.length === 0) return 0;

  const avg = returns.reduce((acc, r) => acc + r, 0) / returns.length;

  const variance =
    returns.reduce((acc, r) => acc + Math.pow(r - avg, 2), 0) /
    returns.length;

  const stdDev = Math.sqrt(variance);
  if (stdDev === 0) return 0;

  return (avg / stdDev) * Math.sqrt(252); // 252 días de mercado
}

// ===== Componente principal =====

export default function Result() {
  const navigate = useNavigate();

  const [simulation, setSimulation] = useState<SimulationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargamos la simulación a partir del ?id= de la URL
  useEffect(() => {
    const load = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const idParam = params.get("id");

        if (!idParam) {
          setError("Missing simulation id");
          setLoading(false);
          return;
        }

        const id = Number(idParam);
        if (Number.isNaN(id)) {
          setError("Invalid simulation id");
          setLoading(false);
          return;
        }

        const sim = await getSimulation(id);
        setSimulation(sim);
      } catch (e) {
        console.error(e);
        setError("Simulation not found");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // ---------- Loading ----------
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1419] p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64 bg-white/5" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 bg-white/5" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ---------- Error / nada ----------
  if (!simulation || error) {
    return (
      <div className="min-h-screen bg-[#0f1419] p-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">
            Simulation not found. Run a new one from the simulator.
          </p>
          <Button onClick={() => navigate(createPageUrl("Simulator"))}>
            Go to Simulator
          </Button>
        </div>
      </div>
    );
  }

  // ---------- Datos derivados ----------
  const sim = simulation;

  const equityCurve: EquityPoint[] = sim.equity_curve.map(
    (p: ApiEquityPoint) => ({
      date: p.date,
      value: p.equity,
    })
  );

  if (equityCurve.length === 0) {
    equityCurve.push({
      date: sim.start_date,
      value: sim.initial_capital,
    });
  }

  const initialCapital = sim.initial_capital;
  const finalValue =
    equityCurve[equityCurve.length - 1].value ?? initialCapital;

  const profitLoss = finalValue - initialCapital;
  const profitLossPct =
    initialCapital !== 0 ? (profitLoss / initialCapital) * 100 : 0;

  const isProfit = profitLoss >= 0;

  // Métricas de trading desde el backend
  const numberOfTrades = sim.number_of_trades ?? 0;
  const winningTrades = sim.winning_trades ?? 0;
  const losingTrades = sim.losing_trades ?? 0;
  const accuracy = sim.accuracy ?? 0;

  const totalDays =
    Math.ceil(
      (new Date(sim.end_date).getTime() -
        new Date(sim.start_date).getTime()) /
        (1000 * 60 * 60 * 24)
    ) || 1;
  const tradesPerWeek = totalDays > 0 ? (numberOfTrades / totalDays) * 7 : 0;

  // Riesgo: usamos backend y, si falta, calculamos aquí
  let maxDrawdownMetric: number;
  if (typeof sim.max_drawdown === "number") {
    maxDrawdownMetric =
      Math.abs(sim.max_drawdown) <= 1
        ? sim.max_drawdown * 100
        : sim.max_drawdown;
  } else {
    maxDrawdownMetric = computeMaxDrawdown(equityCurve);
  }

  const sharpeMetric =
    typeof sim.sharpe_ratio === "number"
      ? sim.sharpe_ratio
      : computeSharpe(equityCurve);

  // Benchmark ficticio == estrategia
  const benchmarkEquityCurve = equityCurve;
  const benchmarkProfitLoss = profitLoss;
  const efficiencyRatio = 100;

  // Adaptamos trades del backend al formato de la tabla
  const trades: TradeRow[] = (sim.trades ?? []).map((t) => ({
    date: t.date,
    type: t.type,
    price: t.price,
    quantity: t.quantity,
    profit_loss: t.profit_loss,
  }));

  // ======================= Render =======================

  return (
    <div className="min-h-screen bg-[#0f1419] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate(createPageUrl("Simulator"))}
              className="mb-3 text-gray-400 hover:text-gray-200 hover:bg-white/5"
            >
              <ArrowLeft className="w-4 h-4 mr-2" strokeWidth={2} />
              New Simulation
            </Button>
            <h1 className="text-3xl font-bold text-gray-100 mb-1">
              Simulation Results
            </h1>
            <p className="text-gray-400 text-sm">
              {sim.asset} • {sim.algorithm.replace(/_/g, " ")}
            </p>
          </div>
        </div>

        {/* Top metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <MetricsCard
              title="Total Profit/Loss"
              value={`${isProfit ? "+" : ""}$${Math.abs(
                profitLoss
              ).toFixed(2)}`}
              subtitle={`${isProfit ? "+" : ""}${profitLossPct.toFixed(
                2
              )}%`}
              icon={DollarSign}
              isPositive={isProfit}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <MetricsCard
              title="Final Value"
              value={`$${finalValue.toFixed(2)}`}
              subtitle={`From $${initialCapital}`}
              icon={TrendingUp}
              isPositive={isProfit}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <MetricsCard
              title="Win Rate"
              value={accuracy}
              subtitle={`${winningTrades} wins / ${losingTrades} losses`}
              icon={Target}
              isPercentage
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <MetricsCard
              title="Total Trades"
              value={numberOfTrades}
              subtitle={`${tradesPerWeek.toFixed(1)} trades/week`}
              icon={Activity}
            />
          </motion.div>
        </div>

        {/* Benchmark comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <BenchmarkComparison
            equityCurve={equityCurve}
            benchmarkEquityCurve={benchmarkEquityCurve}
            profitLoss={profitLoss}
            benchmarkProfitLoss={benchmarkProfitLoss}
            efficiencyRatio={efficiencyRatio}
          />
        </motion.div>

        {/* Curve + risk metrics */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="lg:col-span-2"
          >
            <EquityCurveChart data={equityCurve} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="space-y-6"
          >
            <MetricsCard
              title="Sharpe Ratio"
              value={sharpeMetric.toFixed(2)}
              subtitle="Risk-adjusted return"
              icon={Award}
              isPositive={sharpeMetric > 1}
            />
            <MetricsCard
              title="Max Drawdown"
              value={maxDrawdownMetric}
              subtitle="Largest peak-to-trough decline"
              icon={BarChart3}
              isPositive={false}
              isPercentage
            />
          </motion.div>
        </div>

        {/* Trades table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <TradesTable trades={trades} />
        </motion.div>
      </div>
    </div>
  );
}
