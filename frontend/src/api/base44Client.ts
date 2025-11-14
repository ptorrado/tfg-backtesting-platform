// Stub MUY simple para que el front funcione con datos simulados en memoria.
// Más adelante lo sustituirás por llamadas reales a tu backend.

export type Simulation = {
  id: string
  is_batch?: boolean
  batch_id?: string
  batch_name?: string
  created_date: string

  asset_type: string
  asset_name: string
  algorithm: string
  algorithm_params: Record<string, any>
  start_date: string
  end_date: string
  initial_investment: number
  final_value: number
  profit_loss: number
  profit_loss_percentage: number
  number_of_trades: number
  winning_trades: number
  losing_trades: number
  accuracy: number
  max_drawdown: number
  sharpe_ratio: number
  equity_curve: { date: string; value: number }[]
  trades: { date: string; type: "buy" | "sell"; price: number; quantity: number; profit_loss: number }[]
  benchmark_final_value: number
  benchmark_profit_loss: number
  benchmark_profit_loss_percentage: number
  benchmark_equity_curve: { date: string; value: number }[]
  efficiency_ratio: number
}

let memoryDb: Simulation[] = []

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export const base44 = {
  entities: {
    Simulation: {
      async create(data: Omit<Simulation, "id" | "created_date">): Promise<Simulation> {
        const sim: Simulation = {
          ...data,
          id: generateId(),
          created_date: new Date().toISOString(),
        }
        memoryDb.push(sim)
        return sim
      },

      async filter(query: Partial<Simulation>): Promise<Simulation[]> {
        return memoryDb.filter((sim) =>
          Object.entries(query).every(([key, value]) => (sim as any)[key] === value)
        )
      },

      async list(order: string): Promise<Simulation[]> {
        const arr = [...memoryDb]
        if (order === "-created_date") {
          arr.sort(
            (a, b) =>
              new Date(b.created_date).getTime() - new Date(a.created_date).getTime()
          )
        }
        return arr
      },
    },
  },
}
