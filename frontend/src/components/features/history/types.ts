
import { SimulationSummary } from "../../../api/simulations";

export type Simulation = SimulationSummary;

export type HistorySingleItem = {
    kind: "single";
    sim: Simulation;
};

export type HistoryBatchItem = {
    kind: "batch";
    batch_group_id: string;
    batch_name: string | null;
    created_at: string;
    simulations: Simulation[];
};

export type HistoryItem = HistorySingleItem | HistoryBatchItem;

export type ViewMode = "cards" | "list";
export type SortBy = "created_at" | "profit_loss";
export type SortDirection = "asc" | "desc";
