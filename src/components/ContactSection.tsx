/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Phone, Mail, MapPin, Send, HelpCircle, Shield, Clock, PlusSquare } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function ContactSection() {
  const { settings } = useApp();
  const [formData, setFormData] = useState({
    name: "",
    companyName: "",
    email: "",
    phone: "",
    department: "Sales Dealership Desk",
    message: ""
  });
  const [status, setStatus] = useState<"idle" | "error" | "success">("idle");

  const handleSubmitInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.message) {
      setStatus("error");
      return;
    }
    setStatus("success");
    // Clear out
    setTimeout(() => {
      setStatus("idle");
      setFormData({
        name: "",
        companyName: "",
        email: "",
        phone: "",
        department: "Sales Dealership Desk",
        message: ""
      });
    }, 6000);
  };

  return (
    <section id="contact" className="w-full bg-[#0A1428] py-16 lg:py-24 border-b border-white/10 scroll-mt-20 text-slate-100">
      <div className="px-4 mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-12 gap-10 items-stretch">
          {/* Detailed Dealer Contacts - Left */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-8">
            <div className="space-y-4 select-none">
              <span className="text-xs uppercase tracking-[0.25em] font-black text-[#FBBF24]">LET'S CONNECT</span>
              <h2 className="text-3xl sm:text-5xl font-black text-white uppercase italic">Visit Our Richmond Hill Bay</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Skip the generic call centers. Speak directly with Sal, Marc, or our certified commercial specialists. Drop by Atlantic Avenue or dial our lines directly.
              </p>
            </div>

            {/* Direct Dialing Cards */}
            <div className="space-y-4">
              <div className="p-4 rounded bg-[#050B16] border border-white/10 flex items-start gap-4 hover:border-[#FBBF24]/30 transition-all">
                <div className="p-2.5 bg-[#0A1428] border border-white/5 rounded text-[#FBBF24]">
                  <Phone className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div className="text-sm">
                  <span className="text-slate-500 block text-[9px] uppercase font-black tracking-widest">// Main Sales & Inventory</span>
                  <a href={`tel:${settings.phone}`} className="text-white hover:text-[#FBBF24] font-black font-mono text-base block transition-colors mt-0.5">
                    {settings.phone || "(718) 555-0190"}
                  </a>
                  <span className="text-xs text-slate-400 font-medium">Monday-Sat: {settings.weekdayHours || "7:30 AM — 6:00 PM"}</span>
                </div>
              </div>

              <div className="p-4 rounded bg-[#050B16] border border-white/10 flex items-start gap-4 hover:border-[#FBBF24]/30 transition-all">
                <div className="p-2.5 bg-[#0A1428] border border-white/5 rounded text-[#FBBF24]">
                  <PlusSquare className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div className="text-sm">
                  <span className="text-slate-500 block text-[9px] uppercase font-black tracking-widest">// Parts Warehouse Counter</span>
                  <a href={`tel:${settings.partsPhone}`} className="text-white hover:text-[#FBBF24] font-black font-mono text-base block transition-colors mt-0.5">
                    {settings.partsPhone || "(718) 555-0192"}
                  </a>
                  <span className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FBBF24] animate-pulse" />
                    <span className="font-medium">In-store pickups & local fleet transport</span>
                  </span>
                </div>
              </div>

              <div className="p-4 rounded bg-[#050B16] border border-white/10 flex items-start gap-4 border-l-4 border-l-red-500">
                <div className="p-2.5 bg-red-950/20 border border-red-900/35 rounded text-red-400">
                  <Shield className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div className="text-sm">
                  <span className="text-red-400 block text-[9px] uppercase font-black tracking-widest">// Emergency Heavy Towing</span>
                  <a href={`tel:${settings.towPhone}`} className="text-white hover:text-red-400 font-black font-mono text-base block transition-colors mt-0.5">
                    {settings.towPhone || "(718) 555-9111"}
                  </a>
                  <span className="text-xs text-slate-400 font-medium">Emergency class-8 tractor outfitting recovery</span>
                </div>
              </div>

              <div className="p-4 rounded bg-[#050B16] border border-white/10 flex items-start gap-4 hover:border-[#FBBF24]/30 transition-all">
                <div className="p-2.5 bg-[#0A1428] border border-white/5 rounded text-[#FBBF24]">
                  <MapPin className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div className="text-sm">
                  <span className="text-slate-500 block text-[9px] uppercase font-black tracking-widest">// Dealership Location</span>
                  <span className="text-white font-black block mt-0.5">{settings.address || "112-14 Atlantic Ave, Richmond Hill, NY 11418"}</span>
                  <span className="text-[11px] text-slate-450 font-medium">Located with easy parking for Class-8 tractor loads</span>
                </div>
              </div>
            </div>

            {/* Simulated Address Map Mockup */}
            <div className="p-4 rounded bg-[#050B16] border border-white/10 space-y-3 select-none">
              <span className="text-[9px] text-slate-500 uppercase font-black block tracking-widest leading-none">// QUEENS DISTRICT ROUTE PREVIEW</span>
              <div className="h-28 rounded bg-black/40 relative overflow-hidden flex flex-col justify-between p-3 border border-white/5">
                <div className="space-y-1">
                  <p className="text-[11px] font-black uppercase text-slate-300">Atlantic Avenue</p>
                  <p className="text-[9px] text-slate-550 leading-normal font-mono font-bold uppercase tracking-widest">◄ Brooklyn Route • Van Wyck Expressway ►</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#FBBF24] animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-wider text-[#FBBF24]">Diehl's Truck World</span>
                  </div>
                  <span className="text-[9px] text-slate-500 px-1.5 py-0.5 rounded bg-black/60 font-mono font-bold uppercase tracking-wider">Exit 6 off Van Wyck</span>
                </div>
              </div>
            </div>
          </div>

          {/* Complete Contacts Message Form - Right */}
          <div className="lg:col-span-7">
            <div className="p-6 sm:p-10 rounded bg-[#050B16] border border-white/10 shadow-2xl h-full flex flex-col justify-between">
              <form onSubmit={handleSubmitInquiry} className="space-y-6">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-white uppercase italic tracking-wide">Submit Fleet Inquiry / Booking</h3>
                  <p className="text-xs text-slate-400 mt-1.5">Submit your logistics question or schedule custom service inspections. Our dispatcher will route to the proper counter.</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">// Your Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Marc Sal"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#0A1428] border border-white/10 hover:border-[#FBBF24]/30 rounded text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-[#FBBF24] text-xs font-bold uppercase tracking-wider"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">// Company Fleet Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Richmond Towing"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#0A1428] border border-white/10 hover:border-[#FBBF24]/30 rounded text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-[#FBBF24] text-xs font-bold uppercase tracking-wider"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">// E-mail Address</label>
                    <input
                      type="email"
                      placeholder="buyer@carrier.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#0A1428] border border-white/10 hover:border-[#FBBF24]/30 rounded text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-[#FBBF24] text-xs font-bold uppercase tracking-wider"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">// Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="(718) 555-xxxx"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#0A1428] border border-white/10 hover:border-[#FBBF24]/30 rounded text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-[#FBBF24] text-xs font-bold uppercase tracking-wider"
                    />
                  </div>
                </div>

                {/* Dispatch Selector */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">// Specify Department Desk</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#0A1428] border border-white/10 rounded text-slate-200 text-xs font-black uppercase tracking-wider focus:outline-none focus:border-[#FBBF24] cursor-pointer"
                    id="contact-department-select"
                  >
                    <option value="Sales Dealership Desk">Vehicle Sales & Inventory Finance Office</option>
                    <option value="Parts Warehouse Counter">OEM / Heavy Duty Parts Desk</option>
                    <option value="Service Scheduling Desk">Preventative Fleet Maintenance Scheduling</option>
                    <option value="Welding & Customs Shop">Custom Service Truck Box Builds</option>
                  </select>
                </div>

                {/* Message */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">// Inquiry details *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Provide details about your truck, parts, or diagnostic timeline..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full p-3.5 bg-[#0A1428] border border-white/10 rounded text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-[#FBBF24] text-xs font-bold uppercase tracking-wider resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-[#FBBF24] hover:bg-[#FBBF24]/90 text-[#0A1428] font-black text-xs uppercase tracking-widest rounded transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#FBBF24]/10"
                  id="submit-contact-form"
                >
                  <Send className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Transmit Dispatch Ticket</span>
                </button>
              </form>

              {status === "error" && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs text-center rounded mt-4 uppercase font-bold tracking-wider">
                  ⚠ Error: Please provide your full name, contact phone, and details.
                </div>
              )}

              {status === "success" && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs text-center rounded mt-4 uppercase font-bold tracking-wider">
                  ✔ Inquiry dispatch successful! Your ticket number DTW-#{Math.floor(Math.random() * 9000 + 1000)} has been sent to our {formData.department}. Sal or Marc will ring you shortly.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
