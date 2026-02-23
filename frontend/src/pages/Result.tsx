import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
} from "lucide-react";

import {
  SimulationDetail,
  EquityPoint as ApiEquityPoint,
  getSimulation,
} from "../api/simulations";
import { createPageUrl } from "../utils";

import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";

import BatchComparison, {
  SimulationForBatch,
} from "../components/features/results/BatchComparison";
import SingleSimulationDashboard from "../components/features/results/SingleSimulationDashboard";

// ===== Tipos internos =====

interface EquityPoint {
  date: string;
  value: number;
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

/**
 * Result
 * 
 * Page component that displays the results of one or multiple simulations.
 * Handles fetching simulation data by ID(s) and switching between single and batch views.
 */
export default function Result() {
  const navigate = useNavigate();

  const [simulations, setSimulations] = useState<SimulationDetail[]>([]);
  const [batchName, setBatchName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargamos la(s) simulación(es) a partir de ?id= o ?ids=
  useEffect(() => {
    const load = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const idsParam = params.get("ids");
        const idParam = params.get("id");
        const batchNameParam = params.get("batchName");

        if (batchNameParam) {
          setBatchName(batchNameParam);
        }

        let ids: number[] = [];

        if (idsParam) {
          ids = idsParam
            .split(",")
            .map((v) => Number(v.trim()))
            .filter((n) => !Number.isNaN(n));
        }

        if (ids.length === 0 && idParam) {
          const id = Number(idParam);
          if (!Number.isNaN(id)) {
            ids = [id];
          }
        }

        if (ids.length === 0) {
          setError("Missing simulation id");
          setLoading(false);
          return;
        }

        const sims = await Promise.all(ids.map((id) => getSimulation(id)));
        setSimulations(sims);

        if (!batchNameParam && sims.length > 0) {
          const bn = sims[0].batch_name;
          if (bn) {
            setBatchName(bn);
          }
        }
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
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64 bg-accent/50" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 bg-accent/50" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ---------- Error / nada ----------
  if (error || simulations.length === 0) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            Simulation not found. Run a new one from the simulator.
          </p>
          <Button onClick={() => navigate(createPageUrl("Simulator"))}>
            Go to Simulator
          </Button>
        </div>
      </div>
    );
  }

  const isBatchMode = simulations.length > 1;
  const sim = simulations[0];

  // ======================= SINGLE SIM =======================
  if (!isBatchMode) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start justify-between mb-8">
            <div>
              <Button
                variant="ghost"
                onClick={() => navigate(createPageUrl("History"))}
                className="mb-3 text-muted-foreground hover:text-foreground hover:bg-accent/50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" strokeWidth={2} />
                Back to History
              </Button>
              <h1 className="text-3xl font-bold text-foreground mb-1">
                Simulation Results
              </h1>
              <p className="text-muted-foreground text-sm">
                {sim.asset} • {sim.algorithm.replace(/_/g, " ")}
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={() => navigate(createPageUrl("Simulator"))}
              className="text-muted-foreground hover:text-foreground hover:bg-accent/50"
            >
              <Plus className="w-4 h-4 mr-2" strokeWidth={2} />
              New Simulation
            </Button>
          </div>

          <SingleSimulationDashboard simulation={sim} />
        </div>
      </div>
    )
  }

  // ======================= BATCH MODE =======================

  const batchLabel =
    batchName || sim.batch_name || "Batch comparison";

  const simulationsForBatch: SimulationForBatch[] =
    simulations.map((s) => {
      const equityCurve: EquityPoint[] = s.equity_curve.map(
        (p: ApiEquityPoint) => ({
          date: p.date,
          value: p.equity,
        })
      );

      if (equityCurve.length === 0) {
        equityCurve.push({
          date: s.start_date,
          value: s.initial_capital,
        });
      }

      const initialCapital = s.initial_capital;
      const finalValue =
        s.final_equity ??
        equityCurve[equityCurve.length - 1].value ??
        initialCapital;

      const profitLoss = finalValue - initialCapital;
      const profitLossPct =
        initialCapital !== 0 ? (profitLoss / initialCapital) * 100 : 0;

      let efficiencyRatio = 100;

      if (
        s.benchmark &&
        s.benchmark.equity_curve &&
        s.benchmark.equity_curve.length > 0
      ) {
        const benchmarkFinalEquity = s.benchmark.final_equity;
        efficiencyRatio =
          benchmarkFinalEquity > 0
            ? (finalValue / benchmarkFinalEquity) * 100
            : 0;
      }

      const drawdownMetric =
        typeof s.max_drawdown === "number"
          ? Math.abs(s.max_drawdown) <= 1
            ? s.max_drawdown * 100
            : s.max_drawdown
          : computeMaxDrawdown(equityCurve);

      const sharpeMetric =
        typeof s.sharpe_ratio === "number"
          ? s.sharpe_ratio
          : computeSharpe(equityCurve);

      return {
        id: s.id,
        asset_name: s.asset,
        algorithm: s.algorithm,
        profit_loss: profitLoss,
        profit_loss_percentage: profitLossPct,
        accuracy: s.accuracy ?? 0,
        sharpe_ratio: sharpeMetric,
        max_drawdown: drawdownMetric,
        efficiency_ratio: efficiencyRatio,
        equity_curve: equityCurve,
        params: s.params,
      };
    });

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate(createPageUrl("History"))}
              className="mb-3 text-muted-foreground hover:text-foreground hover:bg-accent/50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" strokeWidth={2} />
              Back to History
            </Button>
            <h1 className="text-3xl font-bold text-foreground mb-1">
              Batch Results
            </h1>
            <p className="text-muted-foreground text-sm">
              {batchLabel} • {simulations.length} simulations
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl("Simulator"))}
            className="text-muted-foreground hover:text-foreground hover:bg-accent/50"
          >
            <Plus className="w-4 h-4 mr-2" strokeWidth={2} />
            New Simulation
          </Button>
        </div>

        <BatchComparison
          simulations={simulationsForBatch}
          allSimulations={simulations}
          batchName={batchLabel}
        />
      </div>
    </div>
  );
}
