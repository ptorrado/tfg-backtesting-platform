
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Settings2 } from "lucide-react";

interface ConfigCardProps {
    params?: Record<string, number> | null;
}

export default function ConfigCard({ params }: ConfigCardProps) {
    if (!params || Object.keys(params).length === 0) return null;

    return (
        <Card className="glass-card border-border bg-card">
            <CardHeader className="border-b border-border py-4">
                <CardTitle className="text-foreground flex items-center gap-2 text-base font-semibold">
                    <Settings2 className="w-4 h-4 text-orange-400" />
                    Strategy Parameters
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {Object.entries(params).map(([key, value]) => (
                        <div key={key} className="bg-secondary/30 rounded-lg p-3 border border-border/50">
                            <h4 className="text-xs text-muted-foreground uppercase font-medium mb-1">
                                {key.replace(/_/g, " ")}
                            </h4>
                            <p className="text-sm font-semibold text-foreground">
                                {value}
                            </p>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
