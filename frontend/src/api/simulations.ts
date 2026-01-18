// src/api/simulations.ts
import { API_BASE_URL } from "./config";

// ===== Tipos de petición =====

export type SimulationMode = "single" | "batch";

export type SimulationRequest = {
  mode: SimulationMode;
  asset: string;
  algorithm: string;
  start_date: string; // "YYYY-MM-DD"
  end_date: string;   // "YYYY-MM-DD"
  initial_capital: number;
  params: Record<string, number>;
  // Info de batch (solo se usa en modo batch)
  batch_name?: string | null;
  batch_group_id?: string | null;
};

// ===== Tipos de respuesta =====

export type EquityPoint = {
  date: string;   // "YYYY-MM-DD"
  equity: number; // valor de la curva en esa fecha
};

export type Trade = {
  date: string;          // fecha/hora del trade
  type: "buy" | "sell";  // lado de la operación
  price: number;
  quantity: number;
  profit_loss: number;   // P&L de ese trade
};

export type BenchmarkMetrics = {
  name: string;
  final_equity: number;
  total_return: number;  // 0.25 = +25%
  max_drawdown: number;  // 0.15 = 15% o 15
  sharpe_ratio: number;
  equity_curve: EquityPoint[];
};

// Resumen usado en la vista History
export type SimulationSummary = {
  id: number;
  created_at: string;

  asset: string;
  algorithm: string;
  start_date: string;
  end_date: string;
  initial_capital: number;
  profit_loss: number;
  profit_loss_percentage: number;

  // Info de batch
  batch_name?: string | null;
  batch_group_id?: string | null;

  // Parámetros personalizados (si existen)
  params?: Record<string, number> | null;
};

// Detalle completo de una simulación (run y get_simulation)
export type SimulationDetail = {
  id: number;
  status: string; // "completed", "running", etc.

  asset: string;
  algorithm: string;
  start_date: string;
  end_date: string;
  initial_capital: number;

  final_equity: number;
  total_return: number;   // 0.03 = +3% respecto a initial_capital
  max_drawdown: number;   // porcentaje, ej. 15.2 = -15.2%
  sharpe_ratio: number;

  equity_curve: EquityPoint[];
  created_at: string;

  number_of_trades: number;
  winning_trades: number;
  losing_trades: number;
  accuracy: number;       // 0–100 (win rate en %)

  trades: Trade[];

  // Benchmark omnisciente asociado (si existe)
  benchmark?: BenchmarkMetrics | null;

  // Parámetros usados en el backtest (modo avanzado)
  params?: Record<string, number> | null;

  // Info de batch
  batch_name?: string | null;
  batch_group_id?: string | null;
};

// ===== Funciones API =====

export async function runSimulation(
  payload: SimulationRequest
): Promise<SimulationDetail> {
  const res = await fetch(`${API_BASE_URL}/simulations/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error (${res.status}): ${text}`);
  }

  return (await res.json()) as SimulationDetail;
}

export async function getSimulation(id: number): Promise<SimulationDetail> {
  const res = await fetch(`${API_BASE_URL}/simulations/${id}`);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error (${res.status}): ${text}`);
  }

  return (await res.json()) as SimulationDetail;
}

export async function listSimulations(params?: {
  order_by?: "created_at" | "profit_loss";
  direction?: "asc" | "desc";
  asset?: string;
}): Promise<SimulationSummary[]> {
  const query = new URLSearchParams();

  if (params?.order_by) query.set("order_by", params.order_by);
  if (params?.direction) query.set("direction", params.direction);
  if (params?.asset) query.set("asset", params.asset);

  const url =
    query.toString().length > 0
      ? `${API_BASE_URL}/simulations?${query.toString()}`
      : `${API_BASE_URL}/simulations`;

  const res = await fetch(url);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error (${res.status}): ${text}`);
  }

  return (await res.json()) as SimulationSummary[];
}

export async function deleteSimulation(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/simulations/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error (${res.status}): ${text}`);
  }
}
