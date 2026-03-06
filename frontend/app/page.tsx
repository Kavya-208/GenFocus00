"use client";

import { useState, useCallback } from "react";
import { BarChart3, Loader2, Sparkles, AlertCircle, Zap } from "lucide-react";
import { EarthBackground } from "@/components/earth-background";
import { Header } from "@/components/header";
import { ImageUpload } from "@/components/image-upload";
import { ChangeResult, type DetectedChange } from "@/components/change-result";
import { StatisticsPanel } from "@/components/statistics-panel";
import dynamic from "next/dynamic";
const MapView = dynamic(
  () => import("@/components/map-view").then((mod) => mod.MapView),
  { ssr: false, loading: () => (
    <div className="w-full h-[500px] rounded-2xl bg-secondary/40 flex items-center justify-center">
      <p className="text-muted-foreground text-sm">Loading map...</p>
    </div>
  )}
);
import { Button } from "@/components/ui/button";

interface ApiResult {
  change_detected: boolean;
  changed_pixels: number;
  affected_area_m2: number;
  confidence: number;
  change_mask: string;
  before_image?: string;
  after_image?: string;
}

async function detectChangeFromAPI(
  beforeFile: File,
  afterFile: File
): Promise<ApiResult> {
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
  // ── Image upload state ──────────────────────────────────
  const [beforeImage, setBeforeImage] = useState<string | null>(null);
  const [afterImage, setAfterImage] = useState<string | null>(null);
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);

  // ── Map state ───────────────────────────────────────────
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [date1, setDate1] = useState("2020-01-01");
  const [date2, setDate2] = useState("2024-01-01");
  const [isLocationAnalyzing, setIsLocationAnalyzing] = useState(false);

  // ── Results state ───────────────────────────────────────
  const [detectedChanges, setDetectedChanges] = useState<DetectedChange[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [apiResult, setApiResult] = useState<ApiResult | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // ── Chat state ──────────────────────────────────────────
  const [chatMessages, setChatMessages] = useState<{ role: string; text: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  // ── Handlers ────────────────────────────────────────────
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

  // ── Manual image analysis ───────────────────────────────
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

  // ── Location based analysis ─────────────────────────────
  const runLocationAnalysis = useCallback(async () => {
    if (!selectedLocation) return;
    setIsLocationAnalyzing(true);
    setApiError(null);
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/detect-change-location?lat=${selectedLocation.lat}&lon=${selectedLocation.lng}&date1=${date1}&date2=${date2}`,
        { method: "POST" }
      );
      const result = await response.json();
      if (result.error) {
        setApiError("Location analysis error: " + result.error);
        return;
      }
      setApiResult(result);
      setAnalysisComplete(true);
      if (result.change_detected) {
        setDetectedChanges([{
          id: "change-0",
          type: "urbanization",
          x: 20, y: 20, width: 60, height: 60,
          confidence: Math.round(result.confidence * 100),
        }]);
      }
    } catch (err) {
      setApiError("Failed to connect to backend.");
      console.error(err);
    } finally {
      setIsLocationAnalyzing(false);
    }
  }, [selectedLocation, date1, date2]);

  // ── AI Chat ─────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setIsChatLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          analysis_context: apiResult || {}
        }),
      });
      const data = await response.json();
      setChatMessages(prev => [...prev, { role: "agent", text: data.response }]);
    } catch {
      setChatMessages(prev => [...prev, {
        role: "agent",
        text: "Sorry, AI agent is not connected yet."
      }]);
    } finally {
      setIsChatLoading(false);
    }
  }, [chatInput, apiResult]);

  const canAnalyze = beforeImage && afterImage && !isAnalyzing;

  return (
    <div className="min-h-screen flex flex-col">
      <EarthBackground />
      <Header />

      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8">

          {/* ── Hero ────────────────────────────────────── */}
          <div className="text-center space-y-4 py-6">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-tight text-balance">
              Environmental Change Detection
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg text-pretty">
              Select a location on the map or upload satellite images to detect
              environmental changes including floods, deforestation, and urbanization.
            </p>
          </div>

          {/* ── Google Map Section ───────────────────────── */}
          <div className="rounded-2xl bg-card/70 backdrop-blur-md border border-border/50 p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                🛰️ Select Location on Map
              </h3>
            </div>

            {/* Date pickers */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Before Date
                </label>
                <input
                  type="date"
                  value={date1}
                  onChange={(e) => setDate1(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/50 text-sm text-foreground focus:outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  After Date
                </label>
                <input
                  type="date"
                  value={date2}
                  onChange={(e) => setDate2(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/50 text-sm text-foreground focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>

            {/* Map */}
            <MapView
              onLocationSelect={(lat, lng) => setSelectedLocation({ lat, lng })}
              changeMask={apiResult?.change_mask}
              selectedLocation={selectedLocation}
            />

            {/* Analyze location button */}
            {selectedLocation && (
              <button
                onClick={runLocationAnalysis}
                disabled={isLocationAnalyzing}
                className="mt-4 w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50 hover:bg-primary/90 transition-colors"
              >
                {isLocationAnalyzing
                  ? "⏳ Fetching NASA satellite data..."
                  : "🛰️ Analyze This Location"}
              </button>
            )}
          </div>

          {/* ── OR Divider ───────────────────────────────── */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-border/50" />
            <span className="text-sm text-muted-foreground font-medium">
              OR upload images manually
            </span>
            <div className="flex-1 h-px bg-border/50" />
          </div>

          {/* ── Manual Upload Section ────────────────────── */}
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

          {/* ── Action Buttons ───────────────────────────── */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={runAnalysis}
              disabled={!canAnalyze}
              size="lg"
              className="min-w-[200px] gap-2 h-12 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow"
            >
              {isAnalyzing ? (
                <><Loader2 className="h-5 w-5 animate-spin" />Analyzing...</>
              ) : (
                <><Zap className="h-5 w-5" />Run Analysis</>
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

          {/* ── Status Message ───────────────────────────── */}
          <div className="flex items-center justify-center min-h-[32px]">
            {apiError ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/20 backdrop-blur-sm border border-red-500/30">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <p className="text-sm text-red-400">{apiError}</p>
              </div>
            ) : !beforeImage || !afterImage ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 backdrop-blur-sm">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Select a location on map or upload both images to begin
                </p>
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
                  Analysis complete —{" "}
                  {apiResult?.change_detected ? "Changes detected!" : "No changes detected"}
                </p>
              </div>
            ) : null}
          </div>

          {/* ── Results: NASA Before/After Images ────────── */}
          {apiResult?.before_image && apiResult?.after_image && (
            <div className="rounded-2xl bg-card/70 backdrop-blur-md border border-border/50 p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                  NASA Satellite Images
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Before ({date1})</p>
                  <img
                    src={apiResult.before_image}
                    alt="Before"
                    className="w-full rounded-xl border border-border/30"
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">After ({date2})</p>
                  <img
                    src={apiResult.after_image}
                    alt="After"
                    className="w-full rounded-xl border border-border/30"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Change Mask + Stats ──────────────────────── */}
          {apiResult?.change_mask && (
            <div className="rounded-2xl bg-card/70 backdrop-blur-md border border-border/50 p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                  Change Mask
                </h3>
              </div>
              <img
                src={apiResult.change_mask}
                alt="Change Detection Mask"
                className="w-full rounded-xl border border-border/30"
              />
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center p-3 rounded-xl bg-secondary/40">
                  <p className="text-xs text-muted-foreground">Changed Pixels</p>
                  <p className="text-lg font-bold text-foreground">{apiResult.changed_pixels}</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-secondary/40">
                  <p className="text-xs text-muted-foreground">Affected Area</p>
                  <p className="text-lg font-bold text-foreground">
                    {(apiResult.affected_area_m2 / 1000000).toFixed(2)} km²
                  </p>
                </div>
                <div className="text-center p-3 rounded-xl bg-secondary/40">
                  <p className="text-xs text-muted-foreground">Confidence</p>
                  <p className="text-lg font-bold text-foreground">
                    {(apiResult.confidence * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Detection Results ────────────────────────── */}
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

          {/* ── Legend ───────────────────────────────────── */}
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

          {/* ── AI Agent Chat ─────────────────────────────── */}
          <div className="rounded-2xl bg-card/70 backdrop-blur-md border border-border/50 p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                AI Agent — Ask Me Anything
              </h3>
            </div>
            <div className="h-64 overflow-y-auto space-y-3 mb-4 p-3 rounded-xl bg-secondary/20">
              {chatMessages.length === 0 && (
                <p className="text-sm text-muted-foreground text-center mt-8">
                  Run an analysis first, then ask me about the results!
                </p>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-foreground"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-secondary px-4 py-2 rounded-2xl text-sm text-muted-foreground animate-pulse">
                    AI is thinking...
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Ask: What actions should I take for this flood?"
                className="flex-1 px-4 py-2 rounded-xl bg-secondary/50 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              />
              <button
                onClick={sendMessage}
                disabled={isChatLoading || !chatInput.trim()}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
              >
                Send
              </button>
            </div>
          </div>

        </div>
      </main>

      <StatisticsPanel
        isOpen={showStatistics}
        onClose={() => setShowStatistics(false)}
        detectedChanges={detectedChanges}
      />
    </div>
  );
}