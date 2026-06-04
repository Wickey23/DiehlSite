/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Hammer, Sparkles, Check, Send, Award, Layers } from "lucide-react";
import { IMAGE_CUSTOM_BUILD } from "../data";
import { useApp } from "../context/AppContext";

interface Chassis {
  id: string;
  name: string;
  basePrice: number;
  weightGvwr: string;
  description: string;
}

interface BodyOption {
  id: string;
  name: string;
  price: number;
  features: string[];
}

interface CustomAccessory {
  id: string;
  name: string;
  price: number;
  weight: number;
}

const CHASSIS_SELECTION: Chassis[] = [
  { id: "ch-med", name: "Isuzu Class 5 NRR Gas Cab-Chassis", basePrice: 58900, weightGvwr: "19,500 lbs GVWR", description: "6.6L V8 powerplant. Absolute favorite for local landscape & urban NYC delivery fleets." },
  { id: "ch-heavy", name: "Isuzu Class 6 FTR Diesel Cab-Chassis", basePrice: 92500, weightGvwr: "25,950 lbs GVWR", description: "Cummins B6.7 Workhorse diesel. Outstanding Class 6 capacity for logistics & flatbeds." },
  { id: "ch-super", name: "Isuzu Class 7 FVR Custom Tandem-Axle", basePrice: 114800, weightGvwr: "33,000 lbs GVWR", description: "Heavy-duty Class 7 chassis customized for municipal dumps, refuse, and extra-heavy loads." }
];

const BODY_SELECTION: BodyOption[] = [
  { id: "by-flat", name: "Heavy-Duty Steel Stake Flatbed", price: 8500, features: ["Recessed steel rings", "Removable wood stakes", "Cab bulkhead shield"] },
  { id: "by-service", name: "Knapheide Premium Fleet Service Body", price: 14200, features: ["Slam-action locking compartments", "Standard interior trays", "Tailgate drop board"] },
  { id: "by-dump", name: "Reinforced 12ft Contractors Dump Box", price: 18500, features: ["Heavy-duty cab protector", "Scissor lift hoist unit", "Three-way tail gate"] },
  { id: "by-dry", name: "Morgan 26ft Aluminum Commercial Dry Box", price: 11500, features: ["Translucent LED roof sheet", "1-1/8\" hardwood decks", "Dual side rows e-track"] }
];

const ACCESSORIES_LIST: CustomAccessory[] = [
  { id: "ac-gate", name: "Maxon 2,500 lbs Aluminum Liftgate", price: 5450, weight: 650 },
  { id: "ac-crane", name: "Stellar 5,000 lbs Hydraulic Service Crane", price: 13500, weight: 1100 },
  { id: "ac-box", name: "Dual Underbed Steel Toolboxes (36\")", price: 1450, weight: 160 },
  { id: "ac-air", name: "VMAC Professional Underhood Air System", price: 6200, weight: 220 },
  { id: "ac-light", name: "LED Emergency strobe Roof Light Bar", price: 650, weight: 15 }
];

const COLORS = [
  { name: "Prussian Commercial Blue", code: "bg-blue-800 border-blue-650", hex: "#1E3A8A" },
  { name: "Dealership Fleet Yellow", code: "bg-amber-400 border-amber-300", hex: "#F59E0B" },
  { name: "Pure Gloss Commercial White", code: "bg-slate-50 border-slate-200", hex: "#F8FAFC" },
  { name: "Industrial Deep Graphite", code: "bg-slate-705 border-slate-600", hex: "#475569" }
];

export default function BuildCustomizer() {
  const { addLead } = useApp();
  const [selectedChassis, setSelectedChassis] = useState<Chassis>(CHASSIS_SELECTION[0]);
  const [selectedBody, setSelectedBody] = useState<BodyOption>(BODY_SELECTION[1]);
  const [activeAccIds, setActiveAccIds] = useState<string[]>(["ac-box", "ac-light"]);
  const [paintColor, setPaintColor] = useState(COLORS[2]);
  const [customForm, setCustomForm] = useState({ buyerName: "", buyerEmail: "", phone: "", notes: "" });
  const [sentStatus, setSentStatus] = useState(false);

  const toggleAccessory = (id: string) => {
    setActiveAccIds((prev) =>
      prev.includes(id) ? prev.filter((acc) => acc !== id) : [...prev, id]
    );
  };

  const getActiveAccessories = () => {
    return ACCESSORIES_LIST.filter((acc) => activeAccIds.includes(acc.id));
  };

  const calculateTotals = () => {
    const accessoryPrice = getActiveAccessories().reduce((sum, item) => sum + item.price, 0);
    const accessoryWeight = getActiveAccessories().reduce((sum, item) => sum + item.weight, 0);
    const totalPrice = selectedChassis.basePrice + selectedBody.price + accessoryPrice;
    return { totalPrice, accessoryWeight };
  };

  const { totalPrice, accessoryWeight } = calculateTotals();

  const handleBuildSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customForm.buyerName || !customForm.buyerEmail) return;

    // Compile dynamic upfit details for the CRM Lead message
    const accList = getActiveAccessories().map(a => a.name).join(", ");
    const buildDetails = `Chassis: ${selectedChassis.name} (${selectedChassis.weightGvwr}) | Body: ${selectedBody.name} | Accessories: [${accList || "None"}] | Paint: ${paintColor.name}`;

    addLead({
      name: customForm.buyerName,
      companyName: "Custom Self-Spec Build",
      email: customForm.buyerEmail,
      phone: customForm.phone || "Requested Contact",
      message: customForm.notes || "No extra requirements described.",
      source: "Custom Build",
      details: buildDetails
    });

    setSentStatus(true);
    setTimeout(() => {
      setSentStatus(false);
      setCustomForm({ buyerName: "", buyerEmail: "", phone: "", notes: "" });
    }, 6000);
  };

  return (
    <section id="customizer" className="w-full bg-[#0A1428] py-16 lg:py-24 border-b border-white/10 text-slate-100 scroll-mt-20">
      <div className="px-4 mx-auto max-w-7xl">
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16 select-none">
          <div className="text-xs uppercase tracking-[0.25em] font-black text-[#FBBF24] flex items-center justify-center gap-1.5">
            <Hammer className="w-4 h-4" />
            <span>Heavy-Duty Personalization</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white uppercase italic">
            Custom Build Engineering Spec-Out
          </h2>
          <p className="text-slate-400 text-sm">
            Design your brand-new commercial fleet vehicle with real, researched MSRP starting figures in the New York region. Combine authorized bodies with realistic payloads and accessories built for high performance.
          </p>
        </div>

        {/* Large Layout Grid */}
        <div className="grid gap-10 lg:grid-cols-12 items-start">
          {/* Controls - Left */}
          <div className="lg:col-span-7 space-y-8">
            {/* Step 1: Chassis */}
            <div className="p-6 rounded bg-[#050B16] border border-white/10 space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-[#FBBF24] text-[#0A1428] flex items-center justify-center text-xs font-black">1</span>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">// Choose Genuine Isuzu Cab-Chassis Framework</h3>
              </div>
              <div className="space-y-3">
                {CHASSIS_SELECTION.map((ch) => {
                  const isSel = selectedChassis.id === ch.id;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => setSelectedChassis(ch)}
                      className={`w-full p-4 rounded text-left border transition-all cursor-pointer flex justify-between items-center ${
                        isSel
                          ? "bg-[#0A1428] border-[#FBBF24] text-white shadow-[0_0_15px_rgba(251,191,36,0.1)]"
                          : "bg-black/40 border-white/5 text-slate-400 hover:border-[#FBBF24]/40 hover:bg-[#0A1428]"
                      }`}
                      id={`chassis-btn-${ch.id}`}
                    >
                      <div className="space-y-1 max-w-[70%]">
                        <span className="text-sm font-black text-white tracking-wide block">{ch.name}</span>
                        <span className="text-xs text-slate-400 block font-medium leading-relaxed">{ch.description}</span>
                        <span className="inline-block text-[10px] uppercase tracking-widest font-black px-2 py-0.5 rounded bg-black/60 text-[#FBBF24]">{ch.weightGvwr}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-black text-[#FBBF24] block">${ch.basePrice.toLocaleString()}</span>
                        <span className="text-[10px] text-slate-500 block font-bold tracking-wider uppercase">Researched MSRP</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Custom Utility Body */}
            <div className="p-6 rounded bg-[#050B16] border border-white/10 space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-[#FBBF24] text-[#0A1428] flex items-center justify-center text-xs font-black">2</span>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">// Select Vocational Body Mounting</h3>
              </div>
              <div className="grid sm:grid-cols-2 gap-3.5">
                {BODY_SELECTION.map((bd) => {
                  const isSel = selectedBody.id === bd.id;
                  return (
                    <button
                      key={bd.id}
                      onClick={() => setSelectedBody(bd)}
                      className={`p-4 rounded text-left border transition-all cursor-pointer flex flex-col justify-between space-y-4 min-h-[160px] ${
                        isSel
                          ? "bg-[#0A1428] border-[#FBBF24] text-white shadow-[0_0_15px_rgba(251,191,36,0.1)]"
                          : "bg-black/40 border-white/5 text-slate-400 hover:border-[#FBBF24]/40 hover:bg-[#0A1428]"
                      }`}
                      id={`body-btn-${bd.id}`}
                    >
                      <div className="space-y-1">
                        <span className="text-sm font-black text-white tracking-wide block">{bd.name}</span>
                        <div className="pt-2 space-y-1">
                          {bd.features.slice(0, 2).map((feat, idx) => (
                            <span key={idx} className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#FBBF24] shrink-0" />
                              <span>{feat}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="pt-2 border-t border-white/5 flex justify-between items-center w-full">
                        <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black">Fab Labor & Mount</span>
                        <span className="text-sm font-black text-[#FBBF24]">${bd.price.toLocaleString()}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Performance Bolt-on Accessories */}
            <div className="p-6 rounded bg-[#050B16] border border-white/10 space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-[#FBBF24] text-[#0A1428] flex items-center justify-center text-xs font-black">3</span>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">// Equip Auxiliary Upfit Hardware</h3>
              </div>
              <div className="space-y-2.5">
                {ACCESSORIES_LIST.map((acc) => {
                  const isActive = activeAccIds.includes(acc.id);
                  return (
                    <button
                      key={acc.id}
                      onClick={() => toggleAccessory(acc.id)}
                      className={`w-full p-3.5 rounded border text-left transition-all cursor-pointer flex justify-between items-center ${
                        isActive
                          ? "bg-[#0A1428] border-[#FBBF24] text-white shadow-[0_0_15px_rgba(251,191,36,0.1)]"
                          : "bg-black/40 border-white/5 text-slate-400 hover:border-[#FBBF24]/40"
                      }`}
                      id={`acc-btn-${acc.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                          isActive ? "bg-[#FBBF24] border-[#FBBF24]" : "bg-transparent border-white/20"
                        }`}>
                          {isActive && <Check className="w-3.5 h-3.5 text-[#0A1428] stroke-[3]" />}
                        </div>
                        <div>
                          <span className="text-xs sm:text-sm font-black text-white uppercase tracking-wider block">{acc.name}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Estimated Weight: {acc.weight} lbs</span>
                        </div>
                      </div>
                      <span className="text-xs sm:text-sm font-black text-[#FBBF24] shrink-0">+${acc.price.toLocaleString()}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 4: Fleet Paint Code */}
            <div className="p-6 rounded bg-[#050B16] border border-white/10 space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-[#FBBF24] text-[#0A1428] flex items-center justify-center text-xs font-black">4</span>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">// Select Exterior Fleet Polyurethane Coat</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {COLORS.map((col, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPaintColor(col)}
                    className={`p-3 rounded border text-center transition-all cursor-pointer flex flex-col items-center gap-2 ${
                      paintColor.name === col.name ? "bg-[#0A1428] border-[#FBBF24]" : "bg-black/40 border-white/5"
                    }`}
                    id={`paint-btn-${idx}`}
                  >
                    <div className={`w-8 h-8 rounded shadow-inner ${col.code}`} />
                    <span className="text-[10px] text-slate-300 font-black uppercase tracking-wider leading-tight text-center">{col.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Blueprint Summary Card - Right */}
          <div className="lg:col-span-5 lg:sticky lg:top-[96px] lg:max-h-[calc(100vh-140px)] lg:overflow-y-auto pr-1.5 space-y-6 scroll-smooth scrollbar-thin">
            <div className="p-6 sm:p-8 rounded bg-[#050B16] border border-white/10 shadow-2xl space-y-6 relative overflow-hidden">
              {/* Highlight ribbon */}
              <div className="absolute top-0 right-0 left-0 h-1.5 bg-[#FBBF24]" />

              <div className="flex items-center justify-between select-none">
                <div>
                  <h4 className="text-xs uppercase tracking-widest font-black text-[#FBBF24]">REAL-TIME ENGINEERING</h4>
                  <p className="text-lg font-black uppercase italic text-white mt-0.5">Vector Custom Blueprint</p>
                </div>
                <Layers className="w-5 h-5 text-slate-500" />
              </div>

              {/* Dynamic Interactive Render Blueprint - Directly responds to Choices */}
              <div className="p-4 rounded bg-black/60 border border-white/5 relative select-none">
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-[#0A1428] border border-white/10 text-[8px] font-mono text-amber-400 tracking-wider">
                  HUD SYSTEM: LIVE MATRIX
                </div>
                
                {/* SVG vector rendering of custom low cab forward Isuzu upfitted vehicle */}
                <div className="flex justify-center items-center py-6">
                  <div className="w-full max-w-[340px] aspect-[16/9] flex items-center justify-center relative bg-slate-950/40 p-2 rounded border border-white/5">
                    
                    <svg
                      viewBox="0 0 540 240"
                      className="w-full h-auto drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      {/* Grid background (Blueprint theme) */}
                      <defs>
                        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                        </pattern>
                      </defs>
                      <rect width="540" height="240" fill="url(#grid)" rx="4" />

                      {/* Dimensions guide lines */}
                      <path d="M 60 215 L 480 215" stroke="rgba(251,191,36,0.25)" strokeWidth="1" strokeDasharray="3,3" />
                      <line x1="60" y1="210" x2="60" y2="220" stroke="rgba(251,191,36,0.35)" />
                      <line x1="480" y1="210" x2="480" y2="220" stroke="rgba(251,191,36,0.35)" />
                      <text x="270" y="228" fill="#FBBF24" fontSize="9" fontFamily="monospace" textAnchor="middle" className="font-extrabold uppercase tracking-widest">
                        {selectedChassis.id === "ch-med" ? " wheelbase: 150\" / 176\" OAL" : selectedChassis.id === "ch-heavy" ? "wheelbase: 212\" / 250\" OAL" : "wheelbase: 248\" / 288\" OAL"}
                      </text>

                      {/* MAIN FRAME CHASSIS RAILS (Static structural background) */}
                      <path d="M 120 162 L 480 162 L 480 168 L 120 168 Z" fill="#4B5563" />
                      {/* Cab connector structure */}
                      <rect x="135" y="152" width="25" height="10" fill="#1E293B" />
                      {/* Front and rear bumper bumpers */}
                      <rect x="52" y="174" width="16" height="8" fill="#0F172A" rx="1" />
                      <path d="M 52 154 L 68 154 L 68 182 L 52 182 Z" fill="#1E293B" />

                      {/* DYNAMIC BODY MOUNTS (Renders based on selectedBody.id) */}
                      
                      {/* 1. Stakes / Flatbed Body */}
                      {selectedBody.id === "by-flat" && (
                        <g id="body-flatbed-render">
                          {/* Wood Stake Rails */}
                          <rect x="160" y="112" width="315" height="42" fill="#78350F" opacity="0.9" />
                          {/* Steel frame bed border */}
                          <rect x="156" y="150" width="324" height="12" fill="#374151" />
                          {/* Stake pockets verticals */}
                          <line x1="168" y1="112" x2="168" y2="150" stroke="#FBBF24" strokeWidth="2" />
                          <line x1="210" y1="112" x2="210" y2="150" stroke="#94A3B8" strokeWidth="2" />
                          <line x1="260" y1="112" x2="260" y2="150" stroke="#94A3B8" strokeWidth="2" />
                          <line x1="310" y1="112" x2="310" y2="150" stroke="#94A3B8" strokeWidth="2" />
                          <line x1="360" y1="112" x2="360" y2="150" stroke="#94A3B8" strokeWidth="2" />
                          <line x1="410" y1="112" x2="410" y2="150" stroke="#94A3B8" strokeWidth="2" />
                          <line x1="460" y1="112" x2="460" y2="150" stroke="#FBBF24" strokeWidth="2" />
                          {/* Cab Bulkhead Shield */}
                          <path d="M 152 75 L 158 75 L 158 150 L 152 150 Z" fill="#1F2937" />
                          <line x1="152" y1="95" x2="158" y2="95" stroke="#94A3B8" strokeWidth="1" />
                        </g>
                      )}

                      {/* 2. Knapheide Premium Fleet Service Body */}
                      {selectedBody.id === "by-service" && (
                        <g id="body-service-render">
                          {/* Low side boxes */}
                          <rect x="156" y="105" width="314" height="48" fill="#334155" rx="2" />
                          {/* Storage Doors outlines */}
                          <rect x="168" y="109" width="45" height="40" fill="none" stroke="#64748B" strokeWidth="1.5" />
                          <circle cx="178" cy="129" r="2.5" fill="#94A3B8" />
                          
                          <rect x="220" y="109" width="55" height="40" fill="none" stroke="#64748B" strokeWidth="1.5" />
                          <circle cx="230" cy="129" r="2.5" fill="#94A3B8" />

                          <rect x="282" y="109" width="85" height="40" fill="none" stroke="#64748B" strokeWidth="1.5" />
                          <line x1="282" y1="125" x2="367" y2="125" stroke="#475569" strokeWidth="1" />
                          <circle cx="324" cy="117" r="2" fill="#94A3B8" />

                          <rect x="374" y="109" width="45" height="40" fill="none" stroke="#64748B" strokeWidth="1.5" />
                          <circle cx="384" cy="129" r="2.5" fill="#94A3B8" />

                          <rect x="424" y="109" width="40" height="40" fill="none" stroke="#64748B" strokeWidth="1.5" />
                          <circle cx="434" cy="129" r="2.5" fill="#94A3B8" />
                          
                          {/* Premium Top Box Rails */}
                          <path d="M 152 95 L 464 95 L 464 105 L 152 105 Z" fill="#1E293B" />
                        </g>
                      )}

                      {/* 3. Reinforced Contractors 12ft Steel Dump Box */}
                      {selectedBody.id === "by-dump" && (
                        <g id="body-dump-render">
                          {/* Aggressive high-walled dump container box */}
                          <path d="M 162 70 L 440 70 L 440 152 L 162 152 Z" fill="#1E293B" />
                          {/* Reinforced support pillars verticals */}
                          <rect x="185" y="70" width="10" height="82" fill="#374151" />
                          <rect x="225" y="70" width="10" height="82" fill="#374151" />
                          <rect x="265" y="70" width="10" height="82" fill="#374151" />
                          <rect x="305" y="70" width="10" height="82" fill="#374151" />
                          <rect x="345" y="70" width="10" height="82" fill="#374151" />
                          <rect x="385" y="70" width="10" height="82" fill="#374151" />
                          <rect x="425" y="70" width="10" height="82" fill="#4B5563" />
                          
                          {/* Cab Protector Overlap */}
                          <path d="M 120 70 L 162 70 L 162 90 L 140 90 Z" fill="#111827" />
                          <path d="M 120 70 L 140 90 L 120 90 Z" fill="#374151" />
                          
                          {/* Diagonal rear release gate lever */}
                          <line x1="438" y1="140" x2="432" y2="110" stroke="#FBBF24" strokeWidth="3.5" />
                          {/* Scissor Hoist Cylindrical Ram visible beneath */}
                          <line x1="280" y1="152" x2="310" y2="162" stroke="#EF4444" strokeWidth="5" />
                        </g>
                      )}

                      {/* 4. Morgan 26ft Aluminum Commercial Dry Box */}
                      {selectedBody.id === "by-dry" && (
                        <g id="body-dry-render">
                          {/* Extreme tall rectangular container with metal corner moldings */}
                          <rect x="150" y="44" width="335" height="110" fill="#E2E8F0" rx="1.5" opacity="0.95" />
                          {/* Vertical rivets rows */}
                          <line x1="190" y1="44" x2="190" y2="154" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="4,4" />
                          <line x1="240" y1="44" x2="240" y2="154" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="4,4" />
                          <line x1="290" y1="44" x2="290" y2="154" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="4,4" />
                          <line x1="340" y1="44" x2="340" y2="154" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="4,4" />
                          <line x1="390" y1="44" x2="390" y2="154" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="4,4" />
                          <line x1="440" y1="44" x2="440" y2="154" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="4,4" />

                          {/* Top yellow warning reflector lights */}
                          <circle cx="158" cy="49" r="2" fill="#FBBF24" />
                          <circle cx="478" cy="49" r="2" fill="#EF4444" />
                          
                          {/* Aluminum perimeter outline frames */}
                          <rect x="149" y="43" width="337" height="112" fill="none" stroke="#94A3B8" strokeWidth="2.5" />
                          <text x="315" y="105" fill="#64748B" fontSize="11" fontFamily="sans-serif" fontWeight="900" letterSpacing="3" textAnchor="middle" opacity="0.3">MORGAN BODY CO.</text>
                          
                          {/* Rear Roll up door outline */}
                          <line x1="480" y1="46" x2="480" y2="150" stroke="#475569" strokeWidth="3" />
                        </g>
                      )}

                      {/* LOW CAB FORWARD TRUCK CAB (The Signature Isuzu Chassis Shape) */}
                      {/* Interactive Cab section filled with paintColor.hex */}
                      <g id="isuzu-lcf-cab-group">
                        {/* Cab Main Shell */}
                        <path
                          d="M 54 114 L 64 64 L 114 62 L 140 68 L 144 114 L 142 161 L 110 161 L 54 161 Z"
                          fill={paintColor.hex}
                          stroke="#334155"
                          strokeWidth="2.5"
                        />
                        {/* Front Black low-windshield Cowl Accent */}
                        <path d="M 54 115 L 61 74 L 110 72 L 105 115 Z" fill="#0F172A" opacity="0.9" />
                        <text x="78" y="98" fill="#94A3B8" fontSize="8" textAnchor="middle" fontWeight="bold">AGC GLASS</text>
                        
                        {/* Front Chrome Isuzu signature split grille */}
                        <rect x="53" y="125" width="22" height="4" fill="#E2E8F0" />
                        <rect x="53" y="132" width="22" height="4" fill="#E2E8F0" />
                        <line x1="53" y1="128" x2="75" y2="128" stroke="#000" strokeWidth="0.5" />

                        {/* Headlights (Characteristic Isuzu vertical layout) */}
                        <path d="M 53 140 Q 58 140 58 152 L 53 152 Z" fill="#F8FAFC" stroke="#64748B" strokeWidth="1" />
                        <circle cx="56" cy="144" r="1.5" fill="#FBBF24" />
                        <circle cx="56" cy="148" r="1.5" fill="#FFF" />

                        {/* Cab Wheelarch protection guard panel */}
                        <path d="M 72 161 C 72 142 108 142 108 161 Z" fill="#1E293B" />
                        
                        {/* Door seam lines */}
                        <path d="M 100 66 L 100 160" stroke="#334155" strokeWidth="1.5" />
                        <path d="M 100 110 L 140 110" stroke="#334155" strokeWidth="1" />
                        <rect x="105" y="114" width="10" height="5" fill="#1E293B" rx="1" /> {/* Door handle */}

                        {/* West-coast style vertical rearview mirrors mounting (characteristic on NYC trucks) */}
                        <path d="M 64 85 L 45 85 L 45 125 L 49 125" stroke="#1E293B" strokeWidth="1.5" fill="none" />
                        <rect x="42" y="88" width="6" height="28" fill="#111827" rx="1.5" />
                        
                        {/* Gas / Diesel Engine Badge */}
                        <rect x="114" y="124" width="18" height="6" fill="#1E293B" rx="0.5" />
                        <text x="123" y="129" fill={selectedChassis.id === "ch-med" ? "#34D399" : "#60A5FA"} fontSize="4.5" textAnchor="middle" fontWeight="black" fontFamily="sans-serif">
                          {selectedChassis.id === "ch-med" ? "GAS" : "DIESEL"}
                        </text>
                      </g>

                      {/* EQUIPPED ACCESSORIES RENDERING (Conditional on activeAccIds) */}

                      {/* 1. Maxon Hydraulic Liftgate (ac-gate) */}
                      {activeAccIds.includes("ac-gate") && (
                        <g id="accessory-liftgate-render">
                          {/* Mount arm connected to chassis rear */}
                          <line x1="479" y1="156" x2="495" y2="168" stroke="#475569" strokeWidth="4.5" />
                          <line x1="479" y1="165" x2="490" y2="182" stroke="#64748B" strokeWidth="3" />
                          {/* Hydraulic silver RAM cylinder */}
                          <line x1="486" y1="162" x2="494" y2="175" stroke="#EF4444" strokeWidth="2" />
                          {/* Rear safety diamond plate fold down platform */}
                          <path d="M 494 150 L 498 150 L 498 198 L 494 198 Z" fill="#94A3B8" />
                          <line x1="496" y1="150" x2="496" y2="198" stroke="#000" strokeWidth="0.5" strokeDasharray="2,2" />
                        </g>
                      )}

                      {/* 2. Stellar Service Crane (ac-crane) */}
                      {activeAccIds.includes("ac-crane") && (
                        <g id="accessory-crane-render">
                          {/* Mounted either behind the cab (X=154) or very rear (X=446) based on selected body style */}
                          {selectedBody.id === "by-dry" ? (
                            // For box truck dry van, mount behind cab
                            <g transform="translate(152, 0)">
                              <rect x="-1" y="90" width="18" height="62" fill="#EAB308" rx="1" />
                              <path d="M 8 90 L 42 55 L 50 62 L 10 95 Z" fill="#EAB308" />
                              <line x1="44" y1="58" x2="44" y2="108" stroke="#1E293B" strokeWidth="1.5" />
                              <circle cx="8" cy="95" r="4" fill="#0F172A" />
                            </g>
                          ) : (
                            // For flatbeds/dumps, mount at the rear right corner
                            <g transform="translate(434, 0)">
                              <rect x="0" y="80" width="18" height="72" fill="#EAB308" rx="1" />
                              <path d="M 9 80 L 48 40 L 56 46 L 11 88 Z" fill="#EAB308" />
                              <line x1="50" y1="43" x2="50" y2="114" stroke="#1E293B" strokeWidth="1.5" />
                              <circle cx="9" cy="85" r="4" fill="#0F172A" />
                            </g>
                          )}
                        </g>
                      )}

                      {/* 3. Underbed Storage Toolboxes (ac-box) */}
                      {activeAccIds.includes("ac-box") && (
                        <g id="accessory-toolboxes-render">
                          {/* Hung beneath the frame between front & rear tires (around x=185 to x=280) */}
                          <rect x="200" y="169" width="70" height="22" fill="#475569" rx="1" />
                          <rect x="206" y="173" width="58" height="14" fill="none" stroke="#94A3B8" strokeWidth="1" />
                          {/* Metal lock paddle */}
                          <rect x="231" y="177" width="8" height="6" fill="#E2E8F0" />
                          <circle cx="235" cy="180" r="1.5" fill="#1E293B" />
                        </g>
                      )}

                      {/* 4. Roof-mounted Strobe Light Bar (ac-light) */}
                      {activeAccIds.includes("ac-light") && (
                        <g id="accessory-lightbar-render">
                          {/* Amber light bars on the roof line of the LCF cab */}
                          <rect x="80" y="55" width="28" height="6" fill="#1E293B" rx="1.5" />
                          {/* Glowing amber neon caps */}
                          <rect x="83" y="52" width="8" height="4" fill="#FBBF24" rx="1" />
                          <rect x="97" y="52" width="8" height="4" fill="#FBBF24" rx="1" />
                          {/* Strobe halo effect */}
                          <circle cx="87" cy="54" r="5" fill="#FBBF24" opacity="0.16" />
                          <circle cx="101" cy="54" r="5" fill="#FBBF24" opacity="0.16" />
                        </g>
                      )}

                      {/* WHEELS AND TYRES (Ensures solid realistic truck stance) */}
                      <g id="truck-wheels-and-tyres">
                        {/* Front Axle Wheel Set */}
                        <circle cx="90" cy="180" r="28" fill="#1E293B" stroke="#0F172A" strokeWidth="3" />
                        <circle cx="90" cy="180" r="15" fill="#64748B" />
                        <circle cx="90" cy="180" r="11" fill="#E2E8F0" />
                        {/* Outer hub bolts circles */}
                        <circle cx="90" cy="180" r="6" fill="none" stroke="#475569" strokeWidth="2.5" strokeDasharray="3,2" />

                        {/* Dual Rear Axle Wheel Set (Tandem or Single depending on Selected Chassis) */}
                        <circle cx="360" cy="180" r="28" fill="#1E293B" stroke="#0F172A" strokeWidth="3" />
                        <circle cx="360" cy="180" r="15" fill="#64748B" />
                        <circle cx="360" cy="180" r="11" fill="#000" />
                        <circle cx="360" cy="180" r="6" fill="none" stroke="#E2E8F0" strokeWidth="2.5" />

                        {/* Extra Axle if Super Duty Class 7/8 is selected */}
                        {selectedChassis.id === "ch-super" && (
                          <g id="extra-axle-tandem">
                            <line x1="360" y1="180" x2="422" y2="180" stroke="#334155" strokeWidth="8" />
                            <circle cx="422" cy="180" r="28" fill="#1E293B" stroke="#0F172A" strokeWidth="3" />
                            <circle cx="422" cy="180" r="15" fill="#64748B" />
                            <circle cx="422" cy="180" r="11" fill="#000" />
                            <circle cx="422" cy="180" r="6" fill="none" stroke="#E2E8F0" strokeWidth="2.5" />
                          </g>
                        )}
                      </g>

                    </svg>

                  </div>
                </div>

                {/* Micro engineering labels overlay */}
                <div className="flex justify-between items-center px-1 text-[9px] font-mono text-slate-500 uppercase mt-2">
                  <span>SYSTEM: OK</span>
                  <span>CAD VER: V4.85</span>
                  <span className="text-amber-500 font-extrabold animate-pulse">● DIALED COAT: {paintColor.name}</span>
                </div>
              </div>

              {/* Dynamic Specifications list */}
              <div className="space-y-3.5 text-xs font-bold uppercase tracking-wider text-slate-300">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Selected Frame</span>
                  <span className="text-white text-right max-w-[60%] truncate">{selectedChassis.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Class & GVWR</span>
                  <span className="text-amber-400 font-extrabold">{selectedChassis.weightGvwr}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Vocational Body</span>
                  <span className="text-white text-right max-w-[60%] truncate">{selectedBody.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Equipped Acc Payload</span>
                  <span className="text-white font-mono shrink-0">~{accessoryWeight.toLocaleString()} lbs</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Isuzu Genuine Warranty</span>
                  <span className="text-emerald-400 shrink-0">Included (3yr/100K)</span>
                </div>
              </div>

              {/* Live Cost Output */}
              <div className="p-4 rounded bg-[#0A1428] border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-slate-550 uppercase tracking-widest font-black block">Estimated Fleet Investment</span>
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider mt-0.5 block">Researched Retail/Upfit Package</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl sm:text-3xl font-black text-[#FBBF24] block">${totalPrice.toLocaleString()}</span>
                  <span className="text-[9px] text-emerald-400 font-black uppercase tracking-widest block mt-0.5">✔ Commercial Finance</span>
                </div>
              </div>

              {/* Form Submission code */}
              <form onSubmit={handleBuildSubmission} className="space-y-3.5 pt-2">
                <h5 className="text-[10px] font-black uppercase tracking-widest text-[#FBBF24] text-center">// Submit This Custom Build Spec</h5>
                <div className="grid sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Buyer Name"
                    value={customForm.buyerName}
                    onChange={(e) => setCustomForm({ ...customForm, buyerName: e.target.value })}
                    className="w-full px-2.5 py-2.5 bg-[#0A1428] border border-white/10 rounded text-[10px] font-bold uppercase tracking-wider text-white placeholder:text-slate-500 focus:outline-none focus:border-[#FBBF24]"
                  />
                  <input
                    type="email"
                    required
                    placeholder="E-mail"
                    value={customForm.buyerEmail}
                    onChange={(e) => setCustomForm({ ...customForm, buyerEmail: e.target.value })}
                    className="w-full px-2.5 py-2.5 bg-[#0A1428] border border-white/10 rounded text-[10px] font-bold uppercase tracking-wider text-white placeholder:text-slate-500 focus:outline-none focus:border-[#FBBF24]"
                  />
                  <input
                    type="text"
                    placeholder="Phone"
                    value={customForm.phone}
                    onChange={(e) => setCustomForm({ ...customForm, phone: e.target.value })}
                    className="w-full px-2.5 py-2.5 bg-[#0A1428] border border-white/10 rounded text-[10px] font-bold uppercase tracking-wider text-white placeholder:text-slate-500 focus:outline-none focus:border-[#FBBF24]"
                  />
                </div>
                <textarea
                  placeholder="Additional Specs Instructions (e.g. specialized liftgate weight limits, cabin custom wiring...)"
                  value={customForm.notes}
                  onChange={(e) => setCustomForm({ ...customForm, notes: e.target.value })}
                  rows={2}
                  className="w-full p-3 bg-[#0A1428] border border-white/10 rounded text-xs font-bold uppercase tracking-wider text-white placeholder:text-slate-500 focus:outline-none focus:border-[#FBBF24] resize-none"
                />

                <button
                  type="submit"
                  className="w-full py-4 bg-[#FBBF24] hover:bg-[#FBBF24]/90 text-[#0A1428] font-black text-xs uppercase tracking-widest rounded transition-colors flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(251,191,36,0.2)] cursor-pointer"
                  id="submit-custom-build-blueprint"
                >
                  <Send className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Submit to Engineering</span>
                </button>
              </form>

              {sentStatus && (
                <div className="p-3 bg-[#050B16] rounded border border-emerald-500/30 text-emerald-400 text-xs text-center animate-fade-in font-bold uppercase tracking-wider">
                  ✔ Blueprint submitted! Our Richmond Hill engineering team will review raw loads and email your custom bid overview within 24 hours.
                </div>
              )}
            </div>
            <div className="py-2.5 px-4 rounded bg-[#050B16] border border-white/5 text-[9px] font-black uppercase tracking-widest text-slate-500 text-center flex items-center justify-center gap-2">
              <Award className="w-3.5 h-3.5 text-[#FBBF24] shrink-0" />
              <span>Queens Vocational Lift & Rig Compliant</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
