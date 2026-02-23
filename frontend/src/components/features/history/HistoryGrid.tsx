
import React from "react";
import { format } from "date-fns";
import {
    TrendingUp,
    TrendingDown,
    LineChart,
    Calendar,
    X
} from "lucide-react";

import { Card, CardContent } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { HistoryItem, HistoryBatchItem, Simulation } from "./types";
import { getBatchLabels, getItemProfitLoss } from "./utils";

interface HistoryGridProps {
    items: HistoryItem[];
    onOpenSingle: (id: number) => void;
    onOpenBatch: (batch: HistoryBatchItem) => void;
    onAskDeleteSingle: (sim: Simulation, e: React.MouseEvent) => void;
    onAskDeleteBatch: (batch: HistoryBatchItem, e: React.MouseEvent) => void;
}

export function HistoryGrid({
    items,
    onOpenSingle,
    onOpenBatch,
    onAskDeleteSingle,
    onAskDeleteBatch,
}: HistoryGridProps) {
    const getAssetIcon = () => (
        <LineChart className="w-6 h-6 text-muted-foreground" strokeWidth={1.5} />
    );

    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => {
                if (item.kind === "single") {
                    const sim = item.sim;
                    const isProfit = sim.profit_loss >= 0;

                    return (
                        <Card
                            key={sim.id}
                            className="group glass-card hover:border-accent transition-all duration-200 cursor-pointer overflow-hidden rounded-2xl"
                            onClick={() => onOpenSingle(sim.id)}
                        >
                            <div
                                className={`h-[3px] ${isProfit ? "bg-emerald-500" : "bg-destructive"
                                    } rounded-t-2xl`}
                            />
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div>{getAssetIcon()}</div>
                                        <div>
                                            <h3 className="font-semibold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                                                {sim.asset}
                                                {sim.params && Object.keys(sim.params).length > 0 && (
                                                    <Badge variant="outline" className="text-[10px] bg-orange-500/10 text-orange-400 border-orange-500/30 px-1.5 py-0 h-5">
                                                        Advanced
                                                    </Badge>
                                                )}
                                            </h3>
                                            <p className="text-xs text-muted-foreground">
                                                {sim.algorithm.replace(/_/g, " ")}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        className="text-muted-foreground hover:text-destructive transition-colors rounded-full p-1 hover:bg-destructive/10"
                                        onClick={(e) => onAskDeleteSingle(sim, e)}
                                        aria-label="Delete simulation"
                                    >
                                        <X className="w-4 h-4" strokeWidth={1.8} />
                                    </button>
                                </div>

                                <div className="space-y-2 mb-4 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">P&L</span>
                                        <span
                                            className={`font-semibold ${isProfit ? "text-emerald-400" : "text-destructive"
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
                                            {isProfit ? "+" : "-"}{Math.abs(sim.profit_loss).toFixed(2)} $
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Return</span>
                                        <Badge
                                            variant="outline"
                                            className={
                                                isProfit
                                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                                    : "bg-destructive/10 text-destructive border-destructive/30"
                                            }
                                        >
                                            {isProfit ? "+" : "-"}
                                            {Math.abs(sim.profit_loss_percentage).toFixed(2)}%
                                        </Badge>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Period</span>
                                        <span className="text-xs text-muted-foreground">
                                            {format(new Date(sim.start_date), "yyyy/MM/dd")} -{" "}
                                            {format(new Date(sim.end_date), "yyyy/MM/dd")}
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" strokeWidth={2} />
                                        {format(new Date(sim.created_at), "MMM d, yyyy")}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {sim.initial_capital.toLocaleString()} $
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
                    const batchInitial = batch.simulations[0]?.initial_capital || 0;
                    const totalReturnPct =
                        totalInitial !== 0 ? (totalPnl / totalInitial) * 100 : 0;
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
                        <Card
                            key={batch.batch_group_id}
                            className="group glass-card hover:border-accent transition-all duration-200 cursor-pointer overflow-hidden rounded-2xl"
                            onClick={() => onOpenBatch(batch)}
                        >
                            <div
                                className={`h-[3px] ${isProfit ? "bg-emerald-500" : "bg-destructive"
                                    } rounded-t-2xl`}
                            />
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div>{getAssetIcon()}</div>
                                        <div>
                                            <h3 className="font-semibold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors flex items-center gap-2 flex-wrap">
                                                {title}
                                                <div className="flex items-center gap-1.5">
                                                    <Badge
                                                        variant="outline"
                                                        className="text-[10px] bg-violet-500/10 text-violet-300 border-violet-500/30 px-1.5 py-0 h-5"
                                                    >
                                                        Batch • {numSims} sims
                                                    </Badge>
                                                    {batch.simulations.some(s => s.params && Object.keys(s.params).length > 0) && (
                                                        <Badge variant="outline" className="text-[10px] bg-orange-500/10 text-orange-400 border-orange-500/30 px-1.5 py-0 h-5">
                                                            Advanced
                                                        </Badge>
                                                    )}
                                                </div>
                                            </h3>
                                            {subtitle && (
                                                <p className="text-xs text-muted-foreground mr-1">
                                                    {subtitle}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        className="text-muted-foreground hover:text-destructive transition-colors rounded-full p-1 hover:bg-destructive/10"
                                        onClick={(e) => onAskDeleteBatch(batch, e)}
                                        aria-label="Delete batch"
                                    >
                                        <X className="w-4 h-4" strokeWidth={1.8} />
                                    </button>
                                </div>

                                <div className="space-y-2 mb-4 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total P&L</span>
                                        <span
                                            className={`font-semibold ${isProfit ? "text-emerald-400" : "text-destructive"
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
                                            {isProfit ? "+" : "-"}{Math.abs(totalPnl).toFixed(2)} $
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Total return
                                        </span>
                                        <Badge
                                            variant="outline"
                                            className={
                                                isProfit
                                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                                    : "bg-destructive/10 text-destructive border-destructive/30"
                                            }
                                        >
                                            {isProfit ? "+" : "-"}
                                            {Math.abs(totalReturnPct).toFixed(2)}%
                                        </Badge>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Period</span>
                                        <span className="text-xs text-muted-foreground">
                                            {format(periodStart, "yyyy/MM/dd")} -{" "}
                                            {format(periodEnd, "yyyy/MM/dd")}
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" strokeWidth={2} />
                                        {format(new Date(batch.created_at), "MMM d, yyyy")}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {batchInitial.toLocaleString(undefined, {
                                            maximumFractionDigits: 0,
                                        })} $
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                }
            })}
        </div>
    );
}
