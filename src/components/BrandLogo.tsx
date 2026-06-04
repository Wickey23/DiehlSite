/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
}

export default function BrandLogo({ size = "md" }: BrandLogoProps) {
  const headingSize = size === "sm" ? "text-lg" : size === "lg" ? "text-3xl" : "text-xl sm:text-2xl";
  const subSize = size === "sm" ? "text-[8px]" : size === "lg" ? "text-xs" : "text-[9px] sm:text-[10px]";

  return (
    <div className="flex flex-col select-none group">
      {/* Upper core brand line */}
      <h1 className={`${headingSize} font-black italic tracking-tight text-white font-sans uppercase leading-none transition-colors group-hover:text-[#FBBF24]`}>
        Diehl's <span className="transform skew-x-3 inline-block">Truck World</span>
      </h1>
      
      {/* Lower tagline with orange moving track and subtext */}
      <div className="flex items-center gap-2 mt-1 leading-none">
        {/* Slanted "moving forward" block */}
        <div className="relative overflow-hidden inline-flex items-center bg-gradient-to-r from-orange-500 via-amber-500 to-transparent pr-4 pl-1 py-0.5 rounded-sm transform -skew-x-6">
          <span className="text-[8px] sm:text-[9px] italic font-extrabold text-white tracking-wide lowercase">
            moving forward
          </span>
        </div>
        
        {/* Grey subheading */}
        <span className={`${subSize} font-bold text-slate-400 font-sans tracking-wide uppercase`}>
          New York Freightliner
        </span>
      </div>
    </div>
  );
}
