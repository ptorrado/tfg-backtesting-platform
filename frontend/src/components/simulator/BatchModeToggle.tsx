// src/components/simulator/BatchModeToggle.tsx
import React from "react";
import { Card, CardContent } from "../ui/card";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Layers, Zap } from "lucide-react";

export interface BatchModeToggleProps {
  batchMode: boolean;
  setBatchMode: (value: boolean) => void;
  advancedMode: boolean;
  setAdvancedMode: (value: boolean) => void;
}

export default function BatchModeToggle({
  batchMode,
  setBatchMode,
  advancedMode,
  setAdvancedMode,
}: BatchModeToggleProps) {
  return (
    <Card className="glass-card border-white/5">
      <CardContent className="p-5">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Multi-sim mode */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
                <Layers className="w-4 h-4 text-blue-400" strokeWidth={2} />
              </div>
              <div>
                <Label
                  htmlFor="batch-mode"
                  className="text-gray-100 font-medium text-sm cursor-pointer"
                >
                  Multi-Simulation Mode
                </Label>
                <p className="text-xs text-gray-500 mt-0.5">
                  Compare multiple assets or algorithms
                </p>
              </div>
            </div>
            <Switch
              id="batch-mode"
              checked={batchMode}
              onCheckedChange={setBatchMode}
              className="data-[state=checked]:bg-blue-600"
            />
          </div>

          {/* Advanced mode */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
                <Zap className="w-4 h-4 text-amber-400" strokeWidth={2} />
              </div>
              <div>
                <Label
                  htmlFor="advanced-mode"
                  className="text-gray-100 font-medium text-sm cursor-pointer"
                >
                  Advanced Mode
                </Label>
                <p className="text-xs text-gray-500 mt-0.5">
                  Customize algorithm parameters
                </p>
              </div>
            </div>
            <Switch
              id="advanced-mode"
              checked={advancedMode}
              onCheckedChange={setAdvancedMode}
              className="data-[state=checked]:bg-amber-600"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
