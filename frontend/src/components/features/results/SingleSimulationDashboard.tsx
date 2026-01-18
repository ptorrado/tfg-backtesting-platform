import React from "react";
import { motion } from "framer-motion";
import {
    SimulationDetail,
    EquityPoint as ApiEquityPoint,
} from "../../../api/simulations";
import MetricsCard from "./MetricsCard";
import EquityCurveChart from "./EquityCurveChart";
import TradesTable from "./TradesTable";
import BenchmarkComparison from "./BenchmarkComparison";
import DrawdownChart from "./DrawdownChart";
import MonthlyReturnsHeatmap from "./MonthlyReturnsHeatmap";
import KeyRatios from "./KeyRatios";
import ConfigCard from "./ConfigCard";

interface EquityPoint {
    date: string;
    value: number;
}

export interface TradeRow {
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

interface SingleSimulationDashboardProps {
    simulation: SimulationDetail;
}

export default function SingleSimulationDashboard({ simulation: sim }: SingleSimulationDashboardProps) {
    const equityCurve = sim.equity_curve.map(
        (p: ApiEquityPoint) => ({
            date: p.date,
            value: p.equity,
        })
    );

    // Data for new components (expects 'equity' property)
    const equityData = sim.equity_curve.map((p: ApiEquityPoint) => ({
        date: p.date,
        equity: p.equity
    }));

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
    // const profitLossPct = initialCapital !== 0 ? (profitLoss / initialCapital) * 100 : 0;

    const accuracy = sim.accuracy ?? 0;

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
            : computeSharpe(equityCurve); // Fallback calculation

    // Benchmark real (omniscient_benchmark) si está disponible
    const benchmark = sim.benchmark ?? null;

    let benchmarkEquityCurve: EquityPoint[] = equityCurve;
    let benchmarkProfitLoss = profitLoss;
    let efficiencyRatio = 100;

    if (
        benchmark &&
        benchmark.equity_curve &&
        benchmark.equity_curve.length > 0
    ) {
        benchmarkEquityCurve = benchmark.equity_curve.map((p) => ({
            date: p.date,
            value: p.equity,
        }));

        const benchmarkFinalEquity = benchmark.final_equity;
        benchmarkProfitLoss = benchmarkFinalEquity - initialCapital;

        // Eficiencia: qué % del rendimiento del omnisciente capturó tu estrategia
        efficiencyRatio =
            benchmarkFinalEquity > 0
                ? (finalValue / benchmarkFinalEquity) * 100
                : 0;
    }

    // Adaptamos trades del backend al formato de la tabla
    const trades: TradeRow[] = (sim.trades ?? []).map((t) => ({
        date: t.date,
        type: t.type,
        price: t.price,
        quantity: t.quantity,
        profit_loss: t.profit_loss,
    }));

    const totalReturnPct = sim.total_return ? sim.total_return * 100 : (profitLoss / initialCapital) * 100;


    return (
        <div className="space-y-6">
            {/* Row 1: Key Ratios */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <KeyRatios
                    sharpeRatio={sharpeMetric}
                    winRate={accuracy}
                    maxDrawdown={maxDrawdownMetric}
                    totalReturn={totalReturnPct}
                />
            </motion.div>

            {/* Row 1.5: Config (if exists) */}
            {sim.params && Object.keys(sim.params).length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                >
                    <ConfigCard params={sim.params} />
                </motion.div>
            )}

            {/* Row 2: Charts (Equity (2/3) + Drawdown (1/3)) */}
            <div className="grid lg:grid-cols-3 gap-6">
                <motion.div
                    className="lg:col-span-2 h-full"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <EquityCurveChart data={equityCurve} />
                </motion.div>
                <motion.div
                    className="h-full"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <DrawdownChart data={equityData} />
                </motion.div>
            </div>

            {/* Row 3: Heatmap */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <MonthlyReturnsHeatmap data={equityData} />
            </motion.div>

            {/* Row 4: Benchmark & Trades */}
            <div className="grid lg:grid-cols-2 gap-6">
                <motion.div
                    className="h-full"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <BenchmarkComparison
                        equityCurve={equityCurve}
                        benchmarkEquityCurve={benchmarkEquityCurve}
                        profitLoss={profitLoss}
                        benchmarkProfitLoss={benchmarkProfitLoss}
                        efficiencyRatio={efficiencyRatio}
                    />
                </motion.div>
                <motion.div
                    className="h-full"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <TradesTable trades={trades} />
                </motion.div>
            </div>
        </div>
    );
}
