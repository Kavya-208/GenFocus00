"use client";

import { useState, useCallback } from "react";
import { Upload, X, Image as ImageIcon, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  label: string;
  onImageUpload: (file: File | null, preview: string | null) => void;
  preview: string | null;
}

export function ImageUpload({ label, onImageUpload, preview }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => {
          onImageUpload(file, reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    },
    [onImageUpload]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          onImageUpload(file, reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    },
    [onImageUpload]
  );

  const clearImage = useCallback(() => {
    onImageUpload(null, null);
  }, [onImageUpload]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn(
            "h-2 w-2 rounded-full transition-colors",
            preview ? "bg-green-500" : "bg-muted-foreground/50"
          )} />
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">{label}</h3>
        </div>
        {preview && (
          <button
            onClick={clearImage}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded-md hover:bg-destructive/10"
          >
            <X className="h-3 w-3" />
            Remove
          </button>
        )}
      </div>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-300 overflow-hidden",
          "h-56 md:h-72",
          isDragging
            ? "border-primary bg-primary/10 scale-[1.02]"
            : "border-border/60 hover:border-primary/50 hover:bg-secondary/20",
          preview && "border-solid border-primary/40"
        )}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt={label}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/30 backdrop-blur-sm">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              <span className="text-xs font-medium text-green-500">Image loaded</span>
            </div>
          </>
        ) : (
          <label className="flex flex-col items-center justify-center gap-4 cursor-pointer w-full h-full p-6 group">
            <div className={cn(
              "flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300",
              isDragging 
                ? "bg-primary/20 scale-110" 
                : "bg-secondary/50 group-hover:bg-secondary group-hover:scale-105"
            )}>
              {isDragging ? (
                <Upload className="h-7 w-7 text-primary animate-bounce" />
              ) : (
                <ImageIcon className="h-7 w-7 text-muted-foreground group-hover:text-foreground transition-colors" />
              )}
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-foreground">
                {isDragging ? "Drop your image here" : "Upload satellite image"}
              </p>
              <p className="text-xs text-muted-foreground">
                Drag & drop or click to browse
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <span className="text-xs text-primary font-medium">PNG, JPG, TIFF supported</span>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        )}
      </div>
    </div>
  );
}
