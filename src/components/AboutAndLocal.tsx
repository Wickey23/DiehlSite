/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Star, Shield, HelpCircle, Award, Compass, MapPin } from "lucide-react";
import { NY_TESTIMONIALS, IMAGE_SERVICE_BAY } from "../data";

export default function AboutAndLocal() {
  const [activeReviewIdx, setActiveReviewIdx] = useState(0);
  const [careerForm, setCareerForm] = useState({
    name: "",
    phone: "",
    role: "Heavy Duty Mechanic",
    experience: "Mid Level (3-5 Years)",
    pitch: ""
  });
  const [careerApplied, setCareerApplied] = useState(false);

  const handleCareerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const existingAppsJson = localStorage.getItem("dtw_career_applications") || "[]";
    const existingApps = JSON.parse(existingAppsJson);
    const newApp = { ...careerForm, id: `app-${Date.now()}`, date: new Date().toLocaleDateString() };
    existingApps.push(newApp);
    localStorage.setItem("dtw_career_applications", JSON.stringify(existingApps));

    setCareerApplied(true);
    setCareerForm({
      name: "",
      phone: "",
      role: "Heavy Duty Mechanic",
      experience: "Mid Level (3-5 Years)",
      pitch: ""
    });
  };

  return (
    <section id="about" className="w-full bg-[#050B16] py-16 lg:py-24 border-b border-white/10 text-slate-100 scroll-mt-20">
      <div className="px-4 mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Visual Showcase - Image Frame */}
          <div className="lg:col-span-5 relative order-last lg:order-first">
            <div className="relative w-full overflow-hidden rounded border border-white/10 shadow-2xl bg-[#0A1428]">
              <img
                src={IMAGE_SERVICE_BAY}
                alt="Diehls heavy-duty service bays in Richmond Hill, Queens NY"
                className="w-full h-auto object-cover aspect-[4/3] grayscale-[20%] contrast-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050B16]/90 to-transparent" />

              {/* Real Local Address floating label */}
              <div className="absolute top-4 left-4 p-3 bg-[#050B16]/95 rounded border border-white/10 backdrop-blur-md flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#FBBF24] shrink-0" />
                <span className="text-xs font-mono font-black uppercase text-[#FBBF24] tracking-widest">Atlantic Ave - NYC</span>
              </div>
            </div>
          </div>

          {/* Local Trust Text Content - Right */}
          <div className="lg:col-span-7 space-y-6 select-none text-center lg:text-left">
            <div className="text-xs uppercase tracking-[0.25em] font-black text-[#FBBF24]">
              Deeply Rooted in Queens Since 1982
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight uppercase italic">
              Diehl’s Truck World: NYC’s Fleet Lifeline
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Situated right off major transport hubs on Atlantic Avenue in Richmond Hill, NY, Diehl’s Truck World has spent over four decades building custom work trucks and maintaining complex commercial operations for Queen's, Brooklyn’s, and Long Island’s crucial fleets.
            </p>

            {/* Local Values grid block */}
            <div className="grid sm:grid-cols-2 gap-5 text-left pt-2 pb-2">
              <div className="p-4 rounded bg-[#0A1428] border border-white/10 space-y-2">
                <div className="flex items-center gap-2">
                  <Award className="w-4.5 h-4.5 text-[#FBBF24]" />
                  <span className="font-black text-white text-xs uppercase tracking-wider">// NYS STATION #718</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">Licensed NYS Safety Inspection facility fully equipped to diagnose exhaust emissions and commercial heavy configurations.</p>
              </div>

              <div className="p-4 rounded bg-[#0A1428] border border-white/10 space-y-2">
                <div className="flex items-center gap-2">
                  <Compass className="w-4.5 h-4.5 text-[#FBBF24]" />
                  <span className="font-black text-white text-xs uppercase tracking-wider">// 5-BOROUGH DISPATCH</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">Conveniently situated near the Van Wyck Expressway & Jackie Robinson Parkway to schedule heavy repairs rapidly.</p>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-normal italic text-left pl-3 border-l-2 border-[#FBBF24] font-medium uppercase tracking-wider">
              Whether you represent a local beverage delivery distributor, a construction developer on Jamaica Ave, or a utility service fleet, our team handles manual weight-chassis builds and heavy repairs with unmatched integrity.
            </p>
          </div>
        </div>

        {/* Local Testimonials Section with Interactive Dots */}
        <div className="mt-20 pt-12 border-t border-white/5 space-y-8 select-none">
          <div className="text-center space-y-2.5">
            <span className="text-[10px] uppercase font-mono font-black text-[#FBBF24] tracking-[0.3em]">// CLIENT CREDIBILITY TRACK</span>
            <h3 className="text-xl sm:text-3xl font-black text-white uppercase italic">Trusted by Local Operators</h3>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {NY_TESTIMONIALS.map((t, idx) => (
              <div
                key={t.id}
                onClick={() => setActiveReviewIdx(idx)}
                className={`p-6 rounded border transition-all text-left flex flex-col justify-between cursor-pointer ${
                  activeReviewIdx === idx
                    ? "bg-[#0A1428] border-[#FBBF24] shadow-xl text-white"
                    : "bg-black/30 border-white/5 text-slate-300 hover:border-[#FBBF24]/30"
                }`}
                id={`testimonial-${t.id}`}
              >
                <div className="space-y-4">
                  {/* Rating Stars */}
                  <div className="flex items-center gap-1 text-[#FBBF24]">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-[#FBBF24] stroke-[1.5]" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm italic text-slate-300 leading-relaxed">
                    "{t.review}"
                  </p>
                </div>
                <div className="pt-4 border-t border-white/5 mt-4 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-black block text-white uppercase tracking-wider text-[11px]">{t.clientName}</span>
                    <span className="text-[10px] text-slate-550 block font-mono font-bold uppercase tracking-widest">{t.companyName}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono font-bold">{t.date}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Careers & Job Openings Block */}
          <div className="mt-16 pt-12 border-t border-white/5 grid md:grid-cols-12 gap-8 select-none">
            <div className="md:col-span-5 space-y-4">
              <span className="text-[10px] uppercase font-mono font-black text-[#FBBF24] tracking-[0.3em]">// WE ARE HIRING</span>
              <h3 className="text-xl sm:text-3xl font-black text-white uppercase italic leading-none">Join the Diehl's Team</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed text-left">
                Looking to advance your fleet technician certification or commercial sales career? Diehl's Truck World offers heavy-vehicle mechanics, dispatchers, and parts experts a high-octane team environment right on Atlantic Ave.
              </p>
              
              <div className="space-y-4 text-xs font-bold uppercase tracking-wider text-slate-300 text-left">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 bg-[#FBBF24] rounded-full"></span>
                  <span>⚡ Competitive NY Hourly + Performance Tier Bonuses</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 bg-[#FBBF24] rounded-full"></span>
                  <span>⚡ Full Health, Dental, Vision & 401(k) Match</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 bg-[#FBBF24] rounded-full"></span>
                  <span>⚡ Continuous Factory Training & Tool Programs</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-7 bg-[#0A1428] border border-white/10 p-6 rounded relative">
              {careerApplied ? (
                <div className="h-full flex flex-col justify-center items-center text-center space-y-4 py-8">
                  <div className="h-12 w-12 bg-emerald-500/10 rounded-full border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-xl font-bold">✓</div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-wider">Application Transmitted!</h4>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-sm">Our Richmond Hill operations director (Julia) will review your qualifications and reach out directly within 48 business hours.</p>
                  </div>
                  <button onClick={() => setCareerApplied(false)} className="text-[10px] uppercase font-black tracking-widest text-[#FBBF24] hover:underline">Submit another application</button>
                </div>
              ) : (
                <form onSubmit={handleCareerSubmit} className="space-y-4 text-left">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] uppercase font-black tracking-wider text-slate-400 mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={careerForm.name}
                        onChange={(e) => setCareerForm({...careerForm, name: e.target.value})}
                        className="w-full bg-slate-950 border border-white/10 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#FBBF24] text-white"
                        placeholder="e.g. Marcus Vance"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase font-black tracking-wider text-slate-400 mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={careerForm.phone}
                        onChange={(e) => setCareerForm({...careerForm, phone: e.target.value})}
                        className="w-full bg-slate-950 border border-white/10 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#FBBF24] text-white"
                        placeholder="e.g. (718) 555-0100"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] uppercase font-black tracking-wider text-slate-400 mb-1">Desired Role *</label>
                      <select
                        required
                        value={careerForm.role}
                        onChange={(e) => setCareerForm({...careerForm, role: e.target.value})}
                        className="w-full bg-slate-950 border border-white/10 rounded px-2.5 py-2 text-xs focus:outline-none focus:border-[#FBBF24] text-white"
                      >
                        <option value="Heavy Duty Mechanic">Heavy Duty Diesel Technician</option>
                        <option value="OEM Parts Associate">OEM Parts Specialist</option>
                        <option value="Commercial Truck Sales">Commercial Vehicle Account Executive</option>
                        <option value="Dispatcher / Operator">Service Dispatch Coordinator</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase font-black tracking-wider text-slate-400 mb-1">Job Experience Level *</label>
                      <select
                        required
                        value={careerForm.experience}
                        onChange={(e) => setCareerForm({...careerForm, experience: e.target.value})}
                        className="w-full bg-slate-950 border border-white/10 rounded px-2.5 py-2 text-xs focus:outline-none focus:border-[#FBBF24] text-white"
                      >
                        <option value="Entry Level (1-2 Years)">Entry Level (1-2 Years)</option>
                        <option value="Mid Level (3-5 Years)">Mid Level (3-5 Years)</option>
                        <option value="Senior Specialist (5+ Years)">Senior Specialist / Master Tech (5+ Years)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] uppercase font-black tracking-wider text-slate-400 mb-1">Brief Pitch or Past Experience *</label>
                    <textarea
                      required
                      value={careerForm.pitch}
                      onChange={(e) => setCareerForm({...careerForm, pitch: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 rounded px-3 py-2 text-xs h-20 focus:outline-none focus:border-[#FBBF24] text-white resize-none"
                      placeholder="List your certifications (ASE, Hino, Detroit Diesel, Cummins) or notable commercial operations..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#FBBF24] text-[#0A1428] font-black text-xs uppercase tracking-widest rounded hover:bg-[#FBBF24]/95 transition-all text-center cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 font-bold"
                  >
                    <span>Transmit Career Application</span>
                    <span>⚡</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
