"use client";

import { useState, useCallback } from "react";
import { BarChart3, Loader2, Sparkles, AlertCircle, Zap } from "lucide-react";
import { EarthBackground } from "@/components/earth-background";
import { Header } from "@/components/header";
import { ImageUpload } from "@/components/image-upload";
import { ChangeResult, type DetectedChange } from "@/components/change-result";
import { StatisticsPanel } from "@/components/statistics-panel";
import { Button } from "@/components/ui/button";

interface ApiResult {
  change_detected: boolean;
  changed_pixels: number;
  affected_area_m2: number;
  confidence: number;
  change_mask: string;
}

async function detectChangeFromAPI(beforeFile: File, afterFile: File): Promise<ApiResult> {
  const formData = new FormData();
  formData.append("image_before", beforeFile);
  formData.append("image_after", afterFile);

  const response = await fetch("http://127.0.0.1:8000/detect-change", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) throw new Error("API call failed");
  return response.json();
}

export default function EarthObserverDashboard() {
  const [beforeImage, setBeforeImage] = useState<string | null>(null);
  const [afterImage, setAfterImage] = useState<string | null>(null);
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [detectedChanges, setDetectedChanges] = useState<DetectedChange[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [apiResult, setApiResult] = useState<ApiResult | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleBeforeImageUpload = useCallback((file: File | null, preview: string | null) => {
    setBeforeImage(preview);
    setBeforeFile(file);
    setAnalysisComplete(false);
    setDetectedChanges([]);
    setApiResult(null);
    setApiError(null);
  }, []);

  const handleAfterImageUpload = useCallback((file: File | null, preview: string | null) => {
    setAfterImage(preview);
    setAfterFile(file);
    setAnalysisComplete(false);
    setDetectedChanges([]);
    setApiResult(null);
    setApiError(null);
  }, []);

  const runAnalysis = useCallback(async () => {
    if (!beforeFile || !afterFile) return;
    setIsAnalyzing(true);
    setDetectedChanges([]);
    setApiError(null);

    try {
      const result = await detectChangeFromAPI(beforeFile, afterFile);
      setApiResult(result);
      if (result.change_detected) {
        setDetectedChanges([{
          id: "change-0",
          type: "urbanization",
          x: 20, y: 20, width: 60, height: 60,
          confidence: Math.round(result.confidence * 100),
        }]);
      }
      setAnalysisComplete(true);
    } catch (err) {
      setApiError("Failed to connect to backend. Make sure it's running on port 8000.");
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [beforeFile, afterFile]);

  const canAnalyze = beforeImage && afterImage && !isAnalyzing;

  return (
    <div className="min-h-screen flex flex-col">
      <EarthBackground />
      <Header />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8">

          <div className="text-center space-y-4 py-6">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-tight text-balance">
              Environmental Change Detection
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg text-pretty">
              Upload before and after satellite images to detect and classify
              environmental changes including floods, deforestation, and urbanization.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            <div className="group rounded-2xl bg-card/70 backdrop-blur-md border border-border/50 p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
              <ImageUpload label="Before Image" onImageUpload={handleBeforeImageUpload} preview={beforeImage} />
            </div>
            <div className="group rounded-2xl bg-card/70 backdrop-blur-md border border-border/50 p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
              <ImageUpload label="After Image" onImageUpload={handleAfterImageUpload} preview={afterImage} />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button onClick={runAnalysis} disabled={!canAnalyze} size="lg"
              className="min-w-[200px] gap-2 h-12 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow">
              {isAnalyzing ? (<><Loader2 className="h-5 w-5 animate-spin" />Analyzing...</>) : (<><Zap className="h-5 w-5" />Run Analysis</>)}
            </Button>
            <Button onClick={() => setShowStatistics(true)} disabled={!analysisComplete} variant="outline" size="lg"
              className="min-w-[200px] gap-2 h-12 text-base font-semibold bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80">
              <BarChart3 className="h-5 w-5" />View Statistics
            </Button>
          </div>

          <div className="flex items-center justify-center min-h-[32px]">
            {apiError ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/20 backdrop-blur-sm border border-red-500/30">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <p className="text-sm text-red-400">{apiError}</p>
              </div>
            ) : !beforeImage || !afterImage ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 backdrop-blur-sm">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Upload both before and after images to begin analysis</p>
              </div>
            ) : isAnalyzing ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/30">
                <Loader2 className="h-4 w-4 text-primary animate-spin" />
                <p className="text-sm text-primary">Processing satellite imagery...</p>
              </div>
            ) : analysisComplete ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 backdrop-blur-sm border border-accent/30">
                <Sparkles className="h-4 w-4 text-accent" />
                <p className="text-sm text-accent font-medium">
                  Analysis complete — {apiResult?.change_detected ? "Changes detected!" : "No changes detected"}
                </p>
              </div>
            ) : null}
          </div>

          {apiResult?.change_mask && (
            <div className="rounded-2xl bg-card/70 backdrop-blur-md border border-border/50 p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Change Mask</h3>
              </div>
              <img src={apiResult.change_mask} alt="Change Detection Mask" className="w-full rounded-xl border border-border/30" />
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center p-3 rounded-xl bg-secondary/40">
                  <p className="text-xs text-muted-foreground">Changed Pixels</p>
                  <p className="text-lg font-bold text-foreground">{apiResult.changed_pixels}</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-secondary/40">
                  <p className="text-xs text-muted-foreground">Affected Area</p>
                  <p className="text-lg font-bold text-foreground">{(apiResult.affected_area_m2 / 1000000).toFixed(2)} km²</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-secondary/40">
                  <p className="text-xs text-muted-foreground">Confidence</p>
                  <p className="text-lg font-bold text-foreground">{(apiResult.confidence * 100).toFixed(1)}%</p>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-2xl bg-card/70 backdrop-blur-md border border-border/50 p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Detection Results</h3>
            </div>
            <ChangeResult beforeImage={beforeImage} afterImage={afterImage} detectedChanges={detectedChanges} />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 py-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#3b82f6]/20 border border-[#3b82f6]/30 backdrop-blur-sm">
              <div className="w-3 h-3 rounded-full bg-[#3b82f6]" /><span className="text-sm font-medium text-[#3b82f6]">Flood</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#ef4444]/20 border border-[#ef4444]/30 backdrop-blur-sm">
              <div className="w-3 h-3 rounded-full bg-[#ef4444]" /><span className="text-sm font-medium text-[#ef4444]">Deforestation</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#f59e0b]/20 border border-[#f59e0b]/30 backdrop-blur-sm">
              <div className="w-3 h-3 rounded-full bg-[#f59e0b]" /><span className="text-sm font-medium text-[#f59e0b]">Urbanization</span>
            </div>
          </div>

        </div>
      </main>
      <StatisticsPanel isOpen={showStatistics} onClose={() => setShowStatistics(false)} detectedChanges={detectedChanges} />
    </div>
  );
}