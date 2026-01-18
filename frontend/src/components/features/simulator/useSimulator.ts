
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    runSimulation as runSimulationApi,
    SimulationRequest as ApiSimulationRequest,
} from "../../../api/simulations";
import { createPageUrl } from "../../../utils";
import { AssetCategoryKey } from "./AssetSelector";
import { AlgoParams, MultiAlgoParams } from "./AlgorithmSelector";

export function useSimulator() {
    const navigate = useNavigate();

    const [assetName, setAssetName] = useState<string>("");
    const [algorithm, setAlgorithm] = useState<string>("");

    const [startDate, setStartDate] = useState<string>("2023-01-01");
    const [endDate, setEndDate] = useState<string>("2024-01-01");
    const [initialInvestment, setInitialInvestment] = useState<number>(10000);
    const [isRunning, setIsRunning] = useState<boolean>(false);

    // Asset category
    const [assetType, setAssetType] = useState<AssetCategoryKey>("stocks");

    // Batch mode
    const [batchMode, setBatchMode] = useState<boolean>(false);
    const [batchName, setBatchName] = useState<string>("");
    const [batchType, setBatchType] = useState<"assets" | "algorithms">("assets");
    const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
    const [selectedAlgorithms, setSelectedAlgorithms] = useState<string[]>([]);
    const [baseAsset, setBaseAsset] = useState<string>("");
    const [baseAlgorithm, setBaseAlgorithm] = useState<string>("");

    // Advanced mode
    const [advancedMode, setAdvancedMode] = useState<boolean>(false);
    const [algorithmParams, setAlgorithmParams] = useState<AlgoParams>({});
    const [multiAlgoParams, setMultiAlgoParams] = useState<MultiAlgoParams>({});

    const handleRunSimulation = async () => {
        // --------- MODO BATCH ---------
        if (batchMode) {
            if (!batchName) return;

            const isMultiAssetInvalid =
                batchType === "assets" &&
                (selectedAssets.length === 0 || !baseAlgorithm);
            const isMultiAlgoInvalid =
                batchType === "algorithms" &&
                (selectedAlgorithms.length === 0 || !baseAsset);

            if (isMultiAssetInvalid || isMultiAlgoInvalid) return;

            setIsRunning(true);

            try {
                const payloads: ApiSimulationRequest[] = [];
                const batchGroupId = `${Date.now()}-${Math.random()
                    .toString(36)
                    .slice(2, 8)}`;

                if (batchType === "assets") {
                    const params = advancedMode
                        ? (algorithmParams as Record<string, number>)
                        : {};

                    selectedAssets.forEach((asset) => {
                        payloads.push({
                            mode: "batch",
                            asset,
                            algorithm: baseAlgorithm,
                            start_date: startDate,
                            end_date: endDate,
                            initial_capital: initialInvestment,
                            params,
                            batch_name: batchName,
                            batch_group_id: batchGroupId,
                        });
                    });
                } else {
                    selectedAlgorithms.forEach((algo) => {
                        const algoParams = advancedMode
                            ? ((multiAlgoParams[algo] ?? {}) as Record<string, number>)
                            : {};

                        payloads.push({
                            mode: "batch",
                            asset: baseAsset,
                            algorithm: algo,
                            start_date: startDate,
                            end_date: endDate,
                            initial_capital: initialInvestment,
                            params: algoParams,
                            batch_name: batchName,
                            batch_group_id: batchGroupId,
                        });
                    });
                }

                const results = await Promise.all(payloads.map(runSimulationApi));
                const idsParam = results.map((s) => s.id).join(",");
                const batchNameParam = encodeURIComponent(batchName);

                navigate(
                    `${createPageUrl("Results")}?ids=${idsParam}&batchName=${batchNameParam}`
                );
            } catch (err) {
                console.error("Error running batch simulation", err);
            } finally {
                setIsRunning(false);
            }

            return;
        }

        // --------- MODO SINGLE ---------
        if (!assetName || !algorithm || !startDate || !endDate || !initialInvestment) {
            return;
        }

        setIsRunning(true);

        try {
            const params = advancedMode
                ? (algorithmParams as Record<string, number>)
                : {};

            const payload: ApiSimulationRequest = {
                mode: "single",
                asset: assetName,
                algorithm,
                start_date: startDate,
                end_date: endDate,
                initial_capital: initialInvestment,
                params,
            };

            const simulation = await runSimulationApi(payload);

            navigate(`${createPageUrl("Results")}?id=${simulation.id}`);
        } catch (err) {
            console.error("Error running simulation", err);
        } finally {
            setIsRunning(false);
        }
    };

    const canRunSimulation = batchMode
        ? Boolean(batchName) &&
        ((batchType === "assets" &&
            selectedAssets.length >= 1 &&
            !!baseAlgorithm) ||
            (batchType === "algorithms" &&
                selectedAlgorithms.length >= 1 &&
                !!baseAsset))
        : Boolean(
            assetName &&
            algorithm &&
            startDate &&
            endDate &&
            initialInvestment >= 100
        );

    return {
        assetName, setAssetName,
        algorithm, setAlgorithm,
        startDate, setStartDate,
        endDate, setEndDate,
        initialInvestment, setInitialInvestment,
        isRunning,
        assetType, setAssetType,
        batchMode, setBatchMode,
        batchName, setBatchName,
        batchType, setBatchType,
        selectedAssets, setSelectedAssets,
        selectedAlgorithms, setSelectedAlgorithms,
        baseAsset, setBaseAsset,
        baseAlgorithm, setBaseAlgorithm,
        advancedMode, setAdvancedMode,
        algorithmParams, setAlgorithmParams,
        multiAlgoParams, setMultiAlgoParams,
        handleRunSimulation,
        canRunSimulation
    };
}
