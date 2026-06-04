/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { ArrowRight, Shield, Award, Wrench, ChevronRight, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useApp } from "../context/AppContext";
import { IMAGE_HERO, IMAGE_CUSTOM_BUILD, IMAGE_SERVICE_BAY, IMAGE_PARTS, IMAGE_ISUZU_HERO, IMAGE_ISUZU_GAS_CHASSIS, IMAGE_ISUZU_DRY_VAN, IMAGE_REAL_SERVICE_BAY, IMAGE_ISUZU_FTR_REAL } from "../data";

const SLIDES = [
  {
    image: IMAGE_ISUZU_FTR_REAL,
    title: "2025 Isuzu F-Series FTR Cab & Chassis",
    tagline: "READY FOR YOUR CUSTOM BODY",
    badge: "NEW IN SHOWROOM",
    badgeColor: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    description: "New medium-duty Class 6 F-Series low-cab-forward Workhorse, perfect for 24' - 26' dry van bodies or flatbeds."
  },
  {
    image: IMAGE_ISUZU_DRY_VAN,
    title: "2025 Isuzu N-Series Diesel NRR Box Truck",
    tagline: "18 FT MORGAN DRY DRY VAN",
    badge: "READY TO ROLL IN QUEENS",
    badgeColor: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    description: "Equipped with high-capacity dry cargo body and rear tuckunder hydraulic aluminum lift gate."
  },
  {
    image: IMAGE_ISUZU_GAS_CHASSIS,
    title: "2025 Isuzu Class 5 NRR Gas Cab & Chassis",
    tagline: "6.6L V8 POWERHOUSE CHASSIS",
    badge: "HEAVY DUTY FRAME IN STOCK",
    badgeColor: "bg-purple-500/10 border-purple-500/20 text-purple-400",
    description: "Equipped with high-efficiency direct-injection V8 paired with Allison heavy-duty commercial transmission."
  },
  {
    image: IMAGE_REAL_SERVICE_BAY,
    title: "Diehl's 12-Bay Authorized Service Workstation",
    tagline: "REGISTERED NYS EMISSIONS STATION",
    badge: "OEM CERTIFIED TECHS",
    badgeColor: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    description: "Equipped with advanced OEM truck diagnostics and staffed by registered, direct factory-trained engineers."
  }
];

export default function Hero() {
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

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="hero" className="relative w-full bg-[#0A1428] overflow-hidden py-16 lg:py-28 border-b border-white/10">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[600px] h-full bg-gradient-to-l from-blue-900/20 to-transparent pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#FBBF24]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative px-4 mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          {/* Text Content */}
          <div className="lg:col-span-7 space-y-6 lg:space-y-8 text-center lg:text-left select-none z-10">
            {/* Tagline */}
            <div className="flex items-center justify-center lg:justify-start space-x-2">
              <span className="h-px w-8 bg-[#FBBF24]"></span>
              <span className="text-[#FBBF24] text-xs font-black uppercase tracking-[0.3em]">
                {settings.promoBanner || "QUEENS' PREMIER COMMERCIAL TRUCK HUB • EST. 1982"}
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-5xl font-black leading-[0.95] tracking-tighter uppercase italic text-white">
              {settings.heroHeading || "DIEHL’S TRUCK WORLD: NYC’S FLEET LIFELINE"}
            </h1>

            {/* Subheading */}
            <p className="max-w-xl mx-auto lg:mx-0 text-base sm:text-md text-slate-300 leading-relaxed font-bold">
              {settings.heroSubheading || "Atlantic Avenue's trusted commercial heavy dealer and DOT custom diagnostic bay since 1982."}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button
                onClick={() => scrollTo("inventory")}
                className="w-full sm:w-auto px-8 py-4 font-black uppercase tracking-widest text-xs bg-[#FBBF24] text-[#0A1428] hover:bg-[#FBBF24]/90 transition-all shadow-[0_0_20px_rgba(251,191,36,0.3)] flex items-center justify-center gap-2 active:scale-95 cursor-pointer rounded"
                id="hero-inventory-cta"
              >
                <span>View Inventory</span>
                <ArrowRight className="w-4 h-4 text-[#0A1428] stroke-[3]" />
              </button>
              <button
                onClick={() => scrollTo("customizer")}
                className="w-full sm:w-auto px-8 py-4 font-black uppercase tracking-widest text-xs border-2 border-white/20 text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer rounded"
                id="hero-customize-cta"
              >
                <span>Custom Builds</span>
                <ChevronRight className="w-4 h-4 text-[#FBBF24] stroke-[3]" />
              </button>
            </div>

            {/* Badges/Trust Metrics */}
            <div className="pt-6 border-t border-white/10 grid grid-cols-3 gap-4 max-w-lg mx-auto lg:mx-0 text-left">
              <div className="flex items-start gap-2.5">
                <Shield className="w-5 h-5 text-[#FBBF24] shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-white">NYS Inspected</div>
                  <div className="text-[10px] text-slate-400 font-bold">STATION #1355A</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Wrench className="w-5 h-5 text-[#FBBF24] shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-white">Master Techs</div>
                  <div className="text-[10px] text-slate-400 font-bold">CUMMINS/HINO/CAT</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Award className="w-5 h-5 text-[#FBBF24] shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-white">Queens Proud</div>
                  <div className="text-[10px] text-slate-400 font-bold">SINCE 1982</div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Image with slider */}
          <div className="lg:col-span-5 relative w-full flex flex-col items-center">
            <div 
              className="relative w-full max-w-md sm:max-w-lg lg:max-w-none rounded overflow-hidden border-l-4 border-[#FBBF24] shadow-2xl bg-[#050B16] group"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <div className="relative aspect-[4/3] sm:aspect-[16:10] lg:aspect-[4/3] overflow-hidden bg-slate-950">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentSlide}
                    src={SLIDES[currentSlide].image}
                    alt={SLIDES[currentSlide].title}
                    initial={{ opacity: 0, scale: 1.03 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 w-full h-full object-cover grayscale-[10%] contrast-[1.05]"
                    referrerPolicy="no-referrer"
                  />
                </AnimatePresence>
                
                {/* Visual Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A1428] via-transparent to-[#0A1428]/35 opacity-90 pointer-events-none" />

                {/* Left/Right manual click triggers */}
                <button
                  onClick={handlePrev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-[#050B16]/70 hover:bg-[#FBBF24] text-white hover:text-[#0A1428] rounded-full border border-white/5 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 z-10 cursor-pointer"
                  aria-label="Previous Slide"
                >
                  <ChevronLeft className="w-4 h-4 stroke-[3]" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-[#050B16]/70 hover:bg-[#FBBF24] text-white hover:text-[#0A1428] rounded-full border border-white/5 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 z-10 cursor-pointer"
                  aria-label="Next Slide"
                >
                  <ChevronRight className="w-4 h-4 stroke-[3]" />
                </button>

                {/* Live Caption Card Overlay (Bottom) */}
                <div className="absolute bottom-3 left-3 right-3 p-3.5 sm:p-4 rounded bg-[#0A1428]/95 border border-white/10 backdrop-blur-md z-10">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[9px] uppercase font-black tracking-[0.16em] text-[#FBBF24] truncate max-w-[180px]">
                      {SLIDES[currentSlide].tagline}
                    </span>
                    <span className={`px-2 py-0.5 border rounded text-[8px] font-black tracking-wider ${SLIDES[currentSlide].badgeColor}`}>
                      {SLIDES[currentSlide].badge}
                    </span>
                  </div>
                  
                  <h4 className="text-xs sm:text-sm font-black text-white uppercase italic tracking-tight line-clamp-1">
                    {SLIDES[currentSlide].title}
                  </h4>
                  
                  <p className="text-[9.5px] sm:text-[10.5px] text-slate-400 mt-1 line-clamp-2 leading-snug">
                    {SLIDES[currentSlide].description}
                  </p>
                </div>
              </div>
            </div>

            {/* Slide Selection Dots */}
            <div className="flex gap-2 mt-4 select-none">
              {SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    idx === currentSlide ? "w-6 bg-[#FBBF24]" : "w-1.5 bg-white/20 hover:bg-white/40"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
