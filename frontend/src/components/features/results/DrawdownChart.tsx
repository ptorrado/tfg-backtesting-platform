
import React, { useMemo } from "react";
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { TrendingDown } from "lucide-react";
import { EquityPoint } from "../../../api/simulations";
import { formatDate } from "../../../utils";

interface DrawdownChartProps {
    data: EquityPoint[];
}

export default function DrawdownChart({ data }: DrawdownChartProps) {
    const drawdownData = useMemo(() => {
        let maxEquity = 0;
        return data.map((point) => {
            if (point.equity > maxEquity) {
                maxEquity = point.equity;
            }
            const drawdown = maxEquity > 0 ? (point.equity - maxEquity) / maxEquity : 0;
            return {
                date: point.date,
                // Drawdown as percentage (e.g. -0.15 for -15%)
                drawdown: drawdown,
            };
        });
    }, [data]);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="glass-card border border-border bg-popover rounded-lg p-3">
                    <p className="text-muted-foreground text-xs">
                        {formatDate(payload[0].payload.date)}
                    </p>
                    <p className="text-destructive font-semibold text-base">
                        {(payload[0].value * 100).toFixed(2)}%
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <Card className="glass-card border-border bg-card h-full">
            <CardHeader className="border-b border-border pb-4">
                <CardTitle className="text-foreground flex items-center gap-2 text-base font-semibold">
                    <TrendingDown
                        className="w-4 h-4 text-destructive"
                        strokeWidth={2}
                    />
                    Drawdown Risk
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={drawdownData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorDrawdown" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                            dataKey="date"
                            stroke="hsl(var(--muted-foreground))"
                            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                            minTickGap={30}
                            tickFormatter={(value) => formatDate(value)}
                        />
                        <YAxis
                            stroke="hsl(var(--muted-foreground))"
                            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                            tickFormatter={(value: number) => `${(value * 100).toFixed(0)}%`}
                            width={30}
                            minTickGap={30}
                            tickCount={6}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="drawdown"
                            stroke="#ef4444"
                            strokeWidth={2}
                            fill="url(#colorDrawdown)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
