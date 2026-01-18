import React from "react";
import {
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Label,
    Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Crosshair } from "lucide-react";
import { SimulationForBatch } from "./BatchComparison";

// Matches the COLORS array in BatchComparison.tsx
const COLORS = [
    "#10b981",
    "#3b82f6",
    "#8b5cf6",
    "#f59e0b",
    "#ef4444",
    "#ec4899",
    "#06b6d4",
];

interface RiskRewardScatterProps {
    simulations: SimulationForBatch[];
}

export default function RiskRewardScatter({ simulations }: RiskRewardScatterProps) {
    const data = simulations.map((sim, index) => ({
        x: Math.abs(sim.max_drawdown), // Drawdown usually negative or positive percent. We use absolute for "Risk" axis.
        y: sim.profit_loss_percentage,
        name: sim.algorithm.replace(/_/g, " "),
        asset: sim.asset_name,
        color: COLORS[index % COLORS.length]
    }));

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const { name, asset, x, y, color } = payload[0].payload;
            return (
                <div className="glass-card border border-border bg-popover rounded-lg p-3 shadow-xl">
                    <p className="font-semibold text-sm mb-1" style={{ color }}>{name}</p>
                    {asset && <p className="text-xs text-muted-foreground mb-2">{asset}</p>}
                    <div className="space-y-1 text-xs">
                        <p className="text-emerald-400">Return: {y.toFixed(2)}%</p>
                        <p className="text-amber-400">Max DD: {x.toFixed(2)}%</p>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <Card className="glass-card border-border bg-card h-full">
            <CardHeader className="border-b border-border pb-4">
                <CardTitle className="text-foreground flex items-center gap-2 text-base font-semibold">
                    <Crosshair className="w-4 h-4 text-primary" strokeWidth={2} />
                    Risk vs. Reward Analysis
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
                <ResponsiveContainer width="100%" height={350}>
                    <ScatterChart margin={{ top: 20, right: 10, bottom: 10, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                            type="number"
                            dataKey="x"
                            name="Max Drawdown"
                            unit="%"
                            stroke="hsl(var(--muted-foreground))"
                            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                            minTickGap={20}
                        >
                            <Label
                                value="Max Drawdown (Risk)"
                                offset={0}
                                position="bottom"
                                style={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                            />
                        </XAxis>
                        <YAxis
                            type="number"
                            dataKey="y"
                            name="Total Return"
                            unit="%"
                            stroke="hsl(var(--muted-foreground))"
                            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                            width={65}
                        >
                            <Label
                                value="Total Return (Reward)"
                                angle={-90}
                                position="insideLeft"
                                offset={15}
                                style={{ fill: "hsl(var(--muted-foreground))", fontSize: 12, textAnchor: "middle" }}
                            />
                        </YAxis>
                        <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: "3 3" }} />
                        <Scatter name="Strategies" data={data}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Scatter>
                    </ScatterChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
