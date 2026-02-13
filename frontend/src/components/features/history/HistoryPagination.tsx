// src/components/features/history/HistoryPagination.tsx
import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type HistoryPaginationProps = {
    page: number;
    totalPages: number;
    totalSimulations: number;
    pageSize: number;
    onPageChange: (page: number) => void;
};

export function HistoryPagination({
    page,
    totalPages,
    totalSimulations,
    pageSize,
    onPageChange,
}: HistoryPaginationProps) {
    if (totalPages <= 1) return null;

    const startItem = (page - 1) * pageSize + 1;
    const endItem = Math.min(page * pageSize, totalSimulations);

    const handlePrevious = () => {
        if (page > 1) onPageChange(page - 1);
    };

    const handleNext = () => {
        if (page < totalPages) onPageChange(page + 1);
    };

    return (
        <div className="mt-8 flex items-center justify-between px-4">
            <p className="text-sm text-muted-foreground">
                Showing <span className="font-medium text-foreground">{startItem}</span>-
                <span className="font-medium text-foreground">{endItem}</span> of{" "}
                <span className="font-medium text-foreground">{totalSimulations}</span> simulations
            </p>

            <div className="flex items-center gap-2">
                <button
                    onClick={handlePrevious}
                    disabled={page === 1}
                    className={`
            flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium
            transition-all duration-200
            ${page === 1
                            ? "text-muted-foreground/50 cursor-not-allowed"
                            : "text-foreground hover:bg-accent/50"
                        }
          `}
                >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                </button>

                <div className="flex items-center gap-1">
                    {/* First page */}
                    {page > 3 && (
                        <>
                            <PageButton page={1} currentPage={page} onClick={onPageChange} />
                            {page > 4 && <span className="px-2 text-muted-foreground">...</span>}
                        </>
                    )}

                    {/* Pages around current */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((p) => Math.abs(p - page) <= 1)
                        .map((p) => (
                            <PageButton key={p} page={p} currentPage={page} onClick={onPageChange} />
                        ))}

                    {/* Last page */}
                    {page < totalPages - 2 && (
                        <>
                            {page < totalPages - 3 && <span className="px-2 text-muted-foreground">...</span>}
                            <PageButton page={totalPages} currentPage={page} onClick={onPageChange} />
                        </>
                    )}
                </div>

                <button
                    onClick={handleNext}
                    disabled={page === totalPages}
                    className={`
            flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium
            transition-all duration-200
            ${page === totalPages
                            ? "text-muted-foreground/50 cursor-not-allowed"
                            : "text-foreground hover:bg-accent/50"
                        }
          `}
                >
                    Next
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

function PageButton({
    page,
    currentPage,
    onClick,
}: {
    page: number;
    currentPage: number;
    onClick: (page: number) => void;
}) {
    const isActive = page === currentPage;

    return (
        <button
            onClick={() => onClick(page)}
            className={`
        w-10 h-10 rounded-lg text-sm font-medium
        transition-all duration-200
        ${isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-accent/50"
                }
      `}
        >
            {page}
        </button>
    );
}
