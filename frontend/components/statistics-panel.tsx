"use client";

import { X, Droplets, Trees, Building2, TrendingUp, MapPin, Activity, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DetectedChange } from "./change-result";

interface StatisticsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  detectedChanges: DetectedChange[];
}

export function StatisticsPanel({ isOpen, onClose, detectedChanges }: StatisticsPanelProps) {
  if (!isOpen) return null;

  const floodChanges = detectedChanges.filter((c) => c.type === "flood");
  const deforestationChanges = detectedChanges.filter((c) => c.type === "deforestation");
  const urbanizationChanges = detectedChanges.filter((c) => c.type === "urbanization");

  const calculateTotalArea = (changes: DetectedChange[]) => {
    return changes.reduce((acc, c) => acc + c.width * c.height, 0);
  };

  const calculateAvgConfidence = (changes: DetectedChange[]) => {
    if (changes.length === 0) return 0;
    return Math.round(
      changes.reduce((acc, c) => acc + c.confidence, 0) / changes.length
    );
  };

  const totalArea = calculateTotalArea(detectedChanges);

  const stats = [
    {
      type: "Flood Detection",
      icon: Droplets,
      color: "#3b82f6",
      bgColor: "rgba(59, 130, 246, 0.15)",
      borderColor: "rgba(59, 130, 246, 0.4)",
      count: floodChanges.length,
      area: calculateTotalArea(floodChanges).toFixed(1),
      confidence: calculateAvgConfidence(floodChanges),
      percentage: totalArea > 0 ? ((calculateTotalArea(floodChanges) / totalArea) * 100).toFixed(0) : 0,
    },
    {
      type: "Deforestation",
      icon: Trees,
      color: "#ef4444",
      bgColor: "rgba(239, 68, 68, 0.15)",
      borderColor: "rgba(239, 68, 68, 0.4)",
      count: deforestationChanges.length,
      area: calculateTotalArea(deforestationChanges).toFixed(1),
      confidence: calculateAvgConfidence(deforestationChanges),
      percentage: totalArea > 0 ? ((calculateTotalArea(deforestationChanges) / totalArea) * 100).toFixed(0) : 0,
    },
    {
      type: "Urbanization",
      icon: Building2,
      color: "#f59e0b",
      bgColor: "rgba(245, 158, 11, 0.15)",
      borderColor: "rgba(245, 158, 11, 0.4)",
      count: urbanizationChanges.length,
      area: calculateTotalArea(urbanizationChanges).toFixed(1),
      confidence: calculateAvgConfidence(urbanizationChanges),
      percentage: totalArea > 0 ? ((calculateTotalArea(urbanizationChanges) / totalArea) * 100).toFixed(0) : 0,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-2xl bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/50 bg-secondary/20">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60 shadow-lg shadow-primary/20">
              <BarChart3 className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Analysis Statistics
              </h2>
              <p className="text-sm text-muted-foreground">
                Detailed breakdown of detected environmental changes
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center p-5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30">
              <MapPin className="h-6 w-6 text-primary mb-3" />
              <span className="text-3xl font-bold text-foreground">
                {detectedChanges.length}
              </span>
              <span className="text-xs text-muted-foreground font-medium">Total Regions</span>
            </div>
            <div className="flex flex-col items-center p-5 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/30">
              <Activity className="h-6 w-6 text-accent mb-3" />
              <span className="text-3xl font-bold text-foreground">
                {calculateAvgConfidence(detectedChanges)}%
              </span>
              <span className="text-xs text-muted-foreground font-medium">Avg Confidence</span>
            </div>
            <div className="flex flex-col items-center p-5 rounded-xl bg-gradient-to-br from-destructive/20 to-destructive/5 border border-destructive/30">
              <TrendingUp className="h-6 w-6 text-destructive mb-3" />
              <span className="text-3xl font-bold text-foreground">
                {totalArea.toFixed(1)}%
              </span>
              <span className="text-xs text-muted-foreground font-medium">Total Area</span>
            </div>
          </div>

          {/* Detailed Stats */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              Change Type Breakdown
            </h3>
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.type}
                  className="flex items-center justify-between p-4 rounded-xl border transition-all hover:scale-[1.01]"
                  style={{
                    backgroundColor: stat.bgColor,
                    borderColor: stat.borderColor,
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-xl"
                      style={{ backgroundColor: stat.bgColor, border: `1px solid ${stat.borderColor}` }}
                    >
                      <Icon className="h-6 w-6" style={{ color: stat.color }} />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{stat.type}</p>
                      <p className="text-sm text-muted-foreground">
                        {stat.count} region{stat.count !== 1 ? "s" : ""} detected
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <p className="text-lg font-bold" style={{ color: stat.color }}>
                        {stat.area}%
                      </p>
                      <p className="text-xs text-muted-foreground">Area</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-foreground">
                        {stat.confidence}%
                      </p>
                      <p className="text-xs text-muted-foreground">Confidence</p>
                    </div>
                    <div className="w-16">
                      <div className="h-2 rounded-full bg-secondary overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${stat.percentage}%`,
                            backgroundColor: stat.color 
                          }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground text-center mt-1">
                        {stat.percentage}%
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              Analysis completed on {new Date().toLocaleDateString("en-US", { 
                weekday: "long",
                year: "numeric",
                month: "long", 
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              })}
            </p>
            <Button onClick={onClose} size="sm">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
