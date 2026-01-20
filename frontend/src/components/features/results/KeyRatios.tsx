
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
    initialCapital?: number;
    finalEquity?: number;
    netProfit?: number;
}

export default function KeyRatios({ sharpeRatio, winRate, profitFactor, maxDrawdown, totalReturn, initialCapital, finalEquity, netProfit }: KeyRatiosProps) {
    const RatioItem = ({ label, value, subtext, icon: Icon, colorClass }: any) => (
        <div className="flex items-start gap-4 p-4 rounded-xl border border-border/40 bg-background/20 hover:bg-muted/10 transition-colors">
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center bg-background/60 shadow-sm", colorClass)}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-1 opacity-80">{label}</p>
                <p className="text-xl font-bold text-foreground tracking-tight">{value}</p>
                {subtext && <p className="text-[10px] text-muted-foreground mt-1">{subtext}</p>}
            </div>
        </div>
    );

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    };

    const isProfit = (netProfit || 0) >= 0;
    const returnPercentage = initialCapital ? ((netProfit || 0) / initialCapital) * 100 : 0;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Card: Financial Summary (5 columns) */}
            <Card className="glass-card lg:col-span-5 h-full">
                <CardContent className="h-full flex flex-col p-8 bg-muted/5">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-8">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                        Portfolio Status
                    </h3>
                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="flex-1 flex flex-col justify-center space-y-3 pb-6">
                            <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">
                                Net Profit / Loss
                            </span>
                            <div className="flex items-center gap-4">
                                <span className={`text-3xl lg:text-4xl font-extrabold ${isProfit ? 'text-emerald-500 drop-shadow-sm' : 'text-red-500'}`}>
                                    {isProfit ? '+' : ''}{formatCurrency(netProfit || 0)}
                                </span>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${isProfit ? 'bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20' : 'bg-red-500/10 text-red-500 ring-1 ring-red-500/20'}`}>
                                    {returnPercentage > 0 ? '+' : ''}{returnPercentage.toFixed(2)}%
                                </span>
                            </div>
                        </div>

                        <div className="border-t border-border/40 w-full" />

                        <div className="flex-1 flex flex-col justify-center pt-6">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="flex flex-col space-y-1.5">
                                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                                        Initial Capital
                                    </span>
                                    <span className="text-xl font-bold text-foreground">
                                        {formatCurrency(initialCapital || 0)}
                                    </span>
                                </div>

                                <div className="flex flex-col space-y-1.5">
                                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                                        Final Equity
                                    </span>
                                    <span className="text-xl font-bold text-foreground">
                                        {formatCurrency(finalEquity || 0)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Right Card: Key Ratios (7 columns) */}
            <Card className="glass-card lg:col-span-7 h-full">
                <CardContent className="h-full flex flex-col p-8 bg-muted/5">
                    <div className="flex-1 flex flex-col space-y-8">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                            <BarChart2 className="w-4 h-4 text-violet-500" />
                            Performance Metrics
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <RatioItem
                                label="Sharpe Ratio"
                                value={sharpeRatio.toFixed(2)}
                                subtext={sharpeRatio > 1 ? "Risk-Adjusted: Good" : "Risk-Adjusted: Low"}
                                icon={Gauge}
                                colorClass="text-blue-500"
                            />
                            <RatioItem
                                label="Win Rate"
                                value={`${winRate.toFixed(1)}%`}
                                subtext="Winning Trades"
                                icon={Target}
                                colorClass={winRate > 50 ? "text-emerald-500" : "text-amber-500"}
                            />
                            <RatioItem
                                label="Max Drawdown"
                                value={`-${maxDrawdown.toFixed(2)}%`}
                                subtext="Worst Decline"
                                icon={AlertTriangle}
                                colorClass="text-red-500"
                            />
                            <RatioItem
                                label="Total Return"
                                value={`${totalReturn > 0 ? "+" : ""}${totalReturn.toFixed(2)}%`}
                                subtext="Overall Growth"
                                icon={TrendingUp}
                                colorClass={totalReturn > 0 ? "text-emerald-500" : "text-red-500"}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
