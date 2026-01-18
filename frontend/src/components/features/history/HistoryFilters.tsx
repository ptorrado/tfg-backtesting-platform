
import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { SortBy, SortDirection } from "./types";

interface HistoryFiltersProps {
    assetFilter: string;
    setAssetFilter: (value: string) => void;
    sortBy: SortBy;
    setSortBy: (value: SortBy) => void;
    sortDirection: SortDirection;
    setSortDirection: React.Dispatch<React.SetStateAction<SortDirection>>;
}

export function HistoryFilters({
    assetFilter,
    setAssetFilter,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
}: HistoryFiltersProps) {
    return (
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Filter by asset:</span>
                <input
                    type="text"
                    value={assetFilter}
                    onChange={(e) => setAssetFilter(e.target.value)}
                    placeholder="AAPL, BTCUSD, EURUSD..."
                    className="bg-input border border-border rounded-full px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60"
                />
            </div>

            <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">Sort by:</span>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortBy)}
                    className="bg-input border border-border rounded-full px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary/60"
                >
                    <option value="created_at">Date</option>
                    <option value="profit_loss">P&L</option>
                </select>
                <button
                    onClick={() =>
                        setSortDirection((prev) => (prev === "desc" ? "asc" : "desc"))
                    }
                    className="flex items-center gap-1 bg-input border border-border rounded-full px-3 py-1.5 text-xs text-foreground hover:border-primary/60 transition-colors"
                >
                    {sortDirection === "desc" ? (
                        <>
                            <TrendingDown className="w-3 h-3" strokeWidth={2} />
                            <span>Desc</span>
                        </>
                    ) : (
                        <>
                            <TrendingUp className="w-3 h-3" strokeWidth={2} />
                            <span>Asc</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
