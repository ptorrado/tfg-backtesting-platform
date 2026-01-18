// src/pages/Simulator.tsx
import React from "react";
import { PlayCircle, Loader2 } from "lucide-react";

import { useSimulator } from "../components/features/simulator/useSimulator";
import AssetSelector from "../components/features/simulator/AssetSelector";
import AlgorithmSelector from "../components/features/simulator/AlgorithmSelector";
import ConfigPanel from "../components/features/simulator/ConfigPanel";
import PriceChart from "../components/features/simulator/PriceChart";
import BatchModeToggle from "../components/features/simulator/BatchModeToggle";
import BatchConfiguration from "../components/features/simulator/BatchConfiguration";
import { Button } from "../components/ui/button";

const Simulator: React.FC = () => {
  const {
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
  } = useSimulator();

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            New Simulation
          </h1>
          <p className="text-muted-foreground text-sm">
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
              >
                <ConfigPanel
                  startDate={startDate}
                  setStartDate={setStartDate}
                  endDate={endDate}
                  setEndDate={setEndDate}
                  initialInvestment={initialInvestment}
                  setInitialInvestment={setInitialInvestment}
                />
              </BatchConfiguration>
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
            className="bg-primary/20 hover:bg-primary/30 text-foreground px-12 py-6 text-base font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed border border-primary/30"
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
