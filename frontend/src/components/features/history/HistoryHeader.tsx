
import React from "react";
import { LayoutGrid, List as ListIcon } from "lucide-react";
import { ViewMode } from "./types";

interface HistoryHeaderProps {
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
}

export function HistoryHeader({ viewMode, setViewMode }: HistoryHeaderProps) {
    return (
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                    Simulation History
                </h1>
                <p className="text-muted-foreground text-sm">
                    Review past backtesting results and performance metrics
                </p>
            </div>

            <div className="inline-flex items-center rounded-full bg-card/95 p-1 shadow-lg shadow-black/40 border border-border">
                <button
                    className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${viewMode === "cards"
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground"
                        }`}
                    onClick={() => setViewMode("cards")}
                >
                    <LayoutGrid
                        className={`w-4 h-4 ${viewMode === "cards" ? "text-background" : "text-muted-foreground"
                            }`}
                        strokeWidth={1.8}
                    />
                    Cards
                </button>
                <button
                    className={`ml-1 flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${viewMode === "list"
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground"
                        }`}
                    onClick={() => setViewMode("list")}
                >
                    <ListIcon
                        className={`w-4 h-4 ${viewMode === "list" ? "text-background" : "text-muted-foreground"
                            }`}
                        strokeWidth={1.8}
                    />
                    List
                </button>
            </div>
        </div>
    );
}
