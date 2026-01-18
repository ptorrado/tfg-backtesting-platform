
import React from "react";
import { Card, CardContent } from "../../ui/card";
import { Gauge, Target, BarChart2, TrendingUp, AlertTriangle } from "lucide-react";
import { cn } from "../../../lib/utils";

interface KeyRatiosProps {
    sharpeRatio: number;
    winRate: number; // 0-100
    profitFactor?: number;
    maxDrawdown: number; // percentage (positive number usually, e.g. 15.5)
    totalReturn: number; // percentage
}

export default function KeyRatios({ sharpeRatio, winRate, profitFactor, maxDrawdown, totalReturn }: KeyRatiosProps) {
    const RatioItem = ({ label, value, subtext, icon: Icon, colorClass }: any) => (
        <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/10 hover:bg-muted/20 transition-colors">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center bg-background/50", colorClass)}>
                <Icon className="w-4 h-4" />
            </div>
            <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{label}</p>
                <p className="text-lg font-bold text-foreground mt-0.5">{value}</p>
                {subtext && <p className="text-[10px] text-muted-foreground">{subtext}</p>}
            </div>
        </div>
    );

    return (
        <Card className="glass-card">
            <CardContent className="p-5">
                <h3 className="text-foreground font-semibold mb-4 flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-violet-500" />
                    Key Performance Metrics
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <RatioItem
                        label="Sharpe Ratio"
                        value={sharpeRatio.toFixed(2)}
                        subtext={sharpeRatio > 1 ? "Good" : "Needs Imp."}
                        icon={Gauge}
                        colorClass="text-blue-400"
                    />
                    <RatioItem
                        label="Win Rate"
                        value={`${winRate.toFixed(1)}%`}
                        subtext="Profitable Trades"
                        icon={Target}
                        colorClass={winRate > 50 ? "text-emerald-400" : "text-amber-400"}
                    />
                    <RatioItem
                        label="Max Drawdown"
                        value={`-${maxDrawdown.toFixed(2)}%`}
                        subtext="Peak to Trough"
                        icon={AlertTriangle}
                        colorClass="text-destructive"
                    />
                    <RatioItem
                        label="Total Return"
                        value={`${totalReturn > 0 ? "+" : ""}${totalReturn.toFixed(2)}%`}
                        subtext="Net Profit"
                        icon={TrendingUp}
                        colorClass={totalReturn > 0 ? "text-emerald-400" : "text-destructive"}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
