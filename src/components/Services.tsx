/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Wrench, ShieldCheck, Truck, Check, Calendar, ArrowRight, Play } from "lucide-react";
import { DEALERSHIP_SERVICES } from "../data";
import { useApp } from "../context/AppContext";
import { decodeCommercialVin, VIN_EXAMPLES } from "../lib/vinDecoder";

// Helper icon mapping
const getIcon = (name: string) => {
  switch (name) {
    case "Wrench":
      return <Wrench className="w-6 h-6 text-amber-500" />;
    case "ShieldCheck":
      return <ShieldCheck className="w-6 h-6 text-amber-500" />;
    case "Truck":
      return <Truck className="w-6 h-6 text-amber-500" />;
    default:
      return <Wrench className="w-6 h-6 text-amber-500" />;
  }
};

export default function Services() {
  const { currentCustomer, createServiceAppointment } = useApp();

  // Service estimator state
  const [selectedServiceType, setSelectedServiceType] = useState<"pm" | "repair" | "body">("pm");
  const [vehicleClass, setVehicleClass] = useState<"medium" | "heavy">("medium");
  const [addonBrakes, setAddonBrakes] = useState(false);
  const [addonInspection, setAddonInspection] = useState(false);
  const [bookingStatus, setBookingStatus] = useState<"idle" | "success">("idle");
  const [bookingForm, setBookingForm] = useState({ companyName: "", contactPhone: "" });

  // VIN state integration
  const [vinQuery, setVinQuery] = useState("");
  const [decodedVin, setDecodedVin] = useState<any>(null);
  const [vinError, setVinError] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<"classification" | "vin">("classification");

  const handleServiceVinLookup = (vinStr: string) => {
    if (!vinStr) {
      setVinError("Please enter a valid 17-digit commercial VIN.");
      setDecodedVin(null);
      return;
    }
    const decoded = decodeCommercialVin(vinStr);
    setDecodedVin(decoded);
    
    if (decoded.isValid) {
      setVinError("");
      const isHeavyWord = 
        decoded.model.toLowerCase().includes("heavy") || 
        decoded.model.toLowerCase().includes("dump") || 
        decoded.make.toLowerCase().includes("western star") ||
        decoded.make.toLowerCase().includes("mack");
      setVehicleClass(isHeavyWord ? "heavy" : "medium");
    } else {
      setVinError(decoded.notes || "Non-standard custom fleet code.");
      const isHeavyWord = 
        decoded.model.toLowerCase().includes("heavy") || 
        decoded.model.toLowerCase().includes("dump") || 
        decoded.make.toLowerCase().includes("western star") ||
        decoded.make.toLowerCase().includes("mack");
      setVehicleClass(isHeavyWord ? "heavy" : "medium");
    }
  };


  // Autofill signed-in customer info
  useEffect(() => {
    if (currentCustomer) {
      setBookingForm({
        companyName: currentCustomer.companyName,
        contactPhone: currentCustomer.phone
      });
    }
  }, [currentCustomer]);

  const calculateEstimate = () => {
    let basePrice = 0;
    let baseHours = "";

    if (selectedServiceType === "pm") {
      basePrice = vehicleClass === "medium" ? 349 : 499;
      baseHours = "1.5 - 2 Hours";
    } else if (selectedServiceType === "repair") {
      basePrice = vehicleClass === "medium" ? 175 : 225; // Hourly diagnostic / repair starting rate
      baseHours = "Same-day Diagnosed";
    } else {
      basePrice = vehicleClass === "medium" ? 2200 : 3800; // body mount estimate base
      baseHours = "2 - 4 Days";
    }

    if (addonBrakes) basePrice += vehicleClass === "medium" ? 289 : 420;
    if (addonInspection) basePrice += 150; // DOT inspection NY state official rate estimate

    return { price: basePrice, duration: baseHours };
  };

  const { price, duration } = calculateEstimate();

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.companyName || !bookingForm.contactPhone) return;

    createServiceAppointment({
      companyName: bookingForm.companyName,
      customerName: currentCustomer ? currentCustomer.name : "Guest Rep",
      phone: bookingForm.contactPhone,
      email: currentCustomer ? currentCustomer.email : "guest@fleet.com",
      customerId: currentCustomer ? currentCustomer.id : undefined,
      vehicleClass: vehicleClass,
      serviceType: selectedServiceType,
      addons: [
        ...(addonBrakes ? ["Rear Brakes Overhaul"] : []),
        ...(addonInspection ? ["Official NYS DOT Safety Inspection"] : []),
        ...(decodedVin ? [`VIN Verified: ${decodedVin.vin} (${decodedVin.year} ${decodedVin.make} ${decodedVin.model})`] : [])
      ],
      estimatedPrice: price,
      duration: duration,
      timeSlot: "11:00 AM"
    });

    setBookingStatus("success");
    // Clear in 5 seconds
    setTimeout(() => {
      setBookingStatus("idle");
      if (!currentCustomer) {
        setBookingForm({ companyName: "", contactPhone: "" });
      }
    }, 5000);
  };

  return (
    <section id="services" className="w-full bg-[#050B16] py-16 lg:py-24 border-b border-white/10 text-slate-100 scroll-mt-20">
      <div className="px-4 mx-auto max-w-7xl">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16 select-none">
          <div className="text-xs uppercase tracking-[0.25em] font-black text-[#FBBF24]">
            Keep Your Fleet on the Road
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white uppercase italic tracking-tight leading-tight">
            Specialized Commercial Truck Service & Repair
          </h2>
          <p className="text-slate-400 font-medium">
            Our Richmond Hill service bays feature state-of-the-art diagnostics and factory-approved mechanics to handle everything from NYS DOT inspections to custom service truck outfitting.
          </p>
        </div>

        {/* Services Showcase Cards */}
        <div className="grid gap-8 md:grid-cols-3 mb-16">
          {DEALERSHIP_SERVICES.map((s) => (
            <div
              key={s.id}
              className="p-8 rounded bg-[#0A1428] border border-white/10 hover:border-[#FBBF24]/50 transition-all shadow-xl flex flex-col justify-between"
              id={`service-card-${s.id}`}
            >
              <div className="space-y-6">
                <div className="p-3 w-fit bg-[#050B16] rounded border border-white/10 text-[#FBBF24]">
                  {getIcon(s.iconName)}
                </div>
                <div>
                  <h3 className="text-lg font-black text-white group-hover:text-[#FBBF24] transition-colors uppercase tracking-wider">
                    {s.title}
                  </h3>
                  <p className="text-slate-400 text-xs sm:text-sm mt-3 leading-relaxed">
                    {s.description}
                  </p>
                </div>
                <div className="h-[1px] bg-white/5 w-full" />
                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300">
                  {s.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 select-none">
                      <Check className="w-4 h-4 text-[#FBBF24] shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Integrated Service Estimator Panel */}
        <div className="w-full rounded bg-[#0A1428] border border-white/10 shadow-2xl p-6 sm:p-10 lg:p-12 overflow-hidden grid lg:grid-cols-12 gap-10">
          {/* Estimate Configuration Controls */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
              <div>
                <span className="text-xs uppercase tracking-[0.2em] font-black text-[#FBBF24]">// EST-RATE COUNTER</span>
                <h3 className="text-2xl sm:text-3xl font-black text-white uppercase italic mt-1.5">Instant Fleet Rate Calculator</h3>
                <p className="text-sm text-slate-400 mt-1 leading-relaxed">Configure your commercial vehicle specifications to build a clear maintenance quote.</p>
              </div>

              {/* Input Choice Control */}
              <div className="flex bg-[#050B16] p-1.5 rounded border border-white/10 w-full sm:w-auto shrink-0 select-none">
                <button
                  type="button"
                  onClick={() => setSelectedMethod("classification")}
                  className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded text-[10px] uppercase font-black tracking-wider transition-all cursor-pointer ${
                    selectedMethod === "classification"
                      ? "bg-[#FBBF24] text-[#0A1428]"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Manual Specs
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMethod("vin")}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 rounded text-[10px] uppercase font-black tracking-wider transition-all cursor-pointer ${
                    selectedMethod === "vin"
                      ? "bg-[#FBBF24] text-[#0A1428]"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  ★ Verify VIN
                </button>
              </div>
            </div>

            {/* Stage Selector */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-300 block">// Select Service Classification</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "pm", label: "Fleet PM Check" },
                  { value: "repair", label: "Engine/NYS DOT" },
                  { value: "body", label: "Body Outfitting" }
                ].map((st) => (
                  <button
                    key={st.value}
                    onClick={() => setSelectedServiceType(st.value as any)}
                    className={`p-3 rounded text-xs sm:text-sm font-black uppercase tracking-widest border transition-all cursor-pointer ${
                      selectedServiceType === st.value
                        ? "bg-[#FBBF24] text-[#0A1428] border-transparent shadow-[#FBBF24]/10 shadow"
                        : "bg-black/40 text-slate-300 border-white/5 hover:border-white/10"
                    }`}
                    id={`est-svctype-${st.value}`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {selectedMethod === "classification" ? (
              /* Vehicle spec class manual selection */
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-300 block">// Vehicle Classification</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setVehicleClass("medium")}
                    className={`p-3 rounded text-left border transition-all cursor-pointer ${
                      vehicleClass === "medium"
                        ? "bg-black/50 border-[#FBBF24] text-white"
                        : "bg-[#050B16] border-white/5 text-slate-400 hover:border-white/10"
                    }`}
                    id="est-vclass-medium"
                  >
                    <p className="text-xs sm:text-sm font-black uppercase tracking-wider">Medium Duty (Class 4-6)</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-1">Box trucks, Flatbeds, Isuzu NRR, Hino L6</p>
                  </button>
                  <button
                    onClick={() => setVehicleClass("heavy")}
                    className={`p-3 rounded text-left border transition-all cursor-pointer ${
                      vehicleClass === "heavy"
                        ? "bg-black/50 border-[#FBBF24] text-white"
                        : "bg-[#050B16] border-white/5 text-slate-400 hover:border-white/10"
                    }`}
                    id="est-vclass-heavy"
                  >
                    <p className="text-xs sm:text-sm font-black uppercase tracking-wider">Heavy Duty (Class 7-8 / Dump)</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-1">Class 8 dumps, Cement mixers, Freightliner M2</p>
                  </button>
                </div>
              </div>
            ) : (
              /* Smart VIN Decoder Field inside scheduling controls */
              <div className="space-y-4 bg-black/35 p-5 rounded border border-white/5 text-left">
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block tracking-widest">// AUTOMATIC CHASSIS DISCOVERY VIA VIN</span>
                  <div className="flex gap-2 flex-col sm:flex-row">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        maxLength={17}
                        value={vinQuery}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase();
                          setVinQuery(val);
                          if (val.length === 17) {
                            handleServiceVinLookup(val);
                          }
                        }}
                        placeholder="ENTER 17-DIGIT HEAVY DUTY VIN..."
                        className="w-full px-4 py-2.5 bg-[#050B16] border border-white/10 rounded text-xs font-black uppercase tracking-widest text-[#FBBF24] placeholder:text-slate-600 focus:outline-none focus:border-[#FBBF24]"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[9px] font-mono text-slate-500 font-bold">
                        {vinQuery.length}/17
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleServiceVinLookup(vinQuery)}
                      className="px-5 py-2.5 bg-[#0A1428] hover:bg-[#050B16] text-[#FBBF24] border border-[#FBBF24]/20 hover:border-[#FBBF24]/60 text-xs font-black uppercase tracking-wider rounded transition-colors cursor-pointer shrink-0"
                    >
                      Verify Spec
                    </button>
                  </div>
                </div>

                {/* Preloaded test samples */}
                <div className="space-y-1.5">
                  <span className="text-[9px] font-mono font-semibold text-slate-500 uppercase block tracking-wider">
                    🧪 CHOOSE REPRESENTATIVE TEST VIN IN THE NYC REGION:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {VIN_EXAMPLES.map((example) => (
                      <button
                        key={example.vin}
                        type="button"
                        onClick={() => {
                          setVinQuery(example.vin);
                          handleServiceVinLookup(example.vin);
                        }}
                        className={`p-1.5 text-left bg-black/50 hover:bg-black/80 border rounded relative select-none cursor-pointer transition-all overflow-hidden ${
                          vinQuery === example.vin ? "border-[#FBBF24] text-[#FBBF24]" : "border-white/5 text-slate-400"
                        }`}
                      >
                        <span className="font-black block uppercase tracking-wider text-[8px] text-white truncate">
                          {example.label.split(" (")[0]}
                        </span>
                        <span className="font-mono text-[8.5px] text-[#FBBF24] block mt-0.5 truncate">
                          {example.vin}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Decoded Output Summary Panel */}
                {decodedVin && (
                  <div className="mt-3 p-4 rounded bg-[#050B16] border border-emerald-500/10 text-xs leading-relaxed animate-fade-in text-left">
                    <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-mono font-black block mb-2">✔ DECIPHERMENT COMPLETED</span>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <span className="text-slate-500 block uppercase font-black text-[9px] font-mono">Mapped Blueprint</span>
                        <span className="font-bold text-white uppercase text-[12px] block mt-0.5">
                          {decodedVin.year} {decodedVin.make} {decodedVin.model}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block uppercase font-black text-[9px] font-mono">Assigned Bay Tier</span>
                        <span className="font-mono text-[#FBBF24] block tracking-wide font-black uppercase mt-0.5">
                          {vehicleClass === "heavy" ? "Class 7-8 Heavy Diagnostic Track" : "Class 4-6 Medium Service Lane"}
                        </span>
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 text-[11px] font-medium text-slate-350 mt-3 pt-2.5 border-t border-white/5">
                      <div>
                        <span className="text-slate-500 block uppercase font-black text-[9px] font-mono">Drivetrain Specification</span>
                        <span className="font-semibold text-white uppercase">{decodedVin.engine}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block uppercase font-black text-[9px] font-mono">Automation Gearbox</span>
                        <span className="font-semibold text-white uppercase">{decodedVin.transmission}</span>
                      </div>
                    </div>
                  </div>
                )}

                {vinError && !decodedVin && (
                  <div className="p-3 bg-rose-950/20 border border-rose-500/20 text-rose-300 font-bold text-xs rounded uppercase tracking-wider">
                    ⚠ {vinError}
                  </div>
                )}
              </div>
            )}


            {/* Addons Selection */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-300 block">// Additional Servicing Add-ons</label>
              <div className="grid sm:grid-cols-2 gap-3.5">
                <label className="flex items-center gap-3 p-3.5 rounded bg-black/40 border border-white/5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={addonBrakes}
                    onChange={(e) => setAddonBrakes(e.target.checked)}
                    className="w-4 h-4 rounded text-[#FBBF24] accent-[#FBBF24] cursor-pointer"
                    id="est-addon-brakes"
                  />
                  <div>
                    <span className="text-xs sm:text-sm font-black uppercase tracking-wide text-white block">Commercial Rear Brakes Overhaul</span>
                    <span className="text-[10px] text-[#FBBF24] font-black font-mono tracking-widest uppercase block mt-1">+{vehicleClass === "medium" ? "$289.99" : "$420.00"}</span>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3.5 rounded bg-black/40 border border-white/5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={addonInspection}
                    onChange={(e) => setAddonInspection(e.target.checked)}
                    className="w-4 h-4 rounded text-[#FBBF24] accent-[#FBBF24] cursor-pointer"
                    id="est-addon-dot"
                  />
                  <div>
                    <span className="text-xs sm:text-sm font-black uppercase tracking-wide text-white block">Official NYS DOT Safety Inspection</span>
                    <span className="text-[10px] text-[#FBBF24] font-black font-mono tracking-widest uppercase block mt-1">+$150.00 flat rate</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Quick Output Estimation & Booking Form */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-black/30 p-6 rounded border border-white/10 shadow-inner">
            <div className="space-y-6">
              <div className="text-center pb-6 border-b border-white/5">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">// Calculated Estimate</span>
                <div className="text-4xl font-black text-[#FBBF24] my-2 font-mono">
                  ${price.toLocaleString()}
                  {selectedServiceType === "repair" && <span className="text-xs text-slate-300 font-black"> / START MINIMUM</span>}
                </div>
                <div className="flex justify-center items-center gap-2 text-xs text-slate-300 font-bold uppercase tracking-wider mt-2">
                  <Calendar className="w-3.5 h-3.5 text-[#FBBF24]" />
                  <span>Est. Completion: <strong className="text-white">{duration}</strong></span>
                </div>
              </div>

              {/* Booking Quick Schedule Form */}
              <form onSubmit={handleBook} className="space-y-4">
                <div className="text-[9px] font-black uppercase text-slate-300 tracking-widest flex items-center gap-1.5 justify-center mb-1">
                  <span>// QUEENS FLEET BOOKING REGISTER</span>
                </div>
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Company Fleet Name (e.g., Queens Transit)"
                    value={bookingForm.companyName}
                    onChange={(e) => setBookingForm({ ...bookingForm, companyName: e.target.value })}
                    className="w-full px-3.5 py-3 text-xs font-bold uppercase tracking-wider bg-[#050B16] border border-white/10 rounded text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-[#FBBF24] transition-colors"
                  />
                </div>
                <div>
                  <input
                    type="tel"
                    required
                    placeholder="Direct Callback Phone Number"
                    value={bookingForm.contactPhone}
                    onChange={(e) => setBookingForm({ ...bookingForm, contactPhone: e.target.value })}
                    className="w-full px-3.5 py-3 text-xs font-bold uppercase tracking-wider bg-[#050B16] border border-white/10 rounded text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-[#FBBF24] transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-[#FBBF24] hover:bg-[#FBBF24]/90 text-[#0A1428] font-black text-xs uppercase tracking-widest rounded transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-[#FBBF24]/10 cursor-pointer"
                  id="submit-est-booking"
                >
                  <span>Request slot</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[3.5]" />
                </button>
              </form>

              {bookingStatus === "success" && (
                <div className="p-3 border border-emerald-500 bg-emerald-500/10 text-emerald-400 text-xs text-center font-bold uppercase tracking-wider space-y-1.5 leading-relaxed">
                  <p>✔ Booking Request Received! Sal or Marc from our Richmond Hill shop will call you within 15 minutes to confirm.</p>
                  {decodedVin && (
                    <p className="text-[10px] text-[#FBBF24] lowercase font-mono tracking-wide font-medium">
                      linked specs: {decodedVin.year} {decodedVin.make} {decodedVin.model} (VIN: {decodedVin.vin})
                    </p>
                  )}
                </div>
              )}
            </div>

            <p className="text-[9px] text-slate-500 text-center mt-6 uppercase font-bold tracking-wider leading-relaxed">
              *Estimates are non-binding & reflect standard pricing. Heavy structural adjustments undergo manual review.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
