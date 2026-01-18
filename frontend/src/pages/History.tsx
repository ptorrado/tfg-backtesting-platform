// src/pages/History.tsx
import React from "react";
import { History as HistoryIcon } from "lucide-react";

import { Card, CardContent } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";

import { useHistory } from "../components/features/history/useHistory";
import { HistoryHeader } from "../components/features/history/HistoryHeader";
import { HistoryFilters } from "../components/features/history/HistoryFilters";
import { HistoryGrid } from "../components/features/history/HistoryGrid";
import { HistoryTable } from "../components/features/history/HistoryTable";

// Si quisiéramos extraer también el diálogo de confirmación de borrado, podríamos hacerlo.
// Por ahora lo dejaré aquí o usaré un simple confirm() o un componente de UI si existe.
// Veo que en el código original no había UI explícita de "Confirm Delete" modal renderizada, 
// solo el estado `itemToDelete`. Asumo que faltaba implmentarlo o estaba "invisible".
// Voy a agregar un pequeño overlay simple si hay itemToDelete.

export default function History() {
  const {
    viewMode,
    setViewMode,
    assetFilter,
    setAssetFilter,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    items,
    isLoading,
    isError,
    itemToDelete, // Si quisieras mostrar un modal
    isDeleting,
    handleOpenSingle,
    handleOpenBatch,
    handleAskDeleteSingle,
    handleAskDeleteBatch,
    handleCancelDelete,
    handleConfirmDelete,
  } = useHistory();

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <HistoryHeader viewMode={viewMode} setViewMode={setViewMode} />

        <HistoryFilters
          assetFilter={assetFilter}
          setAssetFilter={setAssetFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortDirection={sortDirection}
          setSortDirection={setSortDirection}
        />

        {/* Loading / Error / Content */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-56 bg-card/50 rounded-2xl" />
            ))}
          </div>
        ) : isError ? (
          <Card className="glass-card border-destructive/30 bg-destructive/5">
            <CardContent className="p-6 text-center">
              <p className="text-destructive text-sm">
                Error loading simulations. Please try again.
              </p>
            </CardContent>
          </Card>
        ) : items.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="p-12 text-center">
              <HistoryIcon
                className="w-12 h-12 text-muted-foreground mx-auto mb-4"
                strokeWidth={1.5}
              />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No simulations yet
              </h3>
              <p className="text-muted-foreground text-sm">
                Run your first simulation to see results here
              </p>
            </CardContent>
          </Card>
        ) : viewMode === "cards" ? (
          <HistoryGrid
            items={items}
            onOpenSingle={handleOpenSingle}
            onOpenBatch={handleOpenBatch}
            onAskDeleteSingle={handleAskDeleteSingle}
            onAskDeleteBatch={handleAskDeleteBatch}
          />
        ) : (
          <HistoryTable
            items={items}
            onOpenSingle={handleOpenSingle}
            onOpenBatch={handleOpenBatch}
          />
        )}

        {/* Delete Confirmation Overlay (Simple implementation) */}
        {itemToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-card border border-border rounded-xl p-6 max-w-sm w-full shadow-2xl">
              <h3 className="text-lg font-bold text-foreground mb-2">
                Confirm Deletion
              </h3>
              <p className="text-muted-foreground text-sm mb-6">
                Are you sure you want to delete this{" "}
                {itemToDelete.kind === "single" ? "simulation" : "batch"}?
                This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCancelDelete}
                  className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

