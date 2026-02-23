
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
    listSimulations,
    deleteSimulation,

} from "../../../api/simulations";
import { createPageUrl } from "../../../utils";

import {
    HistoryItem,
    HistoryBatchItem,
    Simulation,
    ViewMode,
    SortBy,
    SortDirection,
} from "./types";
import { getBatchLabels, getItemCreatedAt, getItemProfitLoss } from "./utils";

export function useHistory() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [viewMode, setViewMode] = useState<ViewMode>("cards");
    const [assetFilter, setAssetFilter] = useState("");
    const [sortBy, setSortBy] = useState<SortBy>("created_at");
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
    const [page, setPage] = useState(1);
    const [pageSize] = useState(50);

    const [itemToDelete, setItemToDelete] = useState<HistoryItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const {
        data: paginatedData,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ["simulations", { page, pageSize, assetFilter, sortBy, sortDirection }],
        queryFn: () => listSimulations({
            page,
            page_size: pageSize,
            asset: assetFilter || undefined,
            order_by: sortBy,
            direction: sortDirection,
        }),
    });

    const simulations = paginatedData?.items || [];
    const totalSimulations = paginatedData?.total || 0;
    const totalPages = paginatedData?.total_pages || 0;

    // Reset to page 1 when filters change
    const handleAssetFilterChange = (value: React.SetStateAction<string>) => {
        setAssetFilter(value);
        setPage(1);
    };

    const handleSortByChange = (value: React.SetStateAction<SortBy>) => {
        setSortBy(value);
        setPage(1);
    };

    const handleSortDirectionChange = (value: React.SetStateAction<SortDirection>) => {
        setSortDirection(value);
        setPage(1);
    };

    // ====== Filtro + agrupación por batch + ordenación ======
    const processedItems: HistoryItem[] = useMemo(() => {
        // 1) Separamos singles y agrupamos por batch_group_id
        const batchMap = new Map<string, Simulation[]>();
        const singles: Simulation[] = [];

        for (const sim of simulations) {
            if (sim.batch_group_id) {
                const key = sim.batch_group_id;
                const arr = batchMap.get(key) || [];
                arr.push(sim);
                batchMap.set(key, arr);
            } else {
                singles.push(sim);
            }
        }

        const items: HistoryItem[] = [];

        // 2) Metemos singles como items
        singles.forEach((sim) => {
            items.push({ kind: "single", sim });
        });

        // 3) Metemos batches
        Array.from(batchMap.entries()).forEach(([groupId, simsInBatchRaw]) => {
            if (!simsInBatchRaw.length) return;

            // Ordenamos dentro del batch por created_at para tener fechas consistentes
            const sims = [...simsInBatchRaw].sort(
                (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );

            const created_at = sims[0].created_at;
            const batch_name = sims[0].batch_name ?? null;

            items.push({
                kind: "batch",
                batch_group_id: groupId,
                batch_name,
                created_at,
                simulations: sims,
            });
        });

        // We must sort the final grouped items on the frontend
        // because the map grouping places singles before batches,
        // ignoring the descending/ascending backend order between them.
        items.sort((a, b) => {
            let valA: number;
            let valB: number;

            if (sortBy === "profit_loss") {
                valA = getItemProfitLoss(a);
                valB = getItemProfitLoss(b);
            } else {
                valA = new Date(getItemCreatedAt(a)).getTime();
                valB = new Date(getItemCreatedAt(b)).getTime();
            }

            if (valA < valB) return sortDirection === "asc" ? -1 : 1;
            if (valA > valB) return sortDirection === "asc" ? 1 : -1;
            return 0;
        });

        return items;
    }, [simulations, sortBy, sortDirection]);

    // ====== Navegación ======

    const handleOpenSingle = (id: number) => {
        navigate(createPageUrl("Results") + `?id=${id}`);
    };

    const handleOpenBatch = (batch: HistoryBatchItem) => {
        const { title } = getBatchLabels(batch);
        const ids = batch.simulations.map((s) => s.id).join(",");
        const url =
            createPageUrl("Results") +
            `?ids=${ids}&batchName=${encodeURIComponent(title)}`;
        navigate(url);
    };

    // ====== Borrado ======

    const handleAskDeleteSingle = (sim: Simulation, e: React.MouseEvent) => {
        e.stopPropagation();
        setItemToDelete({ kind: "single", sim });
    };

    const handleAskDeleteBatch = (
        batch: HistoryBatchItem,
        e: React.MouseEvent
    ) => {
        e.stopPropagation();
        setItemToDelete(batch);
    };

    const handleCancelDelete = () => {
        if (isDeleting) return;
        setItemToDelete(null);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            setIsDeleting(true);

            if (itemToDelete.kind === "single") {
                await deleteSimulation(itemToDelete.sim.id);
            } else {
                await Promise.all(
                    itemToDelete.simulations.map((s) => deleteSimulation(s.id))
                );
            }

            setItemToDelete(null);
            await queryClient.invalidateQueries({
                queryKey: ["simulations"],
            });
        } catch (err) {
            console.error("Error deleting simulation(s):", err);
        } finally {
            setIsDeleting(false);
        }
    };

    return {
        viewMode,
        setViewMode,
        assetFilter,
        setAssetFilter: handleAssetFilterChange,
        sortBy,
        setSortBy: handleSortByChange,
        sortDirection,
        setSortDirection: handleSortDirectionChange,
        items: processedItems,
        isLoading,
        isError,
        itemToDelete,
        isDeleting, // exposing if needed for loading state in modal
        handleOpenSingle,
        handleOpenBatch,
        handleAskDeleteSingle,
        handleAskDeleteBatch,
        handleCancelDelete,
        handleConfirmDelete,
        // Pagination
        page,
        setPage,
        pageSize,
        totalSimulations,
        totalPages,
    };
}
