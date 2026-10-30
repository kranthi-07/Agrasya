"use client";

import React from "react";

interface AgrasyaLogoProps {
  size?: number;
  variant?: "badge" | "glyph";
  className?: string;
  glow?: boolean;
}

export function AgrasyaLogo({
  size = 36,
  variant = "badge",
  className = "",
  glow = false,
}: AgrasyaLogoProps) {
  const isBadge = variant === "badge";

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {glow && (
        <div
          className="absolute inset-0 rounded-2xl bg-agrasya-green/30 blur-md pointer-events-none"
          style={{ width: size, height: size }}
        />
      )}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full select-none"
      >
        <defs>
          <linearGradient id="agrGreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4ADE80" />
            <stop offset="50%" stopColor="#22C55E" />
            <stop offset="100%" stopColor="#15803D" />
          </linearGradient>
          <linearGradient id="agrBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0F2416" />
            <stop offset="100%" stopColor="#051009" />
          </linearGradient>
          <radialGradient id="agrHalo" cx="50%" cy="45%" r="45%">
            <stop offset="0%" stopColor="#22C55E" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#22C55E" stopOpacity="0" />
          </radialGradient>
        </defs>

        {isBadge && (
          <>
            {/* Background Rounded Shield / Squircle */}
            <rect width="100" height="100" rx="24" fill="url(#agrBgGrad)" />
            <circle cx="50" cy="45" r="32" fill="url(#agrHalo)" />
            <rect
              x="0.75"
              y="0.75"
              width="98.5"
              height="98.5"
              rx="23.25"
              stroke="url(#agrGreenGrad)"
              strokeWidth="1.5"
              strokeOpacity="0.3"
            />
          </>
        )}

        {/* Central 'A' Formed by Agriculture Shoots & Leaves */}
        {/* Left & Right Stalks */}
        <path
          d="M28 78 C31 66 38 42 47.5 24 C48.5 22 51.5 22 52.5 24 C62 42 69 66 72 78"
          stroke="url(#agrGreenGrad)"
          strokeWidth="6.5"
          strokeLinecap="round"
        />

        {/* Crossbar: Curved Agricultural Leaf */}
        <path
          d="M35 56 C44 51 56 51 65 56 C57 61 43 61 35 56 Z"
          fill="url(#agrGreenGrad)"
        />

        {/* Central Sprout Shoot growing upward inside 'A' */}
        <path
          d="M50 56 C47 46 46 38 50 30 C54 38 53 46 50 56 Z"
          fill="#86EFAC"
        />

        {/* Twin Foliage Crown Blossoming at Apex */}
        {/* Left leaf */}
        <path
          d="M50 22 C43 15 34 16 32 20 C33 26 42 26 50 22 Z"
          fill="url(#agrGreenGrad)"
        />
        {/* Right leaf */}
        <path
          d="M50 22 C57 15 66 16 68 20 C67 26 58 26 50 22 Z"
          fill="#4ADE80"
        />

        {/* Center Golden Seed / Bud */}
        <circle cx="50" cy="22" r="2.8" fill="#FEF08A" />
      </svg>
    </div>
  );
}
