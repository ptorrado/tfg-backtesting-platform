import React from "react";
import { Card, CardContent } from "../../ui/card";
import { Trophy, Activity, Shield, Percent, BarChart2 } from "lucide-react";
import { SimulationForBatch } from "./BatchComparison";
import { cn } from "../../../lib/utils";

interface BatchSummaryCardsProps {
    simulations: SimulationForBatch[];
}

export default function BatchSummaryCards({ simulations }: BatchSummaryCardsProps) {
    if (simulations.length === 0) return null;

    // 1. Top Performer (Max Profit)
    const topPerformer = [...simulations].sort((a, b) => b.profit_loss - a.profit_loss)[0];

    // 2. Best Risk-Adjusted (Max Sharpe)
    const bestSharpe = [...simulations].sort((a, b) => b.sharpe_ratio - a.sharpe_ratio)[0];

    // 3. Safest Strategy (Min Drawdown)
    // Drawdown is usually positive in our interface (e.g. 15.5 for 15.5%), closer to 0 is better.
    const safest = [...simulations].sort((a, b) => Math.abs(a.max_drawdown) - Math.abs(b.max_drawdown))[0];

    // 4. Avg Win Rate
    const totalWinRate = simulations.reduce((acc, s) => acc + s.accuracy, 0);
    const avgWinRate = totalWinRate / simulations.length;

    const cards = [
        {
            title: "Top Performer",
            value: `+$${topPerformer.profit_loss.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
            subtext: `${topPerformer.algorithm.replace(/_/g, " ")}`,
            icon: Trophy,
            color: "text-emerald-400",
        },
        {
            title: "Best Sharpe Ratio",
            value: bestSharpe.sharpe_ratio.toFixed(2),
            subtext: `${bestSharpe.algorithm.replace(/_/g, " ")}`,
            icon: Activity,
            color: "text-blue-400",
        },
        {
            title: "Lowest Drawdown",
            value: `${Math.abs(safest.max_drawdown).toFixed(2)}%`,
            subtext: `${safest.algorithm.replace(/_/g, " ")}`,
            icon: Shield,
            color: "text-amber-400",
        },
        {
            title: "Average Win Rate",
            value: `${avgWinRate.toFixed(1)}%`,
            subtext: "Across all simulations",
            icon: Percent,
            color: "text-purple-400",
        },
    ];

    return (
        <Card className="glass-card">
            <CardContent className="p-5">
                <h3 className="text-foreground font-semibold mb-4 flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-violet-500" />
                    Batch Performance Summary
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {cards.map((card, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-muted/10 hover:bg-muted/20 transition-colors">
                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center bg-background/50", card.color)}>
                                <card.icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{card.title}</p>
                                <p className="text-lg font-bold text-foreground mt-0.5 truncate" title={card.value}>{card.value}</p>
                                <p className="text-[10px] text-muted-foreground truncate" title={card.subtext}>{card.subtext}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
