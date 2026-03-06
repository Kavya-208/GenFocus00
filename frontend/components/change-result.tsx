"use client";

import { useEffect, useRef, useState } from "react";
import { Satellite, Droplets, Trees, Building2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChangeResultProps {
  beforeImage: string | null;
  afterImage: string | null;
  detectedChanges: DetectedChange[];
}

export interface DetectedChange {
  id: string;
  type: "flood" | "deforestation" | "urbanization";
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

const changeTypeConfig = {
  flood: {
    color: "#3b82f6",
    borderColor: "rgba(59, 130, 246, 0.9)",
    bgColor: "rgba(59, 130, 246, 0.35)",
    icon: Droplets,
    label: "Flood",
  },
  deforestation: {
    color: "#ef4444",
    borderColor: "rgba(239, 68, 68, 0.9)",
    bgColor: "rgba(239, 68, 68, 0.35)",
    icon: Trees,
    label: "Deforestation",
  },
  urbanization: {
    color: "#f59e0b",
    borderColor: "rgba(245, 158, 11, 0.9)",
    bgColor: "rgba(245, 158, 11, 0.35)",
    icon: Building2,
    label: "Urbanization",
  },
};

export function ChangeResult({ beforeImage, afterImage, detectedChanges }: ChangeResultProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [showOverlay, setShowOverlay] = useState(true);
  const [viewMode, setViewMode] = useState<"after" | "before">("after");

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  useEffect(() => {
    if (!canvasRef.current || dimensions.width === 0) return;
    
    const displayImage = viewMode === "after" ? afterImage : beforeImage;
    if (!displayImage) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;

      ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);

      if (showOverlay && viewMode === "after" && detectedChanges.length > 0) {
        detectedChanges.forEach((change) => {
          const config = changeTypeConfig[change.type];
          const x = (change.x / 100) * dimensions.width;
          const y = (change.y / 100) * dimensions.height;
          const w = (change.width / 100) * dimensions.width;
          const h = (change.height / 100) * dimensions.height;

          // Fill with semi-transparent color
          ctx.fillStyle = config.bgColor;
          ctx.fillRect(x, y, w, h);

          // Draw solid border
          ctx.strokeStyle = config.borderColor;
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, w, h);

          // Draw corner markers
          const cornerSize = 10;
          ctx.strokeStyle = config.color;
          ctx.lineWidth = 3;
          ctx.lineCap = "round";

          // Top-left corner
          ctx.beginPath();
          ctx.moveTo(x, y + cornerSize);
          ctx.lineTo(x, y);
          ctx.lineTo(x + cornerSize, y);
          ctx.stroke();

          // Top-right corner
          ctx.beginPath();
          ctx.moveTo(x + w - cornerSize, y);
          ctx.lineTo(x + w, y);
          ctx.lineTo(x + w, y + cornerSize);
          ctx.stroke();

          // Bottom-left corner
          ctx.beginPath();
          ctx.moveTo(x, y + h - cornerSize);
          ctx.lineTo(x, y + h);
          ctx.lineTo(x + cornerSize, y + h);
          ctx.stroke();

          // Bottom-right corner
          ctx.beginPath();
          ctx.moveTo(x + w - cornerSize, y + h);
          ctx.lineTo(x + w, y + h);
          ctx.lineTo(x + w, y + h - cornerSize);
          ctx.stroke();

          // Draw confidence label
          ctx.font = "bold 11px sans-serif";
          const labelText = `${config.label} ${change.confidence}%`;
          const textMetrics = ctx.measureText(labelText);
          const labelPadding = 6;
          const labelHeight = 20;
          
          ctx.fillStyle = config.color;
          ctx.beginPath();
          ctx.roundRect(
            x, 
            y - labelHeight - 4, 
            textMetrics.width + labelPadding * 2, 
            labelHeight, 
            4
          );
          ctx.fill();
          
          ctx.fillStyle = "#ffffff";
          ctx.fillText(labelText, x + labelPadding, y - 10);
        });
      }
    };
    img.src = displayImage;
  }, [afterImage, beforeImage, detectedChanges, dimensions, showOverlay, viewMode]);

  if (!afterImage) {
    return (
      <div className="flex flex-col items-center justify-center h-64 md:h-80 rounded-xl border border-dashed border-border/60 bg-secondary/10">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/50 mb-4">
          <Satellite className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground mb-1">No Analysis Results Yet</p>
        <p className="text-xs text-muted-foreground text-center max-w-xs">
          Upload both before and after satellite images, then run analysis to see detected changes
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "before" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("before")}
            disabled={!beforeImage}
            className="text-xs"
          >
            Before
          </Button>
          <Button
            variant={viewMode === "after" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("after")}
            className="text-xs"
          >
            After
          </Button>
        </div>
        
        {detectedChanges.length > 0 && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              {Object.entries(changeTypeConfig).map(([key, config]) => {
                const Icon = config.icon;
                const count = detectedChanges.filter((c) => c.type === key).length;
                if (count === 0) return null;
                return (
                  <div key={key} className="flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5" style={{ color: config.color }} />
                    <span className="text-xs font-medium" style={{ color: config.color }}>
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowOverlay(!showOverlay)}
              className={cn(
                "gap-1.5 text-xs",
                !showOverlay && "text-muted-foreground"
              )}
            >
              {showOverlay ? (
                <Eye className="h-3.5 w-3.5" />
              ) : (
                <EyeOff className="h-3.5 w-3.5" />
              )}
              Overlay
            </Button>
          </div>
        )}
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="relative h-64 md:h-96 rounded-xl overflow-hidden border border-border/60 bg-secondary/20"
      >
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        
        {/* View mode indicator */}
        <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/10">
          <span className="text-xs font-medium text-white">
            {viewMode === "after" ? "After" : "Before"} Image
          </span>
        </div>
        
        {detectedChanges.length > 0 && showOverlay && viewMode === "after" && (
          <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-destructive/80 backdrop-blur-sm">
            <span className="text-xs font-medium text-destructive-foreground">
              {detectedChanges.length} Change{detectedChanges.length !== 1 ? "s" : ""} Detected
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
