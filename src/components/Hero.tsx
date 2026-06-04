/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { ArrowRight, Shield, Wrench, Award, ChevronRight, ChevronLeft, ArrowUpRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useApp } from "../context/AppContext";
import { 
  IMAGE_HERO, IMAGE_CUSTOM_BUILD, IMAGE_SERVICE_BAY, IMAGE_PARTS, 
  IMAGE_ISUZU_HERO, IMAGE_ISUZU_GAS_CHASSIS, IMAGE_ISUZU_DRY_VAN, 
  IMAGE_REAL_SERVICE_BAY, IMAGE_ISUZU_FTR_REAL 
} from "../data";

interface HeroProps {
  // Added optional navigation prop so the four CTA blocks can redirect beautifully across pages
  onNavigate?: (page: "showroom" | "parts" | "services" | "about", sectionId?: string) => void;
}

const SLIDES = [
  {
    image: IMAGE_ISUZU_FTR_REAL,
    title: "Heavy Chassis & Vocations",
    tagline: "WESTERN STAR & FREIGHTLINER REBUILDS",
    badge: "HEAVY SNOW PLOW READY",
    badgeColor: "bg-orange-500/10 border-orange-500/20 text-orange-400",
    description: "Equipped with massive steel plows, heavy dump beds, or custom lift axles. Built specifically for demanding New York winters and vocational municipal operations."
  },
  {
    image: IMAGE_ISUZU_DRY_VAN,
    title: "18 FT Dry Vans & Cargo Boxes",
    tagline: "ISUZU NRR SPECIALISTS",
    badge: "FLEET READY IN QUEENS",
    badgeColor: "bg-sky-500/10 border-sky-500/20 text-sky-400",
    description: "Premium low-cab-forward design for superior maneuverability in tight Brooklyn and Queens streets. Complete with heavy-duty liftgates."
  },
  {
    image: IMAGE_ISUZU_GAS_CHASSIS,
    title: "Class 5 NRR Utility Gas Platforms",
    tagline: "6.6L V8 ALLISON SYSTEM",
    badge: "DIRECT FROM FACTORY CORES",
    badgeColor: "bg-amber-500/10 border-amber-500/20 text-amber-500",
    description: "V8 powerhouse with heavy-duty framing. Recommended for general contracting, landscaping, or custom commercial utility bodies."
  }
];

export default function Hero({ onNavigate }: HeroProps) {
  const { settings } = useApp();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isHovered]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentSlide((prev) => (prev === 0 ? SLIDES.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
  };

  const executeNavigation = (page: "showroom" | "parts" | "services" | "about", id?: string) => {
    if (onNavigate) {
      onNavigate(page, id);
    } else {
      const el = id ? document.getElementById(id) : null;
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      } else {
        window.scrollTo({ top: 300, behavior: "smooth" });
      }
    }
  };

  return (
    <section id="hero" className="relative w-full bg-[#030712] overflow-hidden border-b border-white/10">
      
      {/* Visual Queens industrial overlay block (Gritty brick wall styling effect) */}
      <div className="absolute inset-0 bg-repeat opacity-[0.04] pointer-events-none" 
           style={{ 
             backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h20v20H0V0zm20 20h20v20H20V20z' fill='%23fff' fill-opacity='.1' fill-rule='evenodd'/%3E%3C/svg%3E")` 
           }} 
      />
      
      {/* Atmospheric Orange and Blue neon spotlights representing the original site glow */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-orange-600/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-12 right-12 w-[500px] h-[500px] bg-sky-600/15 blur-[150px] pointer-events-none" />

      {/* 2. THE MAIN HERO SECTION */}
      <div className="relative px-4 py-12 md:py-16 mx-auto max-w-7xl z-10">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
          
          {/* Header text descriptions */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left select-none">
            
            {/* Top Badge Tag */}
            <div className="flex items-center justify-center lg:justify-start space-x-2.5">
              <span className="h-0.5 w-6 bg-orange-500 rounded-sm"></span>
              <span className="text-orange-500 text-[11px] font-black uppercase tracking-[0.25em] font-mono">
                {settings.promoBanner || "RICHMOND HILL'S REVENUE WORKHORSE • EST. 1982"}
              </span>
            </div>

            {/* Direct bold display headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-[0.9] tracking-tighter uppercase italic text-white font-sans">
              DIEHL’S TRUCK WORLD <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-500 to-orange-600">
                KEEPING NY FLEETS MOVING
              </span>
            </h1>

            {/* Professional, uptime-oriented subtitle */}
            <p className="max-w-xl mx-auto lg:mx-0 text-sm md:text-base text-slate-300 leading-relaxed font-semibold">
              {settings.heroSubheading || "Atlantic Avenue’s certified powerhouse for Freightliner chassis, Western Star configurations, and authorized low-cab Isuzu medium-duty rigs. Engineered to support your bottom line & uptime."}
            </p>

            {/* Micro Trust badges */}
            <div className="py-4 border-t border-b border-white/5 grid grid-cols-3 gap-2.5 text-left font-mono">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-orange-500 shrink-0" />
                <div>
                  <div className="text-[10px] font-black text-white uppercase leading-none">NYS STATION</div>
                  <span className="text-[9px] text-slate-400">#1355A APPROVED</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-sky-400 shrink-0" />
                <div>
                  <div className="text-[10px] font-black text-white uppercase leading-none">12 SERVICE BAYS</div>
                  <span className="text-[9px] text-slate-400">FULLY EQUIPPED</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                  <div className="text-[10px] font-black text-white uppercase leading-none">EST. 1982</div>
                  <span className="text-[9px] text-slate-400">QUEENS, NY PROUD</span>
                </div>
              </div>
            </div>

            {/* CTA action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
              <button
                onClick={() => executeNavigation("showroom", "inventory")}
                className="w-full sm:w-auto px-7 py-3.5 font-black uppercase tracking-widest text-[11px] bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 hover:from-amber-400 hover:to-orange-500 transition-all shadow-lg shadow-orange-600/10 flex items-center justify-center gap-2 active:scale-95 cursor-pointer rounded-sm"
                id="hero-inventory-cta-rebuild"
              >
                <span>View Inventory</span>
                <ArrowRight className="w-4 h-4 text-slate-950 stroke-[3]" />
              </button>
              
              <button
                onClick={() => executeNavigation("showroom", "customizer")}
                className="w-full sm:w-auto px-7 py-3.5 font-black uppercase tracking-widest text-[11px] border border-white/20 text-white hover:bg-white/5 transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer rounded-sm"
                id="hero-body-build-cta-rebuild"
              >
                <span>Vocational Customizer</span>
                <ArrowUpRight className="w-4 h-4 text-orange-500" />
              </button>
            </div>
          </div>

          {/* Interactive slider featuring customized vocational configurations */}
          <div className="lg:col-span-6 relative w-full flex flex-col items-center">
            
            {/* The main high-contrast frame */}
            <div 
              className="relative w-full max-w-md sm:max-w-lg lg:max-w-none rounded-sm overflow-hidden border-l-4 border-orange-500 shadow-2xl bg-black group"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <div className="relative aspect-[16/11] overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentSlide}
                    src={SLIDES[currentSlide].image}
                    alt={SLIDES[currentSlide].title}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 w-full h-full object-cover contrast-[1.1] brightness-[0.88]"
                    referrerPolicy="no-referrer"
                  />
                </AnimatePresence>
                
                {/* Visual Dark gradient edges for high contrast and readabilities */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40 pointer-events-none" />

                {/* Left/Right manual sliders */}
                <button
                  onClick={handlePrev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/85 hover:bg-orange-500 text-white hover:text-black rounded-sm border border-white/10 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 z-10 cursor-pointer"
                  aria-label="Back Slide"
                >
                  <ChevronLeft className="w-4 h-4 stroke-[3]" />
                </button>
                
                <button
                  onClick={handleNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/85 hover:bg-orange-500 text-white hover:text-black rounded-sm border border-white/10 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 z-10 cursor-pointer"
                  aria-label="Forward Slide"
                >
                  <ChevronRight className="w-4 h-4 stroke-[3]" />
                </button>

                {/* Label floating card */}
                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-sm bg-black/90 border border-white/10 backdrop-blur-md">
                  <div className="flex items-center justify-between gap-1 mb-1 font-mono">
                    <span className="text-[9.5px] uppercase font-black text-orange-500 tracking-wider">
                      {SLIDES[currentSlide].tagline}
                    </span>
                    <span className={`px-2 py-0.5 border text-[8px] font-black uppercase tracking-wider ${SLIDES[currentSlide].badgeColor}`}>
                      {SLIDES[currentSlide].badge}
                    </span>
                  </div>
                  
                  <h4 className="text-xs sm:text-sm font-black text-white uppercase italic tracking-tight">
                    {SLIDES[currentSlide].title}
                  </h4>
                  
                  <p className="text-[10px] text-slate-350 mt-1 line-clamp-2 leading-relaxed">
                    {SLIDES[currentSlide].description}
                  </p>
                </div>
              </div>
            </div>

            {/* Slide Index Indicators */}
            <div className="flex gap-2.5 mt-3 select-none">
              {SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    idx === currentSlide ? "w-7 bg-orange-500" : "w-1.5 bg-white/20 hover:bg-white/40"
                  }`}
                  aria-label={`Go to ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. FLAGGED BRAND PARTNER BAR (Mirroring: Western Star, Freightliner, Isuzu logo badges) */}
      <div className="w-full bg-[#050B16] border-t border-b border-white/5 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-center items-center gap-6 md:gap-14 px-4 select-none">
          <div className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest font-mono">
            // AUTHORIZED DEALER & REBUILD CENTRE:
          </div>

          {/* Western Star */}
          <div className="flex items-center gap-2 px-4 py-1.5 bg-black/40 border border-white/5 rounded-sm grayscale hover:grayscale-0 transition-all cursor-crosshair">
            <span className="text-red-500 font-extrabold text-sm tracking-tighter">W★V</span>
            <span className="text-white font-black italic text-xs uppercase tracking-wider font-sans">WESTERN STAR</span>
          </div>

          {/* Freightliner Logo Badge */}
          <div className="flex items-center gap-1.5 px-4 py-1.5 bg-black/40 border border-white/5 rounded-sm grayscale hover:grayscale-0 transition-all cursor-crosshair">
            <span className="text-[10px] text-zinc-400 font-black tracking-[0.2em] font-sans">FREIGHTLINER</span>
          </div>

          {/* Isuzu Trucks Emblem */}
          <div className="flex items-center px-4 py-1.5 bg-red-600 rounded-sm hover:-translate-y-0.5 transition-transform cursor-crosshair">
            <span className="text-white font-extrabold text-xs tracking-widest font-sans uppercase">ISUZU TRUCK</span>
          </div>
        </div>
      </div>

      {/* 4. FOUR-COLUMN INTERACTIVE BRAND CARS WITH TRANSPARENT SOLID OVERLAYS */}
      {/* Mirroring exactly: NEW & USED TRUCKS (orange), PARTS DEPT (blue), SERVICE DEPT (orange), SPECIALS & SALES (blue) */}
      <div className="w-full bg-black py-1 px-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1 w-full max-w-ffffff">
          
          {/* Card 1: NEW & USED TRUCKS */}
          <div 
            onClick={() => executeNavigation("showroom", "inventory")}
            className="group relative h-48 sm:h-56 cursor-pointer overflow-hidden flex flex-col justify-end text-left p-5 transition-all border border-transparent hover:border-orange-500/50"
            id="hero-category-trucks"
          >
            {/* Background image component with state filters */}
            <img 
              src={IMAGE_HERO} 
              alt="Browse New and Used Vehicles" 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 brightness-[0.6] grayscale-[20%]"
              referrerPolicy="no-referrer"
            />
            {/* Orange Gradient Overlay Mimicking original site */}
            <div className="absolute inset-0 bg-gradient-to-t from-orange-600/85 via-orange-600/40 to-transparent mix-blend-multiply opacity-90 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative z-10 space-y-1 text-white">
              <h3 className="text-2xl font-black uppercase tracking-tight italic leading-none text-white drop-shadow-md">
                NEW & USED <br />
                <span className="text-amber-100 font-black">TRUCKS</span>
              </h3>
              <p className="text-[10px] text-orange-100 font-bold max-w-[200px] leading-tight">
                Inspect our multi-brand Freightliner & Isuzu stock.
              </p>
              <div className="pt-2 text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-1 group-hover:translate-x-1.5 transition-transform">
                <span>BROWSE INVENTORY »</span>
              </div>
            </div>
          </div>

          {/* Card 2: PARTS DEPT */}
          <div 
            onClick={() => executeNavigation("parts")}
            className="group relative h-48 sm:h-56 cursor-pointer overflow-hidden flex flex-col justify-end text-left p-5 transition-all border border-transparent hover:border-sky-500/50"
            id="hero-category-parts"
          >
            <img 
              src={IMAGE_PARTS} 
              alt="Search OEM parts inventory" 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 brightness-[0.6] grayscale-[20%]"
              referrerPolicy="no-referrer"
            />
            {/* Blue Gradient Overlay Mimicking original site */}
            <div className="absolute inset-0 bg-gradient-to-t from-sky-700/85 via-sky-600/40 to-transparent mix-blend-multiply opacity-90 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative z-10 space-y-1 text-white">
              <h3 className="text-2xl font-black uppercase tracking-tight italic leading-none text-white drop-shadow-md">
                PARTS <br />
                <span className="text-sky-100 font-black">DEPT.</span>
              </h3>
              <p className="text-[10px] text-sky-100 font-bold max-w-[200px] leading-tight">
                Search 200+ fast SKUs or login to order OEM parts.
              </p>
              <div className="pt-2 text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-1 group-hover:translate-x-1.5 transition-transform">
                <span>FIND & BUY PARTS »</span>
              </div>
            </div>
          </div>

          {/* Card 3: SERVICE DEPT */}
          <div 
            onClick={() => executeNavigation("services")}
            className="group relative h-48 sm:h-56 cursor-pointer overflow-hidden flex flex-col justify-end text-left p-5 transition-all border border-transparent hover:border-orange-500/50"
            id="hero-category-services"
          >
            <img 
              src={IMAGE_SERVICE_BAY} 
              alt="Live 12 bay shop scheduler" 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 brightness-[0.6] grayscale-[20%]"
              referrerPolicy="no-referrer"
            />
            {/* Orange Gradient Overlay Mimicking original site */}
            <div className="absolute inset-0 bg-gradient-to-t from-orange-600/85 via-orange-600/40 to-transparent mix-blend-multiply opacity-90 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative z-10 space-y-1 text-white">
              <h3 className="text-2xl font-black uppercase tracking-tight italic leading-none text-white drop-shadow-md">
                SERVICE <br />
                <span className="text-amber-100 font-black">DEPT.</span>
              </h3>
              <p className="text-[10px] text-orange-100 font-bold max-w-[200px] leading-tight">
                Book diagnostics, state inspections, or repairs.
              </p>
              <div className="pt-2 text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-1 group-hover:translate-x-1.5 transition-transform">
                <span>SCHEDULE SERVICE »</span>
              </div>
            </div>
          </div>

          {/* Card 4: SPECIALS & SALES */}
          <div 
            onClick={() => executeNavigation("showroom", "customizer")}
            className="group relative h-48 sm:h-56 cursor-pointer overflow-hidden flex flex-col justify-end text-left p-5 transition-all border border-transparent hover:border-sky-500/50"
            id="hero-category-specials"
          >
            <img 
              src={IMAGE_CUSTOM_BUILD} 
              alt="Custom vocational builds" 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 brightness-[0.6] grayscale-[20%]"
              referrerPolicy="no-referrer"
            />
            {/* Blue Gradient Overlay Mimicking original site */}
            <div className="absolute inset-0 bg-gradient-to-t from-sky-700/85 via-sky-600/40 to-transparent mix-blend-multiply opacity-90 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative z-10 space-y-1 text-white">
              <h3 className="text-2xl font-black uppercase tracking-tight italic leading-none text-white drop-shadow-md">
                SPECIALS <br />
                <span className="text-sky-100 font-black">& SALES</span>
              </h3>
              <p className="text-[10px] text-sky-100 font-bold max-w-[200px] leading-tight">
                Configure build bodies, municipal dump trucks or plows.
              </p>
              <div className="pt-2 text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-1 group-hover:translate-x-1.5 transition-transform">
                <span>LEARN MORE »</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
