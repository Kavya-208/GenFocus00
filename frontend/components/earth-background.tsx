"use client";

import Image from "next/image";

export function EarthBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Earth satellite image */}
      <Image
        src="/earth-background.png"
        alt="Earth from space"
        fill
        priority
        quality={100}
        className="object-cover object-center"
      />
      
      {/* Dark gradient overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
      
      {/* Subtle blue tint overlay */}
      <div className="absolute inset-0 bg-[#0a1628]/30" />
      
      {/* Vignette effect */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)',
        }}
      />
    </div>
  );
}
