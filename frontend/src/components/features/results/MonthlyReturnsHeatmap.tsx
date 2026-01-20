
import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Calendar } from "lucide-react";
import { EquityPoint } from "../../../api/simulations";
import { format, parseISO, getYear, getMonth } from "date-fns";
import { cn } from "../../../lib/utils";

interface MonthlyReturnsHeatmapProps {
    data: EquityPoint[];
}

export default function MonthlyReturnsHeatmap({ data }: MonthlyReturnsHeatmapProps) {
    const monthlyData = useMemo(() => {
        if (!data || data.length === 0) return {};

        const returnsByYear: Record<number, Record<number, number>> = {};
        const equityByMonth: Record<string, number> = {}; // key: "YYYY-MM" -> last equity of month

        // 1. Map last equity of each month
        data.forEach((point) => {
            const date = parseISO(point.date);
            const key = format(date, "yyyy-MM");
            equityByMonth[key] = point.equity;
        });

        // Also need the very first equity to calculate the first month's return
        const initialEquity = data[0].equity;
        const startYear = getYear(parseISO(data[0].date));
        const startMonth = getMonth(parseISO(data[0].date)); // 0-indexed

        // 2. Calculate returns
        // Helper to get previous month's equity
        const getPrevEquity = (year: number, month: number) => {
            // if it's the start month, use initial equity of the dataset
            // check if this month is the start month
            if (year === startYear && month === startMonth) return initialEquity;

            const prevDate = new Date(year, month - 1);
            const key = format(prevDate, "yyyy-MM");
            return equityByMonth[key] || initialEquity; // Fallback
        };

        Object.keys(equityByMonth).forEach((key) => {
            const [yearStr, monthStr] = key.split("-");
            const year = parseInt(yearStr);
            const month = parseInt(monthStr) - 1; // 0-indexed for js Date

            if (!returnsByYear[year]) returnsByYear[year] = {};

            const currentEquity = equityByMonth[key];
            const prevEquity = getPrevEquity(year, month);

            // Simple return
            const ret = (currentEquity - prevEquity) / prevEquity;
            returnsByYear[year][month] = ret;
        });

        return returnsByYear;
    }, [data]);

    const years = Object.keys(monthlyData).map(Number).sort((a, b) => b - a);
    const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const getColor = (value: number | undefined) => {
        if (value === undefined) return "bg-secondary/30"; // No data
        if (value === 0) return "bg-muted/50 text-muted-foreground";

        const abs = Math.abs(value);


        if (value > 0) {
            // Emerald
            if (abs > 0.10) return "bg-emerald-500 text-white font-bold";
            if (abs > 0.05) return "bg-emerald-500/70 text-white";
            return "bg-emerald-500/30 text-emerald-400";
        } else {
            // Red
            if (abs > 0.10) return "bg-red-500 text-white font-bold";
            if (abs > 0.05) return "bg-red-500/70 text-white";
            return "bg-red-500/30 text-red-300";
        }
    };

    return (
        <Card className="glass-card border-border bg-card overflow-hidden">
            <CardHeader className="border-b border-border pb-4">
                <CardTitle className="text-foreground flex items-center gap-2 text-base font-semibold">
                    <Calendar className="w-4 h-4 text-violet-500" strokeWidth={2} />
                    Monthly Returns
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border bg-muted/20">
                            <th className="p-3 text-left font-medium text-muted-foreground">Year</th>
                            {months.map(m => (
                                <th key={m} className="p-3 text-center font-medium text-muted-foreground max-w-[50px]">{m}</th>
                            ))}
                            <th className="p-3 text-center font-medium text-foreground">YTD</th>
                        </tr>
                    </thead>
                    <tbody>
                        {years.map(year => {
                            const yearReturns = Object.values(monthlyData[year] || {});
                            const ytd = yearReturns.reduce((acc, r) => (1 + acc) * (1 + r) - 1, 0);

                            return (
                                <tr key={year} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                                    <td className="p-3 font-semibold text-foreground">{year}</td>
                                    {months.map((_, idx) => (
                                        <td key={idx} className="p-1">
                                            <div className={cn(
                                                "w-full h-8 flex items-center justify-center rounded text-xs transition-colors",
                                                getColor(monthlyData[year]?.[idx])
                                            )}>
                                                {monthlyData[year]?.[idx] !== undefined
                                                    ? `${(monthlyData[year][idx] * 100).toFixed(1)}%`
                                                    : "-"}
                                            </div>
                                        </td>
                                    ))}
                                    <td className="p-3 text-center font-bold text-foreground">
                                        <span className={ytd >= 0 ? "text-emerald-400" : "text-destructive"}>
                                            {(ytd * 100).toFixed(1)}%
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </CardContent>
        </Card>
    );
}
