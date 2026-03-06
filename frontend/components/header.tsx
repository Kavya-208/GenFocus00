"use client";

import Image from "next/image";
import { Radio } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-card/60 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Earth Observer Logo"
            width={44}
            height={44}
            className="object-cover rounded-full"
          />
          <h1 className="text-lg font-bold text-foreground tracking-tight">
            Earth Observer
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/20 border border-accent/30">
            <Radio className="h-3 w-3 text-accent animate-pulse" />
            <span className="text-xs font-medium text-accent">Live</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-border">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium text-muted-foreground">System Online</span>
          </div>
        </div>
      </div>
    </header>
  );
}
