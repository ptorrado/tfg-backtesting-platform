// src/pages/Simulator.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PlayCircle, Loader2 } from "lucide-react";

import {
  runSimulation as runSimulationApi,
  SimulationRequest as ApiSimulationRequest,
} from "../api/simulations";
import { createPageUrl } from "../utils";

import { Button } from "../components/ui/button";
import AssetSelector, {
  AssetCategoryKey,
} from "../components/simulator/AssetSelector";
import AlgorithmSelector, {
  AlgoParams,
  MultiAlgoParams,
} from "../components/simulator/AlgorithmSelector";
import ConfigPanel from "../components/simulator/ConfigPanel";
import PriceChart from "../components/simulator/PriceChart";
import BatchModeToggle from "../components/simulator/BatchModeToggle";
import BatchConfiguration from "../components/simulator/BatchConfiguration";

const Simulator: React.FC = () => {
  const navigate = useNavigate();

  const [assetName, setAssetName] = useState<string>("");
  const [algorithm, setAlgorithm] = useState<string>("");

  const [startDate, setStartDate] = useState<string>("2023-01-01");
  const [endDate, setEndDate] = useState<string>("2024-01-01");
  const [initialInvestment, setInitialInvestment] = useState<number>(10000);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // Asset category (solo front, el backend no lo usa directamente)
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

  // =========================================================
  // HANDLER PRINCIPAL
  // =========================================================

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

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="min-h-screen bg-[#0f1419] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-100 mb-2">
            New Simulation
          </h1>
          <p className="text-gray-400 text-sm">
            Configure parameters and backtest your trading strategy
          </p>
        </div>

        <div className="mb-6">
          <BatchModeToggle
            batchMode={batchMode}
            setBatchMode={setBatchMode}
            advancedMode={advancedMode}
            setAdvancedMode={setAdvancedMode}
          />
        </div>

        {batchMode ? (
          <>
            <div className="mb-6">
              <BatchConfiguration
                batchName={batchName}
                setBatchName={setBatchName}
                batchType={batchType}
                setBatchType={setBatchType}
                assetType={assetType}
                setAssetType={setAssetType}
                selectedAssets={selectedAssets}
                setSelectedAssets={setSelectedAssets}
                selectedAlgorithms={selectedAlgorithms}
                setSelectedAlgorithms={setSelectedAlgorithms}
                baseAsset={baseAsset}
                setBaseAsset={setBaseAsset}
                baseAlgorithm={baseAlgorithm}
                setBaseAlgorithm={setBaseAlgorithm}
                advancedMode={advancedMode}
                algorithmParams={algorithmParams}
                setAlgorithmParams={setAlgorithmParams}
                multiAlgoParams={multiAlgoParams}
                setMultiAlgoParams={setMultiAlgoParams}
              />
            </div>

            <div className="mb-6">
              <ConfigPanel
                startDate={startDate}
                setStartDate={setStartDate}
                endDate={endDate}
                setEndDate={setEndDate}
                initialInvestment={initialInvestment}
                setInitialInvestment={setInitialInvestment}
              />
            </div>
          </>
        ) : (
          <>
            {/* ARRIBA: Asset Selection + Trading Algorithm */}
            <div className="grid lg:grid-cols-2 gap-6 mb-6 items-stretch">
              <div className="h-full">
                <AssetSelector
                  assetType={assetType}
                  setAssetType={setAssetType}
                  assetName={assetName}
                  setAssetName={setAssetName}
                />
              </div>

              <div className="h-full">
                <AlgorithmSelector
                  multiMode={false}
                  algorithm={algorithm}
                  setAlgorithm={setAlgorithm}
                  advancedMode={advancedMode}
                  algorithmParams={algorithmParams}
                  setAlgorithmParams={setAlgorithmParams}
                />
              </div>
            </div>

            {/* CHART */}
            {assetName && (
              <div className="mb-6">
                <PriceChart assetName={assetName} assetType={assetType} />
              </div>
            )}

            {/* ABAJO: Configuración */}
            <div className="mb-6">
              <ConfigPanel
                startDate={startDate}
                setStartDate={setStartDate}
                endDate={endDate}
                setEndDate={setEndDate}
                initialInvestment={initialInvestment}
                setInitialInvestment={setInitialInvestment}
              />
            </div>
          </>
        )}

        <div className="flex justify-center">
          <Button
            onClick={handleRunSimulation}
            disabled={!canRunSimulation || isRunning}
            size="lg"
            className="bg-white/15 hover:bg-white/20 text-white px-12 py-6 text-base font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed border border-white/30"
          >
            {isRunning ? (
              <>
                <Loader2
                  className="w-5 h-5 mr-2 animate-spin"
                  strokeWidth={2}
                />
                Running {batchMode ? "Multi-" : ""}Simulation
              </>
            ) : (
              <>
                <PlayCircle className="w-5 h-5 mr-2" strokeWidth={2} />
                Run {batchMode ? "Multi-" : ""}Simulation
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Simulator;
