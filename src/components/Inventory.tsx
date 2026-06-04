/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Filter, Search, ChevronDown, CheckCircle, Eye, ArrowUpDown, X, Tag, ShieldAlert, ChevronLeft, ChevronRight } from "lucide-react";
import { useApp } from "../context/AppContext";
import { CommercialTruck } from "../types";
import { IMAGE_ISUZU_HERO, IMAGE_ISUZU_GAS_CHASSIS, IMAGE_ISUZU_DRY_VAN, IMAGE_REAL_SERVICE_BAY, IMAGE_ISUZU_FTR_REAL } from "../data";

const SHOWROOM_SLIDES = [
  {
    image: IMAGE_ISUZU_FTR_REAL,
    title: "Isuzu F-Series FTR Class 6 Cab & Chassis",
    desc: "Direct from the factory on sun-drenched concrete, representing Atlantic Avenue's ultimate commercial low-cab-forward option.",
    badge: "Showroom Highlight"
  },
  {
    image: IMAGE_ISUZU_DRY_VAN,
    title: "Isuzu N-Series NRR Diesel Dry Box Truck",
    desc: "Equipped with an 18-foot Morgan aluminum dry cargo van body, standard roll up rear door, and tuckunder lift gate.",
    badge: "Vocational Delivery Build"
  },
  {
    image: IMAGE_ISUZU_GAS_CHASSIS,
    title: "Isuzu NPR-HD/NRR Gas Cab & Chassis Units Only",
    desc: "A pure commercial low-cab-forward chassis representing our 'Cab/Chassis Only' products. Configurable with dumps or flatbeds.",
    badge: "Frame-Chassis Showcase"
  },
  {
    image: IMAGE_REAL_SERVICE_BAY,
    title: "Diehl's Authorized Heavy Duty Mechanic Service bays",
    desc: "Our state-of-the-art 12-bay certified truck repair shop diagnostic workstation, staffed by factory trained mechanics.",
    badge: "Authorized Service Center"
  }
];

export default function Inventory() {
  const { trucks, addLead, currentCustomer } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedCondition, setSelectedCondition] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"price-asc" | "price-desc" | "year-desc">("year-desc");
  const [selectedTruck, setSelectedTruck] = useState<CommercialTruck | null>(null);
  const [inquirySent, setInquirySent] = useState(false);
  const [inquiryName, setInquiryName] = useState("");
  const [inquiryCompany, setInquiryCompany] = useState("");
  const [inquiryPhone, setInquiryPhone] = useState("");
  const [inquiryEmail, setInquiryEmail] = useState("");
  
  // Showroom Slideshow state
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % SHOWROOM_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Prepopulate if logged in
  useEffect(() => {
    if (currentCustomer && selectedTruck) {
      setInquiryName(currentCustomer.name);
      setInquiryCompany(currentCustomer.companyName || "");
      setInquiryPhone(currentCustomer.phone);
      setInquiryEmail(currentCustomer.email);
    }
  }, [currentCustomer, selectedTruck]);

  const nextShowroomSlide = () => {
    setActiveSlide((prev) => (prev + 1) % SHOWROOM_SLIDES.length);
  };

  const prevShowroomSlide = () => {
    setActiveSlide((prev) => (prev === 0 ? SHOWROOM_SLIDES.length - 1 : prev - 1));
  };

  const handleInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryName || !inquiryPhone) return;

    if (selectedTruck) {
      addLead({
        name: inquiryName,
        companyName: inquiryCompany || "Independent",
        phone: inquiryPhone,
        email: inquiryEmail || "N/A",
        message: `Inquiry on vehicle stock ID #${selectedTruck.id} (${selectedTruck.name}). Price tag: ${selectedTruck.isQuoteOnly ? "Quote Program Required" : "$" + selectedTruck.price.toLocaleString()}`,
        source: "Quick Inquiry",
        details: `Asset spec sheet: Engine ${selectedTruck.engine} / Trans ${selectedTruck.transmission}. Stock ID: ${selectedTruck.id}`
      });
    }

    setInquirySent(true);
    setTimeout(() => {
      setInquirySent(false);
      if (!currentCustomer) {
        setInquiryName("");
        setInquiryCompany("");
        setInquiryPhone("");
        setInquiryEmail("");
      }
      setSelectedTruck(null);
    }, 5000);
  };

  // Filter & sort logic
  const filteredTrucks = trucks.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.engine.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === "All" || t.category === selectedCategory;
    const matchesCondition = selectedCondition === "All" || t.condition === selectedCondition;

    return matchesSearch && matchesCategory && matchesCondition;
  }).sort((a, b) => {
    if (sortBy === "price-asc") return a.price - b.price;
    if (sortBy === "price-desc") return b.price - a.price;
    if (sortBy === "year-desc") return b.year - a.year;
    return 0;
  });

  return (
    <section id="inventory" className="w-full bg-[#0A1428] py-16 lg:py-24 border-b border-white/10 scroll-mt-20 text-slate-100">
      <div className="px-4 mx-auto max-w-7xl">
        {/* Section Title */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div className="space-y-3.5 select-none text-center md:text-left">
            <span className="text-xs uppercase tracking-[0.25em] font-black text-[#FBBF24] block">
              // READY-TO-WORK INVENTORY
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white uppercase italic">
              Commercial Fleet & Utility Vehicles
            </h2>
            <p className="max-w-xl text-slate-400 text-sm">
              Explore heavy-duty flatbeds, dump trucks, high-capacity utility trucks, and dry box commercial delivery vans fully prepared for Queens & NYC operations.
            </p>
          </div>
          <div className="flex items-center gap-2 justify-center shrink-0">
            <div className="px-4 py-2 bg-[#FBBF24]/10 border border-[#FBBF24]/30 text-[#FBBF24] text-xs font-black tracking-widest uppercase rounded">
              {filteredTrucks.length} VEHICLES AVAILABLE
            </div>
          </div>
        </div>

        {/* Dealership & Shop Showroom Slideshow */}
        <div className="relative mb-14 overflow-hidden rounded border border-white/10 bg-[#050B16] shadow-2xl group/slide">
          <div className="relative h-[250px] sm:h-[420px] w-full bg-slate-950">
            {SHOWROOM_SLIDES.map((slide, i) => {
              const isActive = i === activeSlide;
              return (
                <div
                  key={i}
                  className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                    isActive ? "opacity-100 scale-100 z-10" : "opacity-0 scale-95 pointer-events-none z-0"
                  }`}
                >
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="w-full h-full object-cover opacity-85 hover:opacity-100 transition-opacity duration-500"
                    referrerPolicy="no-referrer"
                  />
                  {/* Subtle color gradient mask */}
                  <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#0A1428] via-[#0A1428]/45 to-transparent" />
                  
                  {/* Floating labels block */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 space-y-1.5 z-20">
                    <span className="inline-block px-2.5 py-1 text-[9px] font-black uppercase tracking-widest bg-[#FBBF24] text-[#0A1428] rounded">
                      {slide.badge}
                    </span>
                    <h3 className="text-lg sm:text-2xl font-black text-white uppercase italic tracking-wide">
                      {slide.title}
                    </h3>
                    <p className="text-slate-300 text-xs sm:text-sm max-w-2xl font-semibold">
                      {slide.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Nav arrows */}
          <button
            onClick={prevShowroomSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-[#0A1428]/80 border border-white/10 text-slate-300 hover:text-[#FBBF24] rounded-full hover:bg-[#0A1428] transition-all z-20 opacity-0 group-hover/slide:opacity-100 cursor-pointer"
            id="showroom-slide-prev"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <button
            onClick={nextShowroomSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-[#0A1428]/80 border border-white/10 text-slate-300 hover:text-[#FBBF24] rounded-full hover:bg-[#0A1428] transition-all z-20 opacity-0 group-hover/slide:opacity-100 cursor-pointer"
            id="showroom-slide-next"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Indicators */}
          <div className="absolute top-4 right-4 flex gap-1.5 z-20 bg-black/40 px-3 py-1.5 rounded-full border border-white/10">
            {SHOWROOM_SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveSlide(i)}
                className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                  i === activeSlide ? "bg-[#FBBF24] w-4" : "bg-slate-500 hover:bg-slate-400"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Filter Controls Panel */}
        <div className="p-4 sm:p-6 rounded bg-[#050B16] border border-white/10 shadow-xl space-y-4 mb-8">
          <div className="grid gap-4 md:grid-cols-12">
            {/* Search inputs */}
            <div className="md:col-span-4 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FBBF24]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search specs, engine, Hino, flatbed..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#0A1428] border border-white/10 hover:border-[#FBBF24]/50 rounded font-black uppercase tracking-wider text-[11px] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#FBBF24] transition-all"
              />
            </div>

            {/* Category selection */}
            <div className="md:col-span-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#0A1428] border border-white/10 hover:border-[#FBBF24]/50 rounded text-xs font-black uppercase tracking-widest text-[#FBBF24] focus:outline-none focus:border-[#FBBF24] transition-colors cursor-pointer"
                id="inventory-filter-category"
              >
                <option value="All">All Categories</option>
                <option value="Box Truck">Box Trucks</option>
                <option value="Flatbed">Flatbeds</option>
                <option value="Dump Truck">Dump Trucks</option>
                <option value="Utility">Utility Trucks</option>
                <option value="Cab & Chassis">Cab & Chassis Units</option>
              </select>
            </div>

            {/* Condition Filter */}
            <div className="md:col-span-2">
              <select
                value={selectedCondition}
                onChange={(e) => setSelectedCondition(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#0A1428] border border-white/10 hover:border-[#FBBF24]/50 rounded text-xs font-black uppercase tracking-widest text-[#FBBF24] focus:outline-none focus:border-[#FBBF24] transition-colors cursor-pointer"
                id="inventory-filter-condition"
              >
                <option value="All">All Conditions</option>
                <option value="New">New Units</option>
                <option value="Pre-Owned">Used Units</option>
              </select>
            </div>

            {/* Sorter */}
            <div className="md:col-span-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-[#0A1428] border border-white/10 hover:border-[#FBBF24]/50 rounded text-xs font-black uppercase tracking-widest text-[#FBBF24] focus:outline-none focus:border-[#FBBF24] transition-colors cursor-pointer"
                id="inventory-filter-sort"
              >
                <option value="year-desc">Latest model years</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Trucks grid display */}
        {filteredTrucks.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {filteredTrucks.map((t) => (
              <div
                key={t.id}
                className="group flex flex-col justify-between bg-[#050B16] border border-white/10 rounded overflow-hidden hover:border-[#FBBF24]/60 transition-all shadow-lg hover:shadow-2xl relative"
                id={`truck-${t.id}`}
              >
                {/* Condition top badge */}
                <span className={`absolute top-3.5 left-3.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded z-10 ${
                  t.condition === "New" ? "bg-[#FBBF24] text-[#0A1428]" : "bg-black border border-white/10 text-white"
                }`}>
                  {t.condition}
                </span>

                {/* Status top badge */}
                {t.status && (
                  <span className={`absolute top-3.5 right-3.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded z-10 shadow-md ${
                    t.status === "Sold" 
                      ? "bg-red-600/90 hover:bg-red-600 text-white border border-red-500/20" 
                      : t.status === "Stock Limited"
                      ? "bg-amber-600/90 hover:bg-amber-600 text-white border border-amber-500/20"
                      : "bg-emerald-650/90 hover:bg-emerald-650 text-white border border-emerald-500/20"
                  }`}>
                    {t.status}
                  </span>
                )}

                {/* Cover Image */}
                <div className="relative overflow-hidden aspect-[4/3] bg-slate-950 border-b border-white/10">
                  <img
                    src={t.imageUrl}
                    alt={t.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A1428] via-[#0A1428]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                    <button
                      onClick={() => setSelectedTruck(t)}
                      className="px-4 py-2 bg-[#FBBF24] hover:bg-[#FBBF24]/90 text-[#0A1428] font-black text-xs uppercase tracking-widest rounded transition-colors flex items-center gap-1.5 cursor-pointer shadow-lg"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Learn More</span>
                    </button>
                  </div>
                </div>

                {/* Summary Card Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-black text-[#FBBF24] tracking-widest font-mono">
                      {t.year} • {t.make} • {t.category}
                    </span>
                    <h3 className="text-sm font-black uppercase opacity-95 text-white group-hover:text-[#FBBF24] transition-colors line-clamp-2">
                      {t.name}
                    </h3>
                  </div>

                  {/* Engine & Transmission overview */}
                  <div className="p-3 bg-black/40 rounded border border-white/5 space-y-1 font-mono text-[10px] text-slate-400">
                    <div className="truncate text-slate-300">ENG: {t.engine}</div>
                    <div className="truncate text-slate-300">TRANS: {t.transmission}</div>
                    {t.mileage !== undefined && <div className="text-slate-300">MILEAGE: {t.mileage.toLocaleString()} mi</div>}
                  </div>

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-black tracking-wider text-slate-500 block">Dealership price</span>
                      <span className="text-sm font-black text-[#FBBF24]">
                        {t.isQuoteOnly ? "CLICK FOR QUOTE" : `$${t.price.toLocaleString()}`}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedTruck(t)}
                      className="p-2 border border-white/10 hover:border-[#FBBF24] rounded text-slate-400 hover:text-white transition-all cursor-pointer bg-[#0A1428]"
                      title="View Details"
                      id={`truck-view-btn-${t.id}`}
                    >
                      <Eye className="w-4 h-4 text-[#FBBF24]" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center rounded border border-white/10 bg-[#050B16] select-none">
            <ShieldAlert className="w-12 h-12 text-[#FBBF24] mx-auto mb-4" />
            <h3 className="text-lg font-black text-white uppercase italic">No Fleet Trucks Found</h3>
            <p className="text-slate-450 text-sm mt-1 max-w-sm mx-auto">
              We update our inventory daily. Please modify your search parameters or request a custom truck build quote.
            </p>
          </div>
        )}

        {/* Dynamic Modal for Details */}
        {selectedTruck && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-[#050B16]/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="relative w-full max-w-2xl bg-[#0A1428] border border-white/10 rounded shadow-2xl overflow-hidden animate-fade-in text-left">
              {/* Header */}
              <div className="p-6 border-b border-white/10 flex items-start justify-between bg-[#050B16]">
                <div>
                  <span className="text-xs uppercase font-black text-[#FBBF24] font-mono tracking-widest block">
                    {selectedTruck.condition} UNIT INVENT-ID #{selectedTruck.id}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white uppercase italic mt-1">{selectedTruck.name}</h3>
                </div>
                <button
                  onClick={() => {
                    setSelectedTruck(null);
                    setInquirySent(false);
                  }}
                  className="p-2 border border-white/10 bg-[#0A1428] text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
                  id="close-truck-modal"
                >
                  <X className="w-5 h-5 text-[#FBBF24]" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="grid gap-6 md:grid-cols-12">
                  <div className="md:col-span-5">
                    <img
                      src={selectedTruck.imageUrl}
                      alt={selectedTruck.name}
                      className="w-full h-auto object-cover rounded border-l-4 border-[#FBBF24] aspect-[4/3]"
                      referrerPolicy="no-referrer"
                    />
                    <div className="p-4 bg-[#050B16] rounded text-xs text-slate-400 space-y-1.5 mt-4 border border-white/10">
                      <p className="font-black text-[#FBBF24] uppercase tracking-wider">Queens Transport Guarantees</p>
                      <p className="text-slate-300">Includes direct commercial dispatch coordinates anywhere within our Richmond Hill service parameter.</p>
                    </div>
                  </div>

                  <div className="md:col-span-7 space-y-4">
                    <div className="text-3xl font-black text-[#FBBF24]">
                      {selectedTruck.isQuoteOnly ? "Click for Quote!" : `$${selectedTruck.price.toLocaleString()}`}
                    </div>

                    <div className="h-[1px] bg-white/10" />

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-black tracking-wider">Manufacturer</span>
                        <span className="font-bold text-white text-sm font-mono">{selectedTruck.make}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-black tracking-wider">Model Year</span>
                        <span className="font-bold text-white text-sm font-mono">{selectedTruck.year}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 block text-[10px] uppercase font-black tracking-wider">Commercial Engine Specs</span>
                        <span className="font-bold text-white text-sm font-mono text-[#FBBF24]">{selectedTruck.engine}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 block text-[10px] uppercase font-black tracking-wider">Vocational Transmission</span>
                        <span className="font-bold text-white text-sm font-mono">{selectedTruck.transmission}</span>
                      </div>
                    </div>

                    <div className="h-[1px] bg-white/10" />

                    <div className="space-y-2">
                      <span className="text-xs uppercase font-black text-slate-300 block tracking-wider">// Built-to-order Premium Upgrades</span>
                      <ul className="grid gap-1 text-xs text-slate-300">
                        {selectedTruck.specs.map((spec, i) => (
                          <li key={i} className="flex items-start gap-1.5 font-bold uppercase tracking-wide text-[11px]">
                            <span className="w-1.5 h-1.5 bg-[#FBBF24] mt-1.5 shrink-0" />
                            <span>{spec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="h-[1px] bg-white/10" />

                {/* Inquiry Form */}
                <div className="p-5 rounded bg-[#050B16] border border-white/10 space-y-4">
                  <div className="select-none leading-none">
                    <h4 className="text-xs font-black uppercase text-white tracking-widest text-[#FBBF24]">// Purchase Inquiry Form</h4>
                    <span className="text-[9px] text-slate-500 uppercase font-bold mt-1 block">Inbound fleet procurement setup desk</span>
                  </div>

                  <form onSubmit={handleInquiry} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[8px] font-black uppercase text-slate-450 tracking-wider block mb-1">Contact Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="Sal Moretti"
                          value={inquiryName}
                          onChange={(e) => setInquiryName(e.target.value)}
                          className="w-full px-3 py-2 bg-[#0A1428] border border-white/10 rounded placeholder:text-slate-600 text-xs font-bold uppercase tracking-wide text-white focus:outline-none focus:border-[#FBBF24]"
                        />
                      </div>
                      <div>
                        <label className="text-[8px] font-black uppercase text-slate-450 tracking-wider block mb-1">Company Svc</label>
                        <input
                          type="text"
                          placeholder="Queens Construction Co."
                          value={inquiryCompany}
                          onChange={(e) => setInquiryCompany(e.target.value)}
                          className="w-full px-3 py-2 bg-[#0A1428] border border-white/10 rounded placeholder:text-slate-600 text-xs font-bold uppercase tracking-wide text-white focus:outline-none focus:border-[#FBBF24]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[8px] font-black uppercase text-slate-455 tracking-wider block mb-1">Direct Dial Phone *</label>
                        <input
                          type="text"
                          required
                          placeholder="(718) 555-8833"
                          value={inquiryPhone}
                          onChange={(e) => setInquiryPhone(e.target.value)}
                          className="w-full px-3 py-2 bg-[#0A1428] border border-white/10 rounded placeholder:text-slate-600 text-xs font-bold uppercase tracking-wide text-white focus:outline-none focus:border-[#FBBF24]"
                        />
                      </div>
                      <div>
                        <label className="text-[8px] font-black uppercase text-slate-455 tracking-wider block mb-1">E-mail Inbox</label>
                        <input
                          type="email"
                          placeholder="sal@queensconstruction.com"
                          value={inquiryEmail}
                          onChange={(e) => setInquiryEmail(e.target.value)}
                          className="w-full px-3 py-2 bg-[#0A1428] border border-white/10 rounded placeholder:text-slate-600 text-xs font-bold text-white focus:outline-none focus:focus:border-[#FBBF24]"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-[#FBBF24] hover:bg-[#FBBF24]/90 text-[#0A1428] font-black text-xs uppercase tracking-widest rounded transition-colors cursor-pointer select-none shadow-md mt-1"
                      id="submit-inventory-inquiry"
                    >
                      ✔ Submit Quote Request Desk
                    </button>
                  </form>

                  {inquirySent && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-[10.5px] text-center rounded mt-3 uppercase tracking-wider leading-relaxed">
                      ✔ Inquiry received for {inquiryName} ({inquiryCompany || "Independent"})! Sal Diehl will contact you shortly with custom financing solutions.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
