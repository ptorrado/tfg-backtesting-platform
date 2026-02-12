import { Trash2, X } from "lucide-react";
import React from "react";
import { format } from "date-fns";
import { Badge } from "../../ui/badge";

import { HistoryItem, HistoryBatchItem, Simulation } from "./types";
import { getBatchLabels, getItemProfitLoss } from "./utils";

interface HistoryTableProps {
    items: HistoryItem[];
    onOpenSingle: (id: number) => void;
    onOpenBatch: (batch: HistoryBatchItem) => void;
    onAskDeleteSingle: (sim: Simulation, e: React.MouseEvent) => void;
    onAskDeleteBatch: (batch: HistoryBatchItem, e: React.MouseEvent) => void;
}

export function HistoryTable({
    items,
    onOpenSingle,
    onOpenBatch,
    onAskDeleteSingle,
    onAskDeleteBatch,
}: HistoryTableProps) {
    return (
        <div className="overflow-hidden rounded-2xl border glass-card border-border bg-card/90">
            {/* Header row */}
            <div className="grid grid-cols-[1fr_1.5fr_2fr_1fr_1fr_40px] px-4 py-2 text-sm font-semibold text-muted-foreground border-b border-border bg-secondary/50">
                <span>Created</span>
                <span>Period</span>
                <span>Asset / Algo / Batch</span>
                <span className="text-right">Initial</span>
                <span className="text-right">P&L</span>
                <span className="text-right"></span>
            </div>

            {/* Rows */}
            {items.map((item) => {
                if (item.kind === "single") {
                    const sim = item.sim;
                    const isProfit = sim.profit_loss >= 0;

                    return (
                        <div
                            key={sim.id}
                            onClick={() => onOpenSingle(sim.id)}
                            className="w-full grid grid-cols-[1fr_1.5fr_2fr_1fr_1fr_40px] px-4 py-2 text-sm text-foreground hover:bg-muted/50 transition cursor-pointer"
                        >
                            <span className="text-left flex items-center">
                                {format(new Date(sim.created_at), "yyyy-MM-dd")}
                            </span>
                            <span className="text-left flex items-center">
                                {format(new Date(sim.start_date), "yyyy/MM/dd")} -{" "}
                                {format(new Date(sim.end_date), "yyyy/MM/dd")}
                            </span>
                            <span className="text-left flex flex-col justify-center">
                                <span className="block font-medium text-foreground flex items-center gap-2">
                                    {sim.asset}
                                    {sim.params && Object.keys(sim.params).length > 0 && (
                                        <Badge variant="outline" className="text-[10px] bg-orange-500/10 text-orange-400 border-orange-500/30 px-1.5 py-0 h-5">
                                            Advanced
                                        </Badge>
                                    )}
                                </span>
                                <span className="block text-xs text-muted-foreground">
                                    {sim.algorithm.replace(/_/g, " ")}
                                </span>
                            </span>
                            <span className="text-right text-foreground flex items-center justify-end">
                                {sim.initial_capital.toLocaleString()} $
                            </span>
                            <span
                                className={`text-right font-semibold flex items-center justify-end ${isProfit ? "text-emerald-400" : "text-destructive"
                                    }`}
                            >
                                {isProfit ? "+" : "-"}{Math.abs(sim.profit_loss).toFixed(2)} $
                            </span>
                            <div className="flex items-center justify-end">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onAskDeleteSingle(sim, e);
                                    }}
                                    className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    );
                } else {
                    const batch = item;
                    const { title, subtitle } = getBatchLabels(batch);
                    const totalPnl = getItemProfitLoss(batch);
                    const batchInitial = batch.simulations[0]?.initial_capital || 0;
                    const isProfit = totalPnl >= 0;
                    const numSims = batch.simulations.length;

                    const startTs = Math.min(
                        ...batch.simulations.map((s) => new Date(s.start_date).getTime())
                    );
                    const endTs = Math.max(
                        ...batch.simulations.map((s) => new Date(s.end_date).getTime())
                    );
                    const periodStart = new Date(startTs);
                    const periodEnd = new Date(endTs);

                    return (
                        <div
                            key={batch.batch_group_id}
                            onClick={() => onOpenBatch(batch)}
                            className="w-full grid grid-cols-[1fr_1.5fr_2fr_1fr_1fr_40px] px-4 py-2 text-sm text-foreground hover:bg-muted/50 transition cursor-pointer"
                        >
                            <span className="text-left flex items-center">
                                {format(new Date(batch.created_at), "yyyy-MM-dd")}
                            </span>
                            <span className="text-left flex items-center">
                                {format(periodStart, "yyyy/MM/dd")} -{" "}
                                {format(periodEnd, "yyyy/MM/dd")}
                            </span>
                            <span className="text-left flex flex-col justify-center">
                                <span className="block font-medium text-foreground flex items-center gap-2 flex-wrap">
                                    {title}
                                    <Badge variant="outline" className="text-[10px] bg-violet-500/10 text-violet-300 border-violet-500/30 px-1.5 py-0 h-5">
                                        Batch • {numSims} sims
                                    </Badge>
                                    {batch.simulations.some(s => s.params && Object.keys(s.params).length > 0) && (
                                        <Badge variant="outline" className="text-[10px] bg-orange-500/10 text-orange-400 border-orange-500/30 px-1.5 py-0 h-5">
                                            Advanced
                                        </Badge>
                                    )}
                                </span>
                                <span className="block text-xs text-muted-foreground">
                                    {subtitle ? subtitle : "Multiple assets/algorithms"}
                                </span>
                            </span>
                            <span className="text-right text-foreground flex items-center justify-end">
                                {batchInitial.toLocaleString(undefined, { maximumFractionDigits: 0 })} $
                            </span>
                            <span
                                className={`text-right font-semibold flex items-center justify-end ${isProfit ? "text-emerald-400" : "text-destructive"
                                    }`}
                            >
                                {isProfit ? "+" : "-"}{Math.abs(totalPnl).toFixed(2)} $
                            </span>
                            <div className="flex items-center justify-end">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onAskDeleteBatch(batch, e);
                                    }}
                                    className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    );
                }
            })}
        </div>
    );
}
