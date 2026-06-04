/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { PartItem, OrderItem } from "../types";
import { X, CreditCard, Ship, DollarSign, Loader2, CheckCircle, FileText, ArrowRight, ArrowLeft } from "lucide-react";

interface CheckoutModalProps {
  cartItems: PartItem[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function CheckoutModal({ cartItems, onClose, onSuccess }: CheckoutModalProps) {
  const { createOrder, currentCustomer } = useApp();
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any>(null);

  // Form states
  const [formData, setFormData] = useState({
    customerName: currentCustomer?.name || "",
    companyName: currentCustomer?.companyName || "",
    phone: currentCustomer?.phone || "",
    email: currentCustomer?.email || "",
    addressOption: currentCustomer?.address ? "queens_express" : "pickup", // pickup, queens_express, ltl_freight
    addressCustom: currentCustomer?.address || "",
    paymentMethod: "Fleet Card" as "Fleet Card" | "Credit Card",
    cardName: currentCustomer?.name ? currentCustomer.name.toUpperCase() : "",
    cardNumber: "",
    cardExpiry: "",
    cardCvv: ""
  });

  // Calculate pricing
  const subtotal = cartItems.reduce((sum, item) => sum + item.price, 0);
  
  // Shipping cost
  let shipping = 0;
  if (formData.addressOption === "queens_express") shipping = 15;
  else if (formData.addressOption === "ltl_freight") {
    shipping = subtotal >= 1000 ? 0 : 45;
  }

  // NYC / Queens Tax is 8.875%
  const taxRate = 0.08875;
  const tax = (subtotal + shipping) * taxRate;
  const total = subtotal + shipping + tax;

  // Handle billing number masking helper
  const handleCardNumberChange = (val: string) => {
    // Basic auto-formatting XXXX-XXXX-XXXX-XXXX
    const cleaned = val.replace(/\D/g, "");
    const limited = cleaned.slice(0, 16);
    let formatted = "";
    for (let i = 0; i < limited.length; i++) {
      if (i > 0 && i % 4 === 0) formatted += "-";
      formatted += limited[i];
    }
    setFormData({ ...formData, cardNumber: formatted });
  };

  const handleExpiryChange = (val: string) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 4);
    let formatted = cleaned;
    if (cleaned.length > 2) {
      formatted = cleaned.slice(0, 2) + "/" + cleaned.slice(2, 4);
    }
    setFormData({ ...formData, cardExpiry: formatted });
  };

  const handleCvvChange = (val: string) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 4);
    setFormData({ ...formData, cardCvv: cleaned });
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!formData.customerName || !formData.companyName || !formData.phone) {
        alert("Please specify customer, company name, and callbacks.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!formData.cardName || formData.cardNumber.length < 15 || !formData.cardExpiry) {
        alert("Please enter valid card billing details.");
        return;
      }
      setStep(3);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate merchant processing timer
    setTimeout(() => {
      // Build order items
      const orderItems: OrderItem[] = cartItems.map((item) => ({
        id: item.id,
        sku: item.sku,
        name: item.name,
        price: item.price,
        quantity: 1
      }));

      // Mask credit card
      const lastFour = formData.cardNumber.slice(-4);
      const hostMask = `${formData.paymentMethod === "Fleet Card" ? "FLEET" : "CREDIT"} ****-****-****-${lastFour}`;

      const finalAddress = 
        formData.addressOption === "pickup" 
          ? "Counter Collection (129-01 Atlantic Ave, Richmond Hill, NY)"
          : `${formData.addressOption === "queens_express" ? "Queens Fast Shuttle" : "Outer Borough Freight"} - ${formData.addressCustom}`;

      // Call Context Creator which decrements inventory units as well
      const deployedOrder = createOrder({
        customerId: currentCustomer?.id,
        customerName: formData.customerName,
        companyName: formData.companyName,
        phone: formData.phone,
        email: formData.email,
        address: finalAddress,
        items: orderItems,
        subtotal,
        tax,
        shipping,
        total,
        paymentMethod: formData.paymentMethod,
        cardNumberHidden: hostMask
      });

      setCompletedOrder(deployedOrder);
      setIsSubmitting(false);
    }, 2800);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 font-sans select-text">
      {/* Container Card */}
      <div className="relative w-full max-w-xl bg-[#0A1428] border border-white/10 rounded shadow-2xl overflow-hidden text-slate-100 flex flex-col">
        <div className="absolute top-0 right-0 left-0 h-1 bg-[#FBBF24]" />
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 bg-[#050B16] flex justify-between items-center select-none">
          <div>
            <div className="flex items-center gap-1.5 text-[#FBBF24]">
              <CreditCard className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest font-mono">// SECURE CHECKOUT</span>
            </div>
            <h3 className="text-base font-extrabold text-white uppercase mt-0.5">Diehl's E-Commerce Terminal</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded hover:bg-white/5 text-slate-400 hover:text-[#FBBF24] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 min-h-[300px] max-h-[80vh] overflow-y-auto">
          {!completedOrder ? (
            <div>
              {/* Stepper Progress Bar */}
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider mb-6 pb-3 border-b border-white/5 select-none text-center">
                <span className={`w-[30%] pb-1 ${step >= 1 ? "text-[#FBBF24] border-b-2 border-[#FBBF24]" : "text-slate-500"}`}>1. Coordinates</span>
                <span className={`w-[30%] pb-1 ${step >= 2 ? "text-[#FBBF24] border-b-2 border-[#FBBF24]" : "text-slate-500"}`}>2. Fleet Card</span>
                <span className={`w-[30%] pb-1 ${step >= 3 ? "text-[#FBBF24] border-b-2 border-[#FBBF24]" : "text-slate-500"}`}>3. Dispatch Order</span>
              </div>

              {/* STEP 1: COORDINATES BRANDED FLOW */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-widest text-[#FBBF24]">// Fleet Dispatch Information</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-medium">Verify callback numbers and drop-off coordinates in NYC.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-350 block mb-1">Company Fleet Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Sal or Transit NY"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        className="w-full px-3 py-2 bg-[#050B16] border border-white/10 rounded text-xs text-white uppercase font-bold focus:outline-none focus:border-[#FBBF24]"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-350 block mb-1">Requester Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Sal Moretti"
                        value={formData.customerName}
                        onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                        className="w-full px-3 py-2 bg-[#050B16] border border-white/10 rounded text-xs text-white font-bold focus:outline-none focus:border-[#FBBF24]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-350 block mb-1">Callback Phone Number</label>
                      <input
                        type="tel"
                        required
                        placeholder="(718) 555-0190"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 bg-[#050B16] border border-white/10 rounded text-xs text-[#FBBF24] font-bold focus:outline-none focus:border-[#FBBF24]"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-350 block mb-1">Email Address</label>
                      <input
                        type="email"
                        placeholder="billing@company.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 bg-[#050B16] border border-white/10 rounded text-xs text-white focus:outline-none focus:border-[#FBBF24]"
                      />
                    </div>
                  </div>

                  <hr className="border-white/5" />

                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-350 block mb-1">Queens Dispatch & Collection Plan</label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 p-2.5 rounded bg-black/40 border border-white/5 cursor-pointer selection:bg-transparent">
                        <input
                          type="radio"
                          name="addressOption"
                          checked={formData.addressOption === "pickup"}
                          onChange={() => setFormData({ ...formData, addressOption: "pickup" })}
                          className="w-4 h-4 accent-[#FBBF24] cursor-pointer"
                        />
                        <div>
                          <span className="text-xs font-black uppercase tracking-wide text-white block">Counter Pickup at Richmond Hill</span>
                          <span className="text-[10px] text-slate-450 uppercase tracking-widest block font-bold font-mono mt-0.5">112-14 Atlantic Ave ($0 - Ready in 15m)</span>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-2.5 rounded bg-black/40 border border-white/5 cursor-pointer select-none">
                        <input
                          type="radio"
                          name="addressOption"
                          checked={formData.addressOption === "queens_express"}
                          onChange={() => setFormData({ ...formData, addressOption: "queens_express" })}
                          className="w-4 h-4 accent-[#FBBF24] cursor-pointer"
                        />
                        <div>
                          <span className="text-xs font-black uppercase tracking-wide text-white block">Queens Hotshot Shuttle Delivery</span>
                          <span className="text-[10px] text-[#FBBF24] uppercase tracking-widest font-black font-mono mt-0.5">+$15.00 (Same-day dispatch)</span>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-2.5 rounded bg-black/40 border border-white/5 cursor-pointer select-none">
                        <input
                          type="radio"
                          name="addressOption"
                          checked={formData.addressOption === "ltl_freight"}
                          onChange={() => setFormData({ ...formData, addressOption: "ltl_freight" })}
                          className="w-4 h-4 accent-[#FBBF24] cursor-pointer"
                        />
                        <div>
                          <span className="text-xs font-black uppercase tracking-wide text-white block">Brooklyn / Bronx / NY LTL Freight</span>
                          <span className="text-[10px] text-slate-450 uppercase tracking-widest font-black font-mono block mt-0.5">
                            {subtotal >= 1000 ? "FREE FREIGHT OVER $1,000" : "+$45.00 Flat rate LTL"}
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {formData.addressOption !== "pickup" && (
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-[#FBBF24] block mb-1">Enter Delivery Street Address (NY State Only)</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 102-45 Rockaway Blvd, Ozone Park, NY 11417"
                        value={formData.addressCustom}
                        onChange={(e) => setFormData({ ...formData, addressCustom: e.target.value })}
                        className="w-full px-3 py-2 bg-[#050B16] border border-white/10 rounded text-xs text-white font-bold focus:outline-none focus:border-[#FBBF24]"
                      />
                    </div>
                  )}

                  <div className="pt-4 flex justify-end">
                    <button
                      onClick={handleNextStep}
                      className="px-5 py-3.5 bg-[#FBBF24] text-[#0A1428] hover:bg-[#FBBF24]/90 rounded text-xs font-black uppercase tracking-widest flex items-center gap-1.5 cursor-pointer transition-all shadow-md shadow-[#FBBF24]/10 select-none font-sans"
                    >
                      <span>Proceed to Payment</span>
                      <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: BILLING & PAYMENT DETAILS */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-xs font-black uppercase tracking-widest text-[#FBBF24]">// Commercial Payment Schedules</h4>
                    <p className="text-[11px] text-slate-400 font-medium leading-relaxed">Choose commercial fleet cards or general cards for invoice settlement.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, paymentMethod: "Fleet Card" })}
                      className={`p-3 border rounded text-xs uppercase font-black transition-all cursor-pointer ${
                        formData.paymentMethod === "Fleet Card"
                          ? "bg-black/55 border-[#FBBF24] text-white"
                          : "bg-[#050B16] border-white/5 text-slate-400 hover:border-white/10"
                      }`}
                    >
                      🛡️ Wex / Corpay Fleet
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, paymentMethod: "Credit Card" })}
                      className={`p-3 border rounded text-xs uppercase font-black transition-all cursor-pointer ${
                        formData.paymentMethod === "Credit Card"
                          ? "bg-black/55 border-[#FBBF24] text-white"
                          : "bg-[#050B16] border-white/5 text-slate-400 hover:border-white/10"
                      }`}
                    >
                      💳 Visa / MC / Amex
                    </button>
                  </div>

                  <hr className="border-white/5" />

                  <div className="space-y-3.5">
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-350 block mb-1">Company Cardholder Name</label>
                      <input
                        type="text"
                        required
                        placeholder="SAL MORETTI"
                        value={formData.cardName}
                        onChange={(e) => setFormData({ ...formData, cardName: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 bg-[#050B16] border border-white/10 rounded text-xs text-white font-bold tracking-wide uppercase focus:outline-none focus:border-[#FBBF24]"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-350 block mb-1">Card Number (Fleet or Credit Number)</label>
                      <input
                        type="text"
                        required
                        placeholder="4111-2222-3333-4444"
                        value={formData.cardNumber}
                        onChange={(e) => handleCardNumberChange(e.target.value)}
                        className="w-full px-3 py-2 bg-[#050B16] border border-white/10 rounded text-xs text-[#FBBF24] font-black font-mono tracking-widest focus:outline-none focus:border-[#FBBF24]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-350 block mb-1">Expiration (MM/YY)</label>
                        <input
                          type="text"
                          required
                          placeholder="12/28"
                          value={formData.cardExpiry}
                          onChange={(e) => handleExpiryChange(e.target.value)}
                          className="w-full px-3 py-2 bg-[#050B16] border border-white/10 rounded text-xs text-white font-mono tracking-widest focus:outline-none focus:border-[#FBBF24]"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-350 block mb-1">CVV Lock Code</label>
                        <input
                          type="password"
                          required
                          placeholder="***"
                          value={formData.cardCvv}
                          onChange={(e) => handleCvvChange(e.target.value)}
                          className="w-full px-3 py-2 bg-[#050B16] border border-white/10 rounded text-xs text-white font-mono tracking-widest focus:outline-none focus:border-[#FBBF24]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-between select-none">
                    <button
                      onClick={() => setStep(1)}
                      className="px-4 py-3 bg-[#050B16] hover:bg-[#0A1428] border border-white/10 rounded text-xs font-black uppercase tracking-widest flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                    <button
                      onClick={handleNextStep}
                      className="px-5 py-3.5 bg-[#FBBF24] text-[#0A1428] hover:bg-[#FBBF24]/90 rounded text-xs font-black uppercase tracking-widest flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#FBBF24]/10 font-sans"
                    >
                      <span>Review Requisition</span>
                      <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: TRANSACTION SUMMARY & SUBMISSION */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-xs font-black uppercase tracking-widest text-[#FBBF24]">// Purchase Summary Check</h4>
                    <p className="text-[11px] text-slate-400 font-medium">Verify structural totals and charges before charging card.</p>
                  </div>

                  {/* Components breakdown */}
                  <div className="bg-black/30 p-4 border border-white/5 rounded text-xs space-y-2.5">
                    <div className="space-y-1.5">
                      {cartItems.map((item) => (
                        <div key={item.id} className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-300 font-extrabold uppercase truncate max-w-[70%]">{item.name}</span>
                          <span className="text-white font-mono font-bold font-mono shrink-0">${item.price.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>

                    <div className="h-[1px] bg-white/5 w-full my-2" />

                    {/* Financial Tally */}
                    <div className="space-y-1 text-[11px] uppercase text-slate-400 font-bold">
                      <div className="flex justify-between">
                        <span>Requisition Subtotal:</span>
                        <span className="text-white font-mono">${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Dispatch Charge ({formData.addressOption === "pickup" ? "Counter" : "Shuttle Courier"}):</span>
                        <span className="text-white font-mono">${shipping.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>NYC Queens Sales Tax (8.875%):</span>
                        <span className="text-white font-mono">${tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-xs font-black text-[#FBBF24] pt-2 border-t border-white/5 mt-1">
                        <span>Total Due Invoice Charge:</span>
                        <span className="font-mono">${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Billing Card details */}
                  <div className="p-3 bg-[#050B16] rounded border border-white/10 text-xs font-bold uppercase tracking-wider space-y-1 leading-relaxed">
                    <p className="text-[9px] text-slate-500 font-black">// Billing Instrument</p>
                    <p className="text-white">Cardholder: <span className="text-slate-300">{formData.cardName}</span></p>
                    <p className="text-white">Account: <span className="text-[#FBBF24] font-mono tracking-widest">{formData.paymentMethod === "Fleet Card" ? "FLEET" : "CARD"} ****-****-****-{formData.cardNumber.slice(-4)}</span></p>
                  </div>

                  {/* Submit Secure */}
                  <form onSubmit={handleSubmit} className="pt-2 select-none">
                    {isSubmitting ? (
                      <div className="p-5 bg-[#050B16] rounded border border-white/5 text-center flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-[#FBBF24] animate-spin" />
                        <div>
                          <p className="text-xs font-black text-[#FBBF24] uppercase tracking-widest">Encrypting Fleet Transaction Ledger...</p>
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mt-1">Decrementing stock sheets & reserving components at 112-14 Atlantic Ave</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2.5">
                        <button
                          type="button"
                          onClick={() => setStep(2)}
                          className="px-4 py-3 bg-[#050B16] hover:bg-[#0A1428] border border-white/10 rounded text-xs font-black uppercase tracking-widest flex items-center gap-1 cursor-pointer"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>Back</span>
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-4.5 bg-[#FBBF24] text-[#0A1428] hover:bg-[#FBBF24]/90 text-xs font-black uppercase tracking-widest rounded transition-all cursor-pointer shadow-md shadow-[#FBBF24]/15 flex items-center justify-center gap-1.5"
                          id="submit-secured-payment"
                        >
                          <span>✔ SECURE PAY & INVOICE COMMITTAL</span>
                        </button>
                      </div>
                    )}
                  </form>
                </div>
              )}
            </div>
          ) : (
            // ORDER LOG COMPLETED: REVEAL INVOICE SHEET!
            <div className="space-y-5">
              <div className="text-center py-4 space-y-1 select-none">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2 border border-emerald-500/30">
                  <CheckCircle className="w-6 h-6 stroke-[2.5]" />
                </div>
                <h4 className="text-sm font-black text-emerald-400 uppercase tracking-widest">Fleet Requisition Confirmed</h4>
                <p className="text-xs text-slate-400 uppercase font-bold leading-relaxed">Invoice DTW Dispatch code is broadcasted to Richmond Hill Desk!</p>
              </div>

              {/* Real Print Invoice style */}
              <div className="bg-white text-slate-900 rounded p-6 shadow-inner font-sans border-2 border-[#0A1428]">
                <div className="flex justify-between items-start border-b border-slate-300 pb-4 select-none">
                  <div>
                    <h5 className="text-[10px] font-black tracking-[0.2em] text-[#0A1428]">DIEHL'S TRUCK WORLD INC</h5>
                    <p className="text-[8px] text-slate-500 font-extrabold font-mono uppercase">112-14 Atlantic Ave, Richmond Hill, NY 11418</p>
                    <p className="text-[8px] text-slate-500 font-extrabold font-mono uppercase">Tel: (718) 555-0190 | NYS LICENSE: 718-922</p>
                  </div>
                  <div className="text-right">
                    <span className="px-1.5 py-0.5 bg-slate-900 text-white rounded text-[8px] font-black font-mono tracking-widest uppercase">OFFICIAL INVOICE</span>
                    <p className="text-xs font-black font-mono text-slate-900 mt-2">{completedOrder.id}</p>
                    <p className="text-[8px] text-slate-500 font-bold font-mono uppercase">{completedOrder.date}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-200 text-[10px] select-text">
                  <div>
                    <span className="text-[8px] text-slate-400 font-black tracking-wider uppercase block">BILL TO / DISPATCH COORDINATES</span>
                    <strong className="text-slate-900 uppercase block font-extrabold mt-0.5">{completedOrder.companyName}</strong>
                    <span className="text-slate-650 block">Requester: {completedOrder.customerName}</span>
                    <span className="text-slate-650 block">Call-back: {completedOrder.phone}</span>
                    <span className="text-slate-650 block">Drop-off: {completedOrder.address}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] text-slate-400 font-black tracking-wider uppercase block">PAYMENT SETTLEMENT SHEET</span>
                    <strong className="text-slate-900 uppercase block font-extrabold mt-0.5">{completedOrder.paymentMethod} Charged</strong>
                    <span className="text-slate-650 block mt-0.5 font-mono">{completedOrder.cardNumberHidden}</span>
                    <span className="text-emerald-700 bg-emerald-500/15 px-1 rounded text-[8px] font-black uppercase mt-1 inline-block">PAID / APPROVED</span>
                  </div>
                </div>

                {/* Items in Invoice table */}
                <div className="py-4 space-y-2 border-b border-slate-200 select-text">
                  <span className="text-[8px] text-slate-400 font-black tracking-wider uppercase block">ACQUIRED VEHICLE COMPONENTS</span>
                  <table className="w-full text-[10px] text-left">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-extrabold text-[8px] uppercase">
                        <th className="pb-1">Component description</th>
                        <th className="pb-1">SKU Code</th>
                        <th className="pb-1 text-center">Qty</th>
                        <th className="pb-1 text-right">Unit cost</th>
                        <th className="pb-1 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {completedOrder.items.map((item: any, idx: number) => (
                        <tr key={idx} className="border-b border-slate-100 font-bold">
                          <td className="py-2 text-slate-900 uppercase">{item.name}</td>
                          <td className="py-2 text-slate-500 font-mono">{item.sku}</td>
                          <td className="py-2 text-[#0A1428] font-mono text-center">x{item.quantity}</td>
                          <td className="py-2 text-slate-900 text-right font-mono">${item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className="py-2 text-slate-950 font-black text-right font-mono">${(item.price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pricing subtotal and total */}
                <div className="pt-4 flex justify-between items-start text-[10px] font-bold uppercase select-none">
                  <div className="text-slate-500 max-w-[50%] normal-case leading-relaxed select-text text-[9px]">
                    <span className="font-extrabold uppercase text-slate-900 text-[8px] block">DISPATCHER NOTES</span>
                    ✔ Reserved components in Richmond Hill bay shelves. Shipping courier crew will call callback number prior to transit dispatch.
                  </div>
                  <div className="text-right space-y-1.5 w-[45%]">
                    <div className="flex justify-between text-slate-500 text-[9px]">
                      <span>Items Subtotal:</span>
                      <strong className="text-slate-800 font-mono">${completedOrder.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                    </div>
                    <div className="flex justify-between text-slate-500 text-[9px]">
                      <span>Transit Freight:</span>
                      <strong className="text-slate-800 font-mono">${completedOrder.shipping.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                    </div>
                    <div className="flex justify-between text-slate-500 text-[9px]">
                      <span>NYC S-Tax (8.875%):</span>
                      <strong className="text-slate-800 font-mono">${completedOrder.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                    </div>
                    <div className="flex justify-between text-[11px] font-black text-[#0A1428] border-t border-slate-300 pt-1.5 mt-1">
                      <span>Total Charged:</span>
                      <span className="font-mono">${completedOrder.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="flex gap-2 select-none pt-2">
                <button
                  onClick={() => {
                    onSuccess();
                    onClose();
                  }}
                  className="w-full py-4 bg-[#FBBF24] hover:bg-[#FBBF24]/90 text-[#0A1428] font-black text-xs uppercase tracking-widest rounded transition-colors cursor-pointer text-center"
                >
                  Conclude Transactions & Clear Basket
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
