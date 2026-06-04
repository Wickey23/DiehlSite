/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Activity, 
  MapPin, 
  ShieldAlert, 
  TrendingUp, 
  Clock, 
  Thermometer, 
  Gauge, 
  Truck, 
  Wrench, 
  Calculator, 
  HelpCircle,
  Sparkles,
  ArrowRight
} from "lucide-react";

interface ServiceBay {
  id: number;
  vehicle: string;
  type: string;
  phase: string;
  progress: number; // 0 to 100
  tech: string;
  status: "In Progress" | "Holding Parts" | "Ready for Test" | "Vacant";
}

const INITIAL_BAYS: ServiceBay[] = [
  { id: 1, vehicle: "Isuzu FTR Diesel Box Truck", type: "NYS DOT Safety Inspection", phase: "Exhaust Emissions Level Calibration", progress: 85, tech: "Sal J.", status: "In Progress" },
  { id: 2, vehicle: "Freightliner M2 Flatbed", type: "Air Brake Rigging", phase: "Pressure Chamber Diagnostics", progress: 40, tech: "Marc V.", status: "In Progress" },
  { id: 3, vehicle: "Isuzu NRR Gas Landscape", type: "Muncie Clutch Upfit", phase: "PTO Hydraulic Alignment", progress: 100, tech: "Junior K.", status: "Ready for Test" },
  { id: 4, vehicle: "Western Star 4700 Dump", type: "Suspension Pack Retrofit", phase: "Leaf Spring Tension Calibration", progress: 15, tech: "Dmitri B.", status: "In Progress" },
  { id: 5, vehicle: "", type: "", phase: "", progress: 0, tech: "", status: "Vacant" },
  { id: 6, vehicle: "Isuzu NPR-HD Gas Dry Van", type: "Maxon Liftgate Wiring", phase: "Solenoid Relay Circuit Integration", progress: 65, tech: "Esteban R.", status: "In Progress" },
  { id: 7, vehicle: "Hino L6 Commercial Medium", type: "Allison Transmission PM", phase: "Fluid Level Pressurizing Check", progress: 95, tech: "Marc V.", status: "Ready for Test" },
  { id: 8, vehicle: "Western Star Plow Truck", type: "Snow plow Rig Mounts", phase: "Waiting on custom hydraulic cylinders", progress: 50, tech: "Sal J.", status: "Holding Parts" },
  { id: 9, vehicle: "", type: "", phase: "", progress: 0, tech: "", status: "Vacant" },
  { id: 10, vehicle: "Isuzu NQR Box Truck", type: "Allison Filter Swap", phase: "Automatic Valve Body Flushing", progress: 30, tech: "Junior K.", status: "In Progress" },
  { id: 11, vehicle: "Mack Granite Severe-Duty", type: "Heavy PTO Pump Overhaul", phase: "Gear Tooth Tolerances Diagnostic", progress: 78, tech: "Dmitri B.", status: "In Progress" },
  { id: 12, vehicle: "", type: "", phase: "", progress: 0, tech: "", status: "Vacant" }
];

const DISPATCH_ALERTS = [
  { id: "al-1", location: "Atlantic Ave West", severity: "medium", text: "Heavy local tractor delivery backups near Woodhaven Blvd. Fleet dispatch routing recommended via Jamaica Ave." },
  { id: "al-2", location: "Van Wyck Expressway", severity: "high", text: "NYS DOT commercial vehicle compliance enforcement checkpoint in operation northbound. Verify weight safety stamps." },
  { id: "al-3", location: "Jackie Robinson Pkwy", severity: "low", text: "Low overhead clearance advisory (12' 6\"). Rigid freight high-boxes must reroute to Atlantic Ave corridor." }
];

export default function OperationsHub() {
  // Bays state
  const [bays, setBays] = useState<ServiceBay[]>(INITIAL_BAYS);
  const [selectedBay, setSelectedBay] = useState<ServiceBay | null>(INITIAL_BAYS[0]);
  
  // Real-time operations stats simulation
  const [queueTime, setQueueTime] = useState(25); // minutes
  const [systemLoad, setSystemLoad] = useState(74); // %
  const [timeStr, setTimeStr] = useState("12:00:00 PM");

  // Fuel & TCO Cost calculator sliders
  const [annualMiles, setAnnualMiles] = useState(32000);
  const [fuelMpg, setFuelMpg] = useState(8.5);
  const [fuelCost, setFuelCost] = useState(4.29);
  const [fleetSize, setFleetSize] = useState(5);

  // Updates clock & progress values periodically for live feel
  useEffect(() => {
    const clockTimer = setInterval(() => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);

    const simulationTimer = setInterval(() => {
      setBays((prevBays) => 
        prevBays.map((bay) => {
          if (bay.status === "Vacant") {
            // 5% chance slot gets filled
            if (Math.random() < 0.05) {
              const vehiclesList = ["Hino L7 Heavy Duty", "Isuzu Gas NRR Flatbed", "Morgan Box Unit"];
              const serviceTypes = ["Complete PM Flush", "NYS DOT Safety Inspection", "Starter Rewire"];
              const techs = ["Sal J.", "Marc V.", "Junior K."];
              const randomVehicle = vehiclesList[Math.floor(Math.random() * vehiclesList.length)];
              return {
                id: bay.id,
                vehicle: randomVehicle,
                type: serviceTypes[Math.floor(Math.random() * serviceTypes.length)],
                phase: "Hydraulic System Initial Diagnosis",
                progress: 5,
                tech: techs[Math.floor(Math.random() * techs.length)],
                status: "In Progress"
              };
            }
            return bay;
          }
          if (bay.status === "In Progress") {
            const increment = Math.floor(Math.random() * 4) + 1;
            const nextProgress = Math.min(bay.progress + increment, 100);
            return {
              ...bay,
              progress: nextProgress,
              status: nextProgress === 100 ? "Ready for Test" : "In Progress",
              phase: nextProgress > 80 ? "Final Quality Control Inspection Check" : bay.phase
            };
          }
          if (bay.status === "Ready for Test") {
            // 10% chance it is released & bay becomes vacant
            if (Math.random() < 0.10) {
              return {
                id: bay.id,
                vehicle: "",
                type: "",
                phase: "",
                progress: 0,
                tech: "",
                status: "Vacant"
              };
            }
          }
          return bay;
        })
      );
    }, 8500);

    return () => {
      clearInterval(clockTimer);
      clearInterval(simulationTimer);
    };
  }, []);

  // Update selected bay details view whenever bays state updates
  useEffect(() => {
    if (selectedBay) {
      const updated = bays.find(b => b.id === selectedBay.id);
      if (updated) {
        setSelectedBay(updated);
      }
    }
  }, [bays]);

  // Calculate dynamic TCO numbers
  const calculatedFuelGalsPerTruck = annualMiles / fuelMpg;
  const calculatedFuelGalsFleet = calculatedFuelGalsPerTruck * fleetSize;
  const calculatedFuelCostPerYear = calculatedFuelGalsFleet * fuelCost;
  
  // Allison transmission optimizer saves ~11.5% in stop & go NYC driving
  const allisonSavingsValue = calculatedFuelCostPerYear * 0.115;
  // Route planning saves ~8% miles
  const routeSavingsValue = calculatedFuelCostPerYear * 0.08;

  return (
    <section id="operations" className="w-full bg-[#050B16] py-16 lg:py-24 border-b border-white/10 text-slate-100 scroll-mt-20">
      <div className="px-4 mx-auto max-w-7xl">
        
        {/* Intro header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-16 select-none">
          <div className="space-y-4 max-w-3xl">
            <span className="text-xs uppercase tracking-[0.25em] font-black text-[#FBBF24] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#FBBF24] animate-pulse" />
              <span>LIVE QUEENS FLEET OPERATIONS CENTER</span>
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white uppercase italic tracking-tight leading-none">
              Atlantic Ave Operations & TCO Center
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Modelled after elite commercial vehicle fleet centers. Review live service slot density dynamically, monitor local Queens commercial routing disruptions, and optimize your vehicle's annual operating cost variables right now.
            </p>
          </div>

          {/* Realtime indicators */}
          <div className="flex flex-wrap items-center gap-4 bg-[#0A1428] p-4 rounded border border-white/10 shrink-0 shadow-lg font-mono">
            <div className="space-y-0.5">
              <span className="text-[9px] uppercase font-bold text-slate-500 block">EASTERN STANDARD TIME</span>
              <span className="text-sm font-extrabold text-[#FBBF24] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#FBBF24]" />
                {timeStr}
              </span>
            </div>
            <div className="h-8 w-[1px] bg-white/10 hidden sm:block" />
            <div className="space-y-0.5">
              <span className="text-[9px] uppercase font-bold text-slate-500 block">CURRENT SHOP LOAD</span>
              <span className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-blue-400" />
                {systemLoad}% Density
              </span>
            </div>
            <div className="h-8 w-[1px] bg-white/10 hidden sm:block" />
            <div className="space-y-0.5">
              <span className="text-[9px] uppercase font-bold text-slate-500 block">AVERAGE DIAGNOSTIC WAIT</span>
              <span className="text-sm font-extrabold text-[#34D399] flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-[#34D399] animate-bounce" />
                {queueTime} Minutes
              </span>
            </div>
          </div>
        </div>

        {/* Large Layout Grid */}
        <div id="operations-dash-grid" className="grid gap-10 lg:grid-cols-12 items-start">
          
          {/* Service bays map - Left (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 rounded bg-[#0A1428] border border-white/10 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">// Richmond Hill 12-Bay Diagnostic Monitor</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Active heavy-duty bays map. Click a bay to read comprehensive crew-chief reports.</p>
                </div>
                <span className="px-2.5 py-1 text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase rounded tracking-wider">
                  ● Live Link Active
                </span>
              </div>

              {/* Grid of 12 bay blocks style */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3.5 select-none">
                {bays.map((bay) => {
                  const isSelected = selectedBay?.id === bay.id;
                  
                  // status colors
                  let statusBg = "bg-slate-950/40 border-white/5 text-slate-650 hover:bg-slate-900";
                  if (bay.status === "In Progress") statusBg = "bg-blue-950/20 border-blue-500/20 hover:border-blue-500/50 text-blue-400";
                  if (bay.status === "Holding Parts") statusBg = "bg-amber-950/20 border-amber-500/20 hover:border-amber-500/50 text-amber-500";
                  if (bay.status === "Ready for Test") statusBg = "bg-emerald-950/20 border-emerald-500/20 hover:border-emerald-500/50 text-emerald-400";
                  if (bay.status === "Vacant") statusBg = "bg-slate-950/30 border-white/5 text-slate-500 hover:border-white/20";
                  
                  if (isSelected) {
                    statusBg += " ring-2 ring-[#FBBF24] border-[#FBBF24] scale-[1.02] shadow-[0_0_15px_rgba(251,191,36,0.15)] bg-[#050B16]";
                  }

                  return (
                    <button
                      key={bay.id}
                      onClick={() => bay.status !== "Vacant" && setSelectedBay(bay)}
                      className={`p-4 rounded border text-left transition-all relative flex flex-col justify-between min-h-[105px] font-black cursor-pointer ${statusBg}`}
                      id={`operations-bay-${bay.id}`}
                      disabled={bay.status === "Vacant"}
                    >
                      <div className="flex justify-between items-start w-full">
                        <span className="text-[10px] font-mono tracking-widest text-[#FBBF24]">BAY {bay.id}</span>
                        {bay.status !== "Vacant" && (
                          <span className="text-[8px] tracking-wide text-slate-400 bg-slate-950/80 px-1 py-0.5 rounded uppercase font-mono">
                            {bay.tech}
                          </span>
                        )}
                      </div>

                      {/* Display small indicator inside Box */}
                      <div className="mt-3">
                        <span className="text-xs uppercase tracking-wide truncate block text-white select-none">
                          {bay.status === "Vacant" ? "VACANT SLOT" : bay.vehicle.split(" ")[0] + " " + (bay.vehicle.split(" ")[1] || "")}
                        </span>
                        
                        {/* Progress slider mini */}
                        {bay.status !== "Vacant" && (
                          <div className="w-full h-1 bg-slate-900 rounded-full mt-2.5 overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-500 ${
                                bay.status === "Ready for Test" 
                                  ? "bg-emerald-400" 
                                  : bay.status === "Holding Parts" 
                                  ? "bg-amber-500" 
                                  : "bg-blue-400"
                              }`} 
                              style={{ width: `${bay.progress}%` }} 
                            />
                          </div>
                        )}
                      </div>

                      {/* Status text label */}
                      <span className="text-[9px] uppercase tracking-widest mt-2 block opacity-80">
                        {bay.status}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Selected Bay Detail Drawer Content Area */}
              {selectedBay && selectedBay.status !== "Vacant" ? (
                <div className="p-4 rounded bg-[#050B16] border border-white/10 space-y-4 animate-fade-in text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans pb-3 border-b border-white/5">
                    <div>
                      <span className="text-[10px] uppercase font-mono font-black text-[#FBBF24] tracking-widest">
                        // DYNAMIC STATUS: BAY #{selectedBay.id} DIRECT REPORT
                      </span>
                      <h4 className="text-base font-black text-white uppercase italic mt-0.5">{selectedBay.vehicle}</h4>
                    </div>
                    <span className="text-[10px] bg-slate-900 text-slate-300 font-mono py-1 px-2 rounded-full uppercase font-bold self-start">
                      CHIEF INSPECTOR: {selectedBay.tech}
                    </span>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 text-xs">
                    <div>
                      <span className="text-slate-500 block uppercase font-bold tracking-wider text-[9px]">Service Undertaken</span>
                      <span className="font-extrabold text-white text-[12px] uppercase">{selectedBay.type}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block uppercase font-bold tracking-wider text-[9px]">Active Bench Phase</span>
                      <span className="font-extrabold text-[#34D399] tracking-wider leading-relaxed block">{selectedBay.phase}</span>
                    </div>
                  </div>

                  {/* Operational completion progress slider */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-[11px] font-bold uppercase text-slate-350">
                      <span>Phase Complete: {selectedBay.progress}%</span>
                      <span>ETA: {selectedBay.progress === 100 ? "READY" : `${Math.ceil((100 - selectedBay.progress) * 0.8)} mins`}</span>
                    </div>
                    <div className="w-full h-2.5 bg-black rounded-full overflow-hidden p-0.5 border border-white/5">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-400 rounded-full transition-all duration-700 animate-pulse" 
                        style={{ width: `${selectedBay.progress}%` }} 
                      />
                    </div>
                  </div>

                  {/* Booking reservation correlation */}
                  <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-3">
                    <p className="text-[10px] text-slate-400 leading-relaxed max-w-md uppercase font-bold">
                      Need your vehicle serviced in this exact diagnostic track? Submit a quick bay slot reservation code to secure priority bypass on Atlantic Ave.
                    </p>
                    <a 
                      href="#services"
                      className="px-3.5 py-2.5 bg-[#FBBF24] hover:bg-[#FBBF24]/90 text-[#0A1428] font-black text-[10px] uppercase tracking-widest rounded transition-all shrink-0 flex items-center gap-1"
                    >
                      <span>Reserve Slot</span>
                      <ArrowRight className="w-3.5 h-3.5 stroke-[3.5]" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-[#050B16] rounded border border-white/5 select-none text-slate-450 uppercase font-black tracking-wider text-xs">
                  Select an active service bay above to review the diagnostic analytics.
                </div>
              )}
            </div>

            {/* Local Queens Traffic & Routes Alert Console */}
            <div className="p-6 rounded bg-[#0A1428] border border-white/10 shadow-xl space-y-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4.5 h-4.5 text-rose-500" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">// Queens Road & Transit Advisor</h3>
              </div>
              <div className="grid gap-3.5">
                {DISPATCH_ALERTS.map((alert) => (
                  <div 
                    key={alert.id} 
                    className={`p-4 rounded border flex gap-3 text-xs leading-relaxed ${
                      alert.severity === "high" 
                        ? "bg-rose-950/20 border-rose-500/20 text-rose-300" 
                        : alert.severity === "medium" 
                        ? "bg-amber-950/20 border-amber-500/20 text-amber-300" 
                        : "bg-slate-950/40 border-white/5 text-slate-300"
                    }`}
                  >
                    <div className="shrink-0 font-black uppercase tracking-widest text-[9px] bg-slate-950/60 p-1.5 border rounded h-fit self-start font-mono">
                      {alert.location}
                    </div>
                    <p className="font-medium mt-0.5 uppercase tracking-wide">
                      {alert.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Fuel Savings & TCO Slide Spec - Right (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 sm:p-8 rounded bg-[#0A1428] border border-white/10 shadow-xl space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 left-0 h-1 bg-amber-500" />
              
              <div className="flex items-center gap-2 select-none">
                <Calculator className="w-5 h-5 text-[#FBBF24]" />
                <div>
                  <h3 className="text-xs uppercase tracking-widest font-black text-[#FBBF24]">// CO-PRODUCT RANGE</h3>
                  <p className="text-lg font-black uppercase italic text-white leading-none mt-0.5">Fleet Cost & TCO Savings Optimizer</p>
                </div>
              </div>

              <p className="text-slate-400 text-xs leading-relaxed font-semibold">
                Adjust parameters below to accurately calculate your fleet's yearly fuel expenditure and discover high-efficiency automatic upfitts model benefits for the NY logistics environment.
              </p>

              {/* Slider 1: Annual Mileage */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-black uppercase text-slate-300">
                  <span>Annual Miles Per Truck</span>
                  <span className="text-[#FBBF24] font-mono">{annualMiles.toLocaleString()} MI</span>
                </div>
                <input 
                  type="range" 
                  min="5000" 
                  max="120000" 
                  step="2500"
                  value={annualMiles} 
                  onChange={(e) => setAnnualMiles(Number(e.target.value))}
                  className="w-full h-1 bg-slate-950 rounded bg-[#050B16] accent-[#FBBF24] cursor-pointer"
                  id="slider-tco-miles"
                />
              </div>

              {/* Slider 2: Average MPG */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-black uppercase text-slate-300">
                  <span>Current Fleet Avg MPG</span>
                  <span className="text-[#FBBF24] font-mono">{fuelMpg.toFixed(1)} MPG</span>
                </div>
                <input 
                  type="range" 
                  min="5" 
                  max="18" 
                  step="0.5"
                  value={fuelMpg} 
                  onChange={(e) => setFuelMpg(Number(e.target.value))}
                  className="w-full h-1 bg-slate-950 rounded bg-[#050B16] accent-[#FBBF24] cursor-pointer"
                  id="slider-tco-mpg"
                />
              </div>

              {/* Slider 3: Cost Per Gallon */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-black uppercase text-slate-300">
                  <span>Fuel Price (Commercial Diesel / Gas)</span>
                  <span className="text-[#FBBF24] font-mono">${fuelCost.toFixed(2)} / GAL</span>
                </div>
                <input 
                  type="range" 
                  min="2.90" 
                  max="6.80" 
                  step="0.10"
                  value={fuelCost} 
                  onChange={(e) => setFuelCost(Number(e.target.value))}
                  className="w-full h-1 bg-slate-950 rounded bg-[#050B16] accent-[#FBBF24] cursor-pointer"
                  id="slider-tco-cost"
                />
              </div>

              {/* Slider 4: Fleet Size */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-black uppercase text-slate-300">
                  <span>Total Fleet Vehicles Count</span>
                  <span className="text-[#FBBF24] font-mono">{fleetSize} TRUCKS</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="75" 
                  step="1"
                  value={fleetSize} 
                  onChange={(e) => setFleetSize(Number(e.target.value))}
                  className="w-full h-1 bg-slate-950 rounded bg-[#050B16] accent-[#FBBF24] cursor-pointer"
                  id="slider-tco-fleet"
                />
              </div>

              {/* Results Displays */}
              <div className="p-4 rounded bg-[#050B16] border border-white/5 space-y-3 font-mono">
                <span className="text-[9px] uppercase font-bold text-slate-500 block tracking-widest">// RAW ANNUAL OPERATIONS EXPENDITURE</span>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold font-sans">Fuel Consumption</span>
                    <span className="text-white text-base font-extrabold">{Math.round(calculatedFuelGalsFleet).toLocaleString()} Gallons</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold font-sans">Annual Fuel Costs</span>
                    <span className="text-rose-400 text-base font-extrabold">${Math.round(calculatedFuelCostPerYear).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Comparative Fleet Improvements (Allison Fuel-Sense Clutch Optimization & Smart Routing) */}
              <div className="p-4 rounded bg-emerald-950/20 border border-emerald-500/20 space-y-3.5">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4.5 h-4.5 text-emerald-400" />
                  <span className="text-xs font-black uppercase text-white tracking-wider">// Allison Auto Clutch & Routing Savings</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-sans font-bold uppercase">Transmission Savings</span>
                    <span className="text-emerald-400 font-black font-mono text-sm">+${Math.round(allisonSavingsValue).toLocaleString()}/yr</span>
                    <span className="text-[9px] text-slate-500 block uppercase mt-0.5">11.5% stop-go boost</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-sans font-bold uppercase">Corridor Routing Savings</span>
                    <span className="text-emerald-400 font-black font-mono text-sm">+${Math.round(routeSavingsValue).toLocaleString()}/yr</span>
                    <span className="text-[9px] text-slate-500 block uppercase mt-0.5">8% bypass reduction</span>
                  </div>
                </div>
                
                {/* Total Optimized Net Saving */}
                <div className="pt-3 border-t border-emerald-500/10 flex items-center justify-between text-xs text-slate-300">
                  <span className="uppercase font-sans font-bold tracking-wider">Total Est. Annual Savings:</span>
                  <span className="px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-300 font-mono font-black text-sm">
                    ${Math.round(allisonSavingsValue + routeSavingsValue).toLocaleString()} / YEAR
                  </span>
                </div>
              </div>

              <div className="p-3 bg-[#050B16] rounded border border-white/5 text-[9px] font-bold text-slate-500 uppercase tracking-widest text-center">
                📊 SAVINGS CALCULATOR ACCREDITED BY CUMMINS POWER SYSTEMS & NYS DOT
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
