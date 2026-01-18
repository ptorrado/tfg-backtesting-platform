import React, { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { SimulationForBatch } from "./BatchComparison";
import { ArrowUpDown, ArrowUp, ArrowDown, ListFilter, MousePointerClick } from "lucide-react";

interface ComparisonTableProps {
    simulations: SimulationForBatch[];
    onSelect?: (id: number) => void;
    selectedId?: number | null;
}

type SortField =
    | "algorithm"
    | "profit_loss"
    | "profit_loss_percentage"
    | "sharpe_ratio"
    | "max_drawdown"
    | "accuracy"
    | "efficiency_ratio"
    | string;

type SortDirection = "asc" | "desc";

export default function ComparisonTable({ simulations, onSelect, selectedId }: ComparisonTableProps) {
    const [sortField, setSortField] = useState<SortField>("profit_loss");
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("desc");
        }
    };

    const uniqueAlgoCount = new Set(simulations.map(s => s.algorithm)).size;
    const isSingleAlgo = uniqueAlgoCount === 1 && simulations.length > 0;



    const sortedSimulations = [...simulations].sort((a, b) => {


        // Special handling for algorithm sorting to fallback to asset name
        if (sortField === "algorithm") {
            const algoCompare = a.algorithm.localeCompare(b.algorithm);
            if (algoCompare !== 0) {
                return sortDirection === "asc" ? algoCompare : -algoCompare;
            }
            // If algorithms are identical (or single algo mode), sort by asset
            const assetA = a.asset_name || "";
            const assetB = b.asset_name || "";
            return sortDirection === "asc"
                ? assetA.localeCompare(assetB)
                : assetB.localeCompare(assetA);
        }

        // All other fields are numeric
        const valA = a[sortField as keyof SimulationForBatch] as number;
        const valB = b[sortField as keyof SimulationForBatch] as number;

        return sortDirection === "asc" ? valA - valB : valB - valA;
    });

    const getSortIcon = (field: string) => {
        if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 text-muted-foreground/50" />;
        return sortDirection === "asc" ? (
            <ArrowUp className="w-3 h-3 ml-1 text-primary" />
        ) : (
            <ArrowDown className="w-3 h-3 ml-1 text-primary" />
        );
    };

    return (
        <Card className="glass-card border-border bg-card">
            <CardHeader className="border-b border-border pb-4 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-foreground flex items-center gap-2 text-base font-semibold">
                    <ListFilter className="w-4 h-4 text-primary" strokeWidth={2} />
                    Detailed Comparison
                </CardTitle>
                {onSelect && (
                    <Badge variant="outline" className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 transition-colors flex items-center gap-1.5 font-medium px-3 py-1 cursor-default">
                        <MousePointerClick className="w-3.5 h-3.5" />
                        Select row to analyze
                    </Badge>
                )}
            </CardHeader>
            <CardContent className="px-0 pb-6">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-border hover:bg-transparent">
                                <TableHead
                                    className="cursor-pointer hover:bg-muted/10 transition-colors pl-8"
                                    onClick={() => handleSort("algorithm")}
                                >
                                    <div className="flex items-center">
                                        {isSingleAlgo ? "Asset" : "Strategy"} {getSortIcon("algorithm")}
                                    </div>
                                </TableHead>



                                <TableHead
                                    className="cursor-pointer hover:bg-muted/10 transition-colors text-center"
                                    onClick={() => handleSort("profit_loss")}
                                >
                                    <div className="flex items-center justify-center">
                                        Net Profit {getSortIcon("profit_loss")}
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer hover:bg-muted/10 transition-colors text-center"
                                    onClick={() => handleSort("profit_loss_percentage")}
                                >
                                    <div className="flex items-center justify-center">
                                        Return % {getSortIcon("profit_loss_percentage")}
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer hover:bg-muted/10 transition-colors text-center"
                                    onClick={() => handleSort("sharpe_ratio")}
                                >
                                    <div className="flex items-center justify-center">
                                        Sharpe {getSortIcon("sharpe_ratio")}
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer hover:bg-muted/10 transition-colors text-center"
                                    onClick={() => handleSort("max_drawdown")}
                                >
                                    <div className="flex items-center justify-center">
                                        Max DD% {getSortIcon("max_drawdown")}
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer hover:bg-muted/10 transition-colors text-center"
                                    onClick={() => handleSort("accuracy")}
                                >
                                    <div className="flex items-center justify-center">
                                        Win Rate {getSortIcon("accuracy")}
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer hover:bg-muted/10 transition-colors text-center pr-8"
                                    onClick={() => handleSort("efficiency_ratio")}
                                >
                                    <div className="flex items-center justify-center">
                                        Efficiency {getSortIcon("efficiency_ratio")}
                                    </div>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedSimulations.map((sim) => {
                                const isProfit = sim.profit_loss >= 0;
                                const isSelected = selectedId === sim.id;
                                return (
                                    <TableRow
                                        key={sim.id}
                                        className={`border-border transition-colors cursor-pointer ${isSelected ? "bg-primary/10 hover:bg-primary/15" : "hover:bg-muted/50"
                                            }`}
                                        onClick={() => onSelect && onSelect(sim.id)}
                                    >
                                        <TableCell className="font-medium text-foreground pl-8">
                                            <div className="flex flex-col">
                                                {isSingleAlgo ? (
                                                    <>
                                                        <span className="font-semibold">{sim.asset_name}</span>
                                                        <span className="text-xs text-muted-foreground capitalize">{sim.algorithm.replace(/_/g, " ")}</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="capitalize font-semibold">{sim.algorithm.replace(/_/g, " ")}</span>
                                                        {sim.asset_name && (
                                                            <span className="text-xs text-muted-foreground">{sim.asset_name}</span>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>



                                        <TableCell className={`text-center font-medium ${isProfit ? "text-emerald-400" : "text-destructive"}`}>
                                            {isProfit ? "+" : "-"}${Math.abs(sim.profit_loss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline" className={isProfit ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-red-500/10 text-red-400 border-red-500/30"}>
                                                {sim.profit_loss_percentage.toFixed(2)}%
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center text-muted-foreground">
                                            {sim.sharpe_ratio.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-center text-muted-foreground">
                                            {Math.abs(sim.max_drawdown).toFixed(2)}%
                                        </TableCell>
                                        <TableCell className="text-center text-foreground">
                                            {sim.accuracy.toFixed(1)}%
                                        </TableCell>
                                        <TableCell className="text-center text-muted-foreground pr-8">
                                            {sim.efficiency_ratio.toFixed(1)}%
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
