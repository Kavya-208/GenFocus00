"use client";

import { useState, useCallback } from "react";
import { Play, BarChart3, Loader2, Sparkles, AlertCircle, Zap } from "lucide-react";
import { EarthBackground } from "@/components/earth-background";
import { Header } from "@/components/header";
import { ImageUpload } from "@/components/image-upload";
import { ChangeResult, type DetectedChange } from "@/components/change-result";
import { StatisticsPanel } from "@/components/statistics-panel";
import { Button } from "@/components/ui/button";

// Simulated change detection function
function simulateChangeDetection(): DetectedChange[] {
  const changeTypes: ("flood" | "deforestation" | "urbanization")[] = [
    "flood",
    "deforestation",
    "urbanization",
  ];
  
  const numChanges = Math.floor(Math.random() * 4) + 2;
  const changes: DetectedChange[] = [];

  for (let i = 0; i < numChanges; i++) {
    const type = changeTypes[Math.floor(Math.random() * changeTypes.length)];
    changes.push({
      id: `change-${i}`,
      type,
      x: Math.random() * 60 + 10,
      y: Math.random() * 50 + 15,
      width: Math.random() * 15 + 10,
      height: Math.random() * 15 + 10,
      confidence: Math.floor(Math.random() * 20) + 75,
    });
  }

  return changes;
}

export default function EarthObserverDashboard() {
  const [beforeImage, setBeforeImage] = useState<string | null>(null);
  const [afterImage, setAfterImage] = useState<string | null>(null);
  const [detectedChanges, setDetectedChanges] = useState<DetectedChange[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  const handleBeforeImageUpload = useCallback(
    (_file: File | null, preview: string | null) => {
      setBeforeImage(preview);
      setAnalysisComplete(false);
      setDetectedChanges([]);
    },
    []
  );

  const handleAfterImageUpload = useCallback(
    (_file: File | null, preview: string | null) => {
      setAfterImage(preview);
      setAnalysisComplete(false);
      setDetectedChanges([]);
    },
    []
  );

  const runAnalysis = useCallback(async () => {
    if (!beforeImage || !afterImage) return;

    setIsAnalyzing(true);
    setDetectedChanges([]);

    await new Promise((resolve) => setTimeout(resolve, 2500));

    const changes = simulateChangeDetection();
    setDetectedChanges(changes);
    setIsAnalyzing(false);
    setAnalysisComplete(true);
  }, [beforeImage, afterImage]);

  const canAnalyze = beforeImage && afterImage && !isAnalyzing;

  return (
    <div className="min-h-screen flex flex-col">
      <EarthBackground />
      <Header />

      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4 py-6">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-tight text-balance">
              Environmental Change Detection
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg text-pretty">
              Upload before and after satellite images to detect and classify
              environmental changes including floods, deforestation, and urbanization.
            </p>
          </div>

          {/* Upload Section */}
          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            <div className="group rounded-2xl bg-card/70 backdrop-blur-md border border-border/50 p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
              <ImageUpload
                label="Before Image"
                onImageUpload={handleBeforeImageUpload}
                preview={beforeImage}
              />
            </div>
            <div className="group rounded-2xl bg-card/70 backdrop-blur-md border border-border/50 p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
              <ImageUpload
                label="After Image"
                onImageUpload={handleAfterImageUpload}
                preview={afterImage}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={runAnalysis}
              disabled={!canAnalyze}
              size="lg"
              className="min-w-[200px] gap-2 h-12 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5" />
                  Run Analysis
                </>
              )}
            </Button>
            <Button
              onClick={() => setShowStatistics(true)}
              disabled={!analysisComplete}
              variant="outline"
              size="lg"
              className="min-w-[200px] gap-2 h-12 text-base font-semibold bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80"
            >
              <BarChart3 className="h-5 w-5" />
              View Statistics
            </Button>
          </div>

          {/* Status Message */}
          <div className="flex items-center justify-center min-h-[32px]">
            {!beforeImage || !afterImage ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 backdrop-blur-sm">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Upload both before and after images to begin analysis
                </p>
              </div>
            ) : isAnalyzing ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/30">
                <Loader2 className="h-4 w-4 text-primary animate-spin" />
                <p className="text-sm text-primary">
                  Processing satellite imagery...
                </p>
              </div>
            ) : analysisComplete ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 backdrop-blur-sm border border-accent/30">
                <Sparkles className="h-4 w-4 text-accent" />
                <p className="text-sm text-accent font-medium">
                  Analysis complete - {detectedChanges.length} change
                  {detectedChanges.length !== 1 ? "s" : ""} detected
                </p>
              </div>
            ) : null}
          </div>

          {/* Results Section */}
          <div className="rounded-2xl bg-card/70 backdrop-blur-md border border-border/50 p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                Detection Results
              </h3>
            </div>
            <ChangeResult
              beforeImage={beforeImage}
              afterImage={afterImage}
              detectedChanges={detectedChanges}
            />
          </div>

          {/* Change Type Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 py-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#3b82f6]/20 border border-[#3b82f6]/30 backdrop-blur-sm">
              <div className="w-3 h-3 rounded-full bg-[#3b82f6]" />
              <span className="text-sm font-medium text-[#3b82f6]">Flood</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#ef4444]/20 border border-[#ef4444]/30 backdrop-blur-sm">
              <div className="w-3 h-3 rounded-full bg-[#ef4444]" />
              <span className="text-sm font-medium text-[#ef4444]">Deforestation</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#f59e0b]/20 border border-[#f59e0b]/30 backdrop-blur-sm">
              <div className="w-3 h-3 rounded-full bg-[#f59e0b]" />
              <span className="text-sm font-medium text-[#f59e0b]">Urbanization</span>
            </div>
          </div>
        </div>
      </main>

      {/* Statistics Panel */}
      <StatisticsPanel
        isOpen={showStatistics}
        onClose={() => setShowStatistics(false)}
        detectedChanges={detectedChanges}
      />
    </div>
  );
}
