/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Package, Search, ShoppingCart, CheckCircle, Tag, RefreshCw, CreditCard, Send } from "lucide-react";
import { useApp } from "../context/AppContext";
import { PartItem } from "../types";
import CheckoutModal from "./CheckoutModal";

export default function PartsCatalog() {
  const { parts, settings } = useApp();
  
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [cart, setCart] = useState<PartItem[]>([]);
  const [compatibilityTruck, setCompatibilityTruck] = useState("Hino L Series");
  const [rfqName, setRfqName] = useState("");
  const [rfqStatus, setRfqStatus] = useState<"idle" | "success">("idle");
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const toggleCart = (part: PartItem) => {
    // Check if the item is out of stock before adding
    if (part.stock === 0 && !cart.some((item) => item.id === part.id)) {
      alert("This commercial component is currently out of stock. Contact our parts room to backorder.");
      return;
    }

    if (cart.some((item) => item.id === part.id)) {
      setCart(cart.filter((item) => item.id !== part.id));
    } else {
      if (cart.length >= 5) {
        alert("Maximum 5 items in RFQ basket at a time.");
        return;
      }
      setCart([...cart, part]);
    }
  };

  const handleRfq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rfqName) return;
    setRfqStatus("success");
    setTimeout(() => {
      setRfqStatus("idle");
      setCart([]);
      setRfqName("");
    }, 5500);
  };

  // Filtration based on dynamic parts list from state hook
  const filteredParts = parts.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <section id="parts" className="w-full bg-[#0A1428] py-16 lg:py-24 border-b border-white/10 scroll-mt-20 text-slate-100">
      <div className="px-4 mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-12 gap-10 items-start">
          {/* Main Parts List - Left */}
          <div className="lg:col-span-8 space-y-8">
            <div className="space-y-3.5 select-none text-center lg:text-left">
              <div className="text-xs uppercase tracking-[0.25em] font-black text-[#FBBF24] flex items-center justify-center lg:justify-start gap-1.5">
                <Package className="w-4 h-4" />
                <span>OEM & Heavy-Duty Aftermarket Parts</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-white uppercase italic">NYC’s Commercial Parts Warehouse</h2>
              <p className="max-w-2xl text-slate-400 text-sm">
                Richmond Hill's most complete stock of heavy-duty parts. Genuine Muncie hydraulics, Cummins gaskets, Delco Remy alternators, and severe-duty brake calipers. Active, live stock counts!
              </p>
            </div>

            {/* Filtering tools */}
            <div className="p-4 rounded bg-[#050B16] border border-white/10 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FBBF24]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search parts by SKU, name, brand..."
                  className="w-full pl-9 pr-3 py-2 bg-[#0A1428] border border-white/10 rounded text-xs font-bold uppercase tracking-wider text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-[#FBBF24]"
                />
              </div>

              {/* Categorization chips */}
              <div className="flex flex-wrap gap-1.5 justify-center md:justify-end">
                {["All", "Hydraulics", "Braking System", "Electrical", "Filters & Fluids", "Engine & Drivetrain"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded text-xs font-black uppercase tracking-wider transition-all border cursor-pointer ${
                      selectedCategory === cat
                        ? "bg-[#FBBF24] border-[#FBBF24] text-[#0A1428]"
                        : "bg-[#0A1428] border-white/10 text-slate-350 hover:text-white"
                    }`}
                    id={`parts-cat-chip-${cat.replace(/\s+/g, "")}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Compatibility verification widget */}
            <div className="p-4 rounded bg-[#050B16]/70 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <RefreshCw className="w-5 h-5 text-[#FBBF24] shrink-0" />
                <div>
                  <span className="text-xs font-black text-white uppercase tracking-wider block">Compatibility Verifier</span>
                  <span className="text-[11px] text-slate-400 block font-medium">Verify structural fits against active Commercial Chassis categories.</span>
                </div>
              </div>
              <div className="shrink-0 select-none">
                <select
                  value={compatibilityTruck}
                  onChange={(e) => setCompatibilityTruck(e.target.value)}
                  className="px-3.5 py-2.5 bg-[#0A1428] border border-white/10 rounded text-xs font-black uppercase tracking-widest text-[#FBBF24] focus:outline-none focus:border-[#FBBF24] cursor-pointer"
                  id="parts-compatibility-select"
                >
                  <option value="Hino L Series">Hino L Series (L6 / L7)</option>
                  <option value="Isuzu NQR/NRR">Isuzu Class 5 (NRR / NQR)</option>
                  <option value="Freightliner M2">Freightliner Business Class M2</option>
                  <option value="Mitsubishi FE">Mitsubishi Fuso FE Series</option>
                  <option value="Cummins B6.7">Cummins B6.7 Engine Models</option>
                </select>
              </div>
            </div>

            {/* Parts Grid */}
            {filteredParts.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {filteredParts.map((p) => {
                  const isInCart = cart.some((item) => item.id === p.id);
                  const isCompatible = p.compatibleModels.some((m) =>
                    compatibilityTruck.toLowerCase().includes(m.toLowerCase()) ||
                    m.toLowerCase().includes(compatibilityTruck.toLowerCase())
                  );

                  return (
                    <div
                      key={p.id}
                      className="p-5 rounded bg-[#050B16] border border-white/10 flex flex-col justify-between hover:border-[#FBBF24]/50 transition-all shadow-xl"
                      id={`part-item-${p.id}`}
                    >
                      <div className="space-y-3.5">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[9px] font-mono text-slate-500 block uppercase tracking-widest font-black">// SKU: {p.sku}</span>
                            <span className="text-sm font-black text-white block uppercase tracking-wide mt-1 leading-normal">{p.name}</span>
                          </div>
                          <span className="px-2 py-0.5 bg-black/60 border border-white/10 rounded text-[9px] text-[#FBBF24] font-mono font-bold tracking-widest shrink-0">
                            {p.brand}
                          </span>
                        </div>

                        {/* Compatibility and inventory status */}
                        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
                          <div className="flex items-center gap-1.5 font-sans">
                            <span className={`w-1.5 h-1.5 rounded-full ${isCompatible ? "bg-emerald-500 animate-pulse" : "bg-slate-700"}`} />
                            <span className={isCompatible ? "text-emerald-400 font-extrabold text-[10px]" : "text-slate-400 text-[10px]"}>
                              {isCompatible ? "✔ Fits Selection" : "Verify Fitment Link"}
                            </span>
                          </div>
                          
                          {p.stock === 0 ? (
                            <span className="text-red-400 font-black text-[10px] uppercase">// OUT OF STOCK</span>
                          ) : (
                            <span className="text-slate-400 font-mono text-[10px]">{p.stock} units available</span>
                          )}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-white/5 flex items-center justify-between mt-4">
                        <div>
                          <span className="text-[10px] uppercase font-black text-slate-500 block">Unit Cost</span>
                          <span className="text-base font-black text-white font-mono">${p.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <button
                          onClick={() => toggleCart(p)}
                          className={`px-3.5 py-2 text-[10px] uppercase font-black tracking-widest rounded flex items-center gap-1.5 transition-all cursor-pointer ${
                            p.stock === 0
                              ? "bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed"
                              : isInCart
                              ? "bg-[#0A1428] text-[#FBBF24] border border-[#FBBF24]/30"
                              : "bg-[#FBBF24] text-[#0A1428] hover:bg-[#FBBF24]/90 border border-transparent"
                          }`}
                          disabled={p.stock === 0 && !isInCart}
                          id={`parts-cart-btn-${p.id}`}
                        >
                          <ShoppingCart className="w-3.5 h-3.5 stroke-[3]" />
                          <span>{p.stock === 0 ? "Out of Stock" : isInCart ? "Remove Spec" : "Add to Basket"}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center bg-[#050B16] rounded border border-white/10">
                <span className="text-slate-500 font-mono text-xs uppercase tracking-widest font-bold">No matching specialized parts found</span>
              </div>
            )}
          </div>

          {/* RFQ Cart Builder & E-Commerce Checkout - Right */}
          <div className="lg:col-span-4 lg:sticky lg:top-28">
            <div className="p-6 rounded bg-[#050B16] border border-white/10 shadow-2xl space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 left-0 h-1 bg-[#FBBF24]" />
              <div className="flex items-center justify-between select-none font-sans">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4.5 h-4.5 text-[#FBBF24] stroke-[3]" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#FBBF24]">Parts RFQ & E-Commerce Basket</h3>
                </div>
                <div className="px-2.5 py-0.5 rounded bg-[#FBBF24]/10 text-[#FBBF24] text-xs font-black">
                  {cart.length}/5 ITEMS
                </div>
              </div>

              {cart.length > 0 ? (
                <div className="space-y-4">
                  <div className="space-y-2 max-h-[220px] overflow-y-auto w-full">
                    {cart.map((item) => (
                      <div key={item.id} className="p-3 bg-[#0A1428] border border-white/5 rounded flex justify-between items-center text-xs">
                        <div className="max-w-[70%]">
                          <span className="text-[9px] text-slate-500 block font-mono font-bold tracking-widest">{item.sku}</span>
                          <span className="font-black text-white block uppercase tracking-wide truncate">{item.name}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-white block font-black font-mono">${item.price.toLocaleString()}</span>
                          <button
                            onClick={() => toggleCart(item)}
                            className="text-[9px] text-[#FBBF24] hover:text-[#FBBF24]/80 underline font-black uppercase tracking-widest mt-0.5 cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 rounded bg-[#0A1428] border border-white/10 text-xs space-y-2.5">
                    <div className="flex justify-between font-black uppercase tracking-wider text-slate-400 text-[10px]">
                      <span>Parts Subtotal:</span>
                      <span className="text-white font-mono text-sm">
                        ${cart.reduce((sum, item) => sum + item.price, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold font-sans">
                      *Instant Online Checkout includes NYC Sales Tax (8.875%) & delivery calculated live.
                    </p>
                  </div>

                  {/* E-Commerce Checkout Direct CTA */}
                  <div className="pt-2 select-none">
                    <button
                      onClick={() => setIsCheckoutOpen(true)}
                      className="w-full py-4.5 bg-[#FBBF24] hover:bg-[#FBBF24]/90 text-[#0A1428] font-black text-xs uppercase tracking-widest rounded transition-all cursor-pointer shadow-md shadow-[#FBBF24]/20 flex items-center justify-center gap-2"
                      id="launch-ecommerce-checkout"
                    >
                      <CreditCard className="w-4 h-4 stroke-[3]" />
                      <span>Buy Online & Instant Ship</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2 w-full justify-center select-none py-1">
                    <div className="h-[1px] bg-white/5 flex-1" />
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest font-mono">OR OPTIONAL RFQ</span>
                    <div className="h-[1px] bg-white/5 flex-1" />
                  </div>

                  {/* Submission form */}
                  <form onSubmit={handleRfq} className="space-y-3 pt-1">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-350 block">// Email Quote Invoice Outline</label>
                      <input
                        type="text"
                        required
                        placeholder="Company Name (e.g. Sal's Towing)"
                        value={rfqName}
                        onChange={(e) => setRfqName(e.target.value)}
                        className="w-full px-3 py-2.5 bg-[#0A1428] border border-white/10 rounded placeholder:text-slate-550 text-xs font-bold uppercase focus:outline-none focus:border-[#FBBF24]"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3 bg-[#0A1428] hover:bg-[#050B16] text-[#FBBF24] border border-[#FBBF24]/20 hover:border-[#FBBF24]/50 font-black text-[10px] uppercase tracking-widest rounded transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      id="submit-parts-rfq"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Request Parts availability Quote</span>
                    </button>
                  </form>

                  {rfqStatus === "success" && (
                    <div className="p-2.5 bg-[#0A1428] border border-emerald-500/20 text-emerald-400 font-bold text-xs text-center rounded uppercase tracking-wider leading-relaxed">
                      ✔ RFQ Broadcasted! Sal's parts team will verify current Richmond Hill bay stock and email/call you within 15 minutes.
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center rounded bg-black/30 border border-white/10 select-none space-y-3">
                  <Package className="w-8 h-8 text-[#FBBF24] mx-auto opacity-70" />
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Basket is Empty</h4>
                    <p className="text-[10px] text-slate-500 mt-1 max-w-[200px] mx-auto leading-relaxed font-sans">Add specialized parts to initiate online checkout or custom quotation requests.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Modal Overlay Popup */}
      {isCheckoutOpen && (
        <CheckoutModal
          cartItems={cart}
          onClose={() => setIsCheckoutOpen(false)}
          onSuccess={() => setCart([])}
        />
      )}
    </section>
  );
}
