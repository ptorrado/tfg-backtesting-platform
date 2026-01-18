
import { HistoryItem, HistoryBatchItem } from "./types";

export function getItemProfitLoss(item: HistoryItem): number {
    if (item.kind === "single") return item.sim.profit_loss;
    return item.simulations.reduce((sum, s) => sum + s.profit_loss, 0);
}

export function getItemCreatedAt(item: HistoryItem): string {
    return item.kind === "single" ? item.sim.created_at : item.created_at;
}

export function getBatchLabels(batch: HistoryBatchItem): {
    title: string;
    subtitle: string;
} {
    const sims = batch.simulations;
    const assetSet = new Set(sims.map((s) => s.asset));
    const algoSet = new Set(sims.map((s) => s.algorithm));

    let deducedTitle = "";
    let deducedSubtitle = "";

    // Case 1: Same asset, varied algos (multi-algo)
    if (assetSet.size === 1 && algoSet.size > 1) {
        deducedTitle = Array.from(assetSet)[0];
        deducedSubtitle = Array.from(algoSet)
            .map((a) => a.replace(/_/g, " "))
            .join(", ");
    }
    // Case 2: Varied assets, same algo (multi-asset)
    else if (assetSet.size > 1 && algoSet.size === 1) {
        deducedTitle = Array.from(algoSet)[0].replace(/_/g, " ");
        deducedSubtitle = Array.from(assetSet).join(", ");
    }
    // Case 3: Mixed
    else {
        deducedTitle = `${sims.length} simulations batch`;
        deducedSubtitle = `${assetSet.size} assets · ${algoSet.size} algos`;
    }

    if (batch.batch_name) {
        return {
            title: batch.batch_name,
            subtitle: deducedTitle,
        };
    }

    return { title: deducedTitle, subtitle: deducedSubtitle };
}
