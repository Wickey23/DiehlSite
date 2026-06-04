/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { Customer } from "../types";
import { 
  X, User, Mail, Lock, Phone, Building, ShoppingBag, 
  Loader2, CheckCircle, Calendar, MapPin, CreditCard, 
  ArrowRight, Edit2, Save, LogOut, ShieldCheck,
  Wrench, Activity, Compass, FileText, AlertTriangle, Truck
} from "lucide-react";

interface CustomerDashboardProps {
  onClose: () => void;
}

export default function CustomerDashboard({ onClose }: CustomerDashboardProps) {
  const { 
    currentCustomer, 
    orders, 
    serviceAppointments,
    registerCustomer, 
    loginCustomer, 
    logoutCustomer, 
    updateCustomer 
  } = useApp();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [activeTab, setActiveTab] = useState<"tracking" | "orders" | "profile">("tracking");
  const [selectedTrackType, setSelectedTrackType] = useState<"order" | "service">("order");
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: ""
  });

  // Register form state
  const [registerForm, setRegisterForm] = useState({
    name: "",
    companyName: "",
    phone: "",
    email: "",
    password: "",
    address: ""
  });

  // Profile edit form state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    companyName: "",
    phone: "",
    email: "",
    address: ""
  });

  // Open Edit Profile mode
  const startEditingProfile = (customer: Customer) => {
    setProfileForm({
      name: customer.name,
      companyName: customer.companyName,
      phone: customer.phone,
      email: customer.email,
      address: customer.address || ""
    });
    setIsEditingProfile(true);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    setTimeout(() => {
      const res = loginCustomer(loginForm.email, loginForm.password);
      setIsSubmitting(false);
      if (res.success) {
        setSuccessMessage(`Welcome back, ${res.customer?.name}!`);
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setErrorMessage(res.error || "Login failed");
      }
    }, 1500);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    
    if (!registerForm.name || !registerForm.companyName || !registerForm.phone || !registerForm.email || !registerForm.password) {
      setErrorMessage("Please complete all required fields.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const res = registerCustomer({
        name: registerForm.name,
        companyName: registerForm.companyName,
        phone: registerForm.phone,
        email: registerForm.email,
        password: registerForm.password,
        address: registerForm.address
      });
      setIsSubmitting(false);
      if (res.success) {
        setSuccessMessage("Account created successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setErrorMessage(res.error || "Registration failed");
      }
    }, 1500);
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCustomer) return;

    const updated: Customer = {
      ...currentCustomer,
      name: profileForm.name,
      companyName: profileForm.companyName,
      phone: profileForm.phone,
      email: profileForm.email,
      address: profileForm.address
    };

    updateCustomer(updated);
    setIsEditingProfile(false);
    setSuccessMessage("Profile updated successfully!");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  // Filter orders matching logged-in customer (via customer ID or registration email)
  const customerOrders = orders.filter(
    (order) => 
      (currentCustomer && order.customerId === currentCustomer.id) ||
      (currentCustomer && order.email.toLowerCase().trim() === currentCustomer.email.toLowerCase().trim())
  );

  // Filter service appointments matching logged-in customer
  const customerAppointments = (serviceAppointments || []).filter(
    (app) => 
      (currentCustomer && app.customerId === currentCustomer.id) ||
      (currentCustomer && app.email.toLowerCase().trim() === currentCustomer.email.toLowerCase().trim())
  );

  // Auto-select first item when orders or appointments update
  useEffect(() => {
    if (activeTab === "tracking" && !selectedTrackId) {
      if (customerOrders.length > 0) {
        setSelectedTrackId(customerOrders[0].id);
        setSelectedTrackType("order");
      } else if (customerAppointments.length > 0) {
        setSelectedTrackId(customerAppointments[0].id);
        setSelectedTrackType("service");
      }
    }
  }, [activeTab, customerOrders, customerAppointments, selectedTrackId]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 font-sans select-text">
      {/* Central Modal container */}
      <div className="relative w-full max-w-2xl bg-[#0A1428] border border-white/10 rounded-lg shadow-2xl overflow-hidden text-slate-100 flex flex-col">
        <div className="absolute top-0 right-0 left-0 h-1 bg-[#FBBF24]" />

        {/* Header */}
        <div className="px-6 py-4.5 border-b border-white/10 bg-[#050B16] flex justify-between items-center select-none">
          <div>
            <div className="flex items-center gap-1.5 text-[#FBBF24]">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest font-mono">// DIEHL'S CUSTOMER PORTAL</span>
            </div>
            <h3 className="text-base font-extrabold text-white uppercase mt-0.5">
              {currentCustomer ? `Fleet Account: ${currentCustomer.companyName}` : "Customer Accounts & Checkout Services"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/5 text-slate-400 hover:text-[#FBBF24] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast Notification Banner */}
        {successMessage && (
          <div className="bg-emerald-950/40 border-b border-emerald-500/20 px-6 py-3 text-emerald-450 text-xs font-black uppercase tracking-wide flex items-center gap-2 select-none">
            <CheckCircle className="w-4 h-4 stroke-[3]" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-950/40 border-b border-red-500/20 px-6 py-3 text-red-400 text-xs font-black uppercase tracking-wide flex items-center gap-2 select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* NOT LOGGED IN: LOGIN / REGISTER FORMS */}
        {!currentCustomer ? (
          <div className="p-6 sm:p-8 max-h-[85vh] overflow-y-auto">
            {/* Toggle Switch Tabs */}
            <div className="flex border-b border-white/5 mb-6 select-none bg-black/25 p-1 rounded">
              <button
                type="button"
                onClick={() => { setMode("login"); setErrorMessage(""); }}
                className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded transition-all cursor-pointer ${
                  mode === "login" 
                    ? "bg-[#0A1428] border border-white/15 text-[#FBBF24]" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Sign In to Account
              </button>
              <button
                type="button"
                onClick={() => { setMode("register"); setErrorMessage(""); }}
                className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded transition-all cursor-pointer ${
                  mode === "register" 
                    ? "bg-[#0A1428] border border-white/15 text-[#FBBF24]" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Register New Fleet
              </button>
            </div>

            {/* LOGIN WINDOW */}
            {mode === "login" ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-3">// ENTER ENTERPRISE COORDINATES</h4>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-350 block mb-1">Email Coordinates</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        required
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        placeholder="dispatcher@agency.com"
                        className="w-full pl-9 pr-3 py-2 bg-black/45 border border-white/10 rounded text-xs text-white focus:outline-none focus:border-[#FBBF24]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-350 block mb-1">Secure Passkey</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input
                        type="password"
                        required
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3 py-2 bg-black/45 border border-white/10 rounded text-xs text-white focus:outline-none focus:border-[#FBBF24]"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-between items-center bg-black/10 -mx-6 -mb-6 p-6 mt-6 border-t border-white/5 select-none">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">
                    Default password is <strong className="text-[#FBBF24]">password</strong> inside test bay.
                  </span>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-[#FBBF24] text-[#0A1428] hover:bg-[#FBBF24]/90 rounded text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Credentials</span>
                        <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* REGISTRATION WINDOW */
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-3">// ACCOUNT ENROLLMENT SPECIFICATION</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-350 block mb-1">Company Registered Name *</label>
                    <div className="relative">
                      <Building className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={registerForm.companyName}
                        onChange={(e) => setRegisterForm({ ...registerForm, companyName: e.target.value })}
                        placeholder="e.g. Queens Fast Line"
                        className="w-full pl-9 pr-3 py-2 bg-black/45 border border-white/10 rounded text-xs text-white focus:outline-none focus:border-[#FBBF24] uppercase font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-350 block mb-1">Primary Representative *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={registerForm.name}
                        onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                        placeholder="e.g. Arthur Pendelton"
                        className="w-full pl-9 pr-3 py-2 bg-black/45 border border-white/10 rounded text-xs text-white focus:outline-none focus:border-[#FBBF24] font-bold"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-350 block mb-1">Dispatch Phone Mobile *</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input
                        type="tel"
                        required
                        value={registerForm.phone}
                        onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                        placeholder="(718) 555-0144"
                        className="w-full pl-9 pr-3 py-2 bg-black/45 border border-white/10 rounded text-xs text-white focus:outline-none focus:border-[#FBBF24]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-350 block mb-1">Email Credentials (Username) *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        required
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                        placeholder="art@queensfastline.com"
                        className="w-full pl-9 pr-3 py-2 bg-black/45 border border-white/10 rounded text-xs text-white focus:outline-none focus:border-[#FBBF24]"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-350 block mb-1">Authorized Profile Password *</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input
                        type="password"
                        required
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3 py-2 bg-black/45 border border-white/10 rounded text-xs text-white focus:outline-none focus:border-[#FBBF24]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-350 block mb-1">Default Dispatch Depot Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        value={registerForm.address}
                        onChange={(e) => setRegisterForm({ ...registerForm, address: e.target.value })}
                        placeholder="e.g. 102-14 Liberty Ave, Ozone Park, NY"
                        className="w-full pl-9 pr-3 py-2 bg-black/45 border border-white/10 rounded text-xs text-white focus:outline-none focus:border-[#FBBF24]"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end bg-black/10 -mx-6 -mb-6 p-6 mt-6 border-t border-white/5 select-none">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3.5 bg-[#FBBF24] text-[#0A1428] hover:bg-[#FBBF24]/90 rounded text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Enrolling...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Registration</span>
                        <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          /* AUTHENTICATED: CUSTOMER INNER PORTAL */
          <div className="flex-1 flex flex-col min-h-[480px] max-h-[82vh]">
            {/* Nav Tab Options */}
            <div className="px-6 bg-[#050B16] border-b border-white/10 flex justify-between items-center select-none shrink-0 overflow-x-auto scrollbar-none">
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => { setActiveTab("tracking"); setIsEditingProfile(false); }}
                  className={`py-3.5 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                    activeTab === "tracking" 
                      ? "text-[#FBBF24] border-[#FBBF24]" 
                      : "text-slate-400 border-transparent hover:text-white"
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Real-Time Tracking ({customerOrders.length + customerAppointments.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveTab("orders"); setIsEditingProfile(false); }}
                  className={`py-3.5 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                    activeTab === "orders" 
                      ? "text-[#FBBF24] border-[#FBBF24]" 
                      : "text-slate-400 border-transparent hover:text-white"
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Ledger History ({customerOrders.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveTab("profile"); startEditingProfile(currentCustomer); }}
                  className={`py-3.5 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                    activeTab === "profile" 
                      ? "text-[#FBBF24] border-[#FBBF24]" 
                      : "text-slate-400 border-transparent hover:text-white"
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Company Profile</span>
                </button>
              </div>

              <button
                onClick={logoutCustomer}
                className="px-3 py-1.5 ml-4 rounded bg-red-950/20 hover:bg-red-900/30 border border-red-900/30 text-red-500 hover:text-red-400 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>

            {/* TAB CONTENT */}
            <div className="p-6 flex-1 overflow-y-auto">
              {activeTab === "tracking" && (() => {
                const PART_STATUS_STEPS = [
                  "Pending Desk Review",
                  "Assembling at Depot",
                  "In-Transit to Queens Bay",
                  "Ready for Pickup",
                  "Dispatched & Completed"
                ];

                const SERVICE_STATUS_STEPS = [
                  "Scheduling",
                  "Diagnosing",
                  "Parts Sourcing",
                  "Bay Servicing",
                  "Ready for Pickup",
                  "Archived & Dispatched"
                ];

                return (
                  <div className="space-y-4">
                    {/* Top Notification banner */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 p-2 px-3.5 bg-yellow-950/20 border border-yellow-900/30 rounded text-[9px] text-[#FBBF24] font-mono leading-none select-none">
                      <span className="flex items-center gap-1.5 animate-pulse uppercase font-black tracking-widest">
                        <Activity className="w-3 h-3 animate-spin" />
                        <span>// ESTABLISHING REAL-TIME INTEL DATALINK</span>
                      </span>
                      <span className="text-[8px] text-slate-500 uppercase font-bold">
                        ACTIVE SECURE SOCKET FEED
                      </span>
                    </div>

                    {customerOrders.length === 0 && customerAppointments.length === 0 ? (
                      <div className="py-14 text-center rounded bg-black/20 border border-white/5 select-none space-y-4">
                        <Compass className="w-9 h-9 text-slate-500 mx-auto animate-pulse" />
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">No Active Shipments or Appointments</h4>
                          <p className="text-[10px] text-slate-500 mt-1 max-w-[280px] mx-auto leading-relaxed uppercase font-bold text-center">
                            There is nothing currently queued in the dispatcher's bay. Book a Service Appointment or checkout from the Parts Catalog to launch tracking!
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 text-left">
                        {/* SIDEBAR: ACTIVE TRACKERS */}
                        <div className="md:col-span-4 space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                          <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest block mb-1">
                            // SELECT DISPATCH STREAM
                          </span>
                          
                          {/* Render Parts Orders list */}
                          {customerOrders.map((ord) => {
                            const isSelected = selectedTrackId === ord.id && selectedTrackType === "order";
                            return (
                              <button
                                key={ord.id}
                                onClick={() => { setSelectedTrackId(ord.id); setSelectedTrackType("order"); }}
                                className={`w-full text-left p-3 rounded border text-xs font-bold transition-all flex flex-col gap-1 cursor-pointer focus:outline-none ${
                                  isSelected
                                    ? "bg-[#FBBF24]/10 border-[#FBBF24] text-white"
                                    : "bg-black/20 border-white/5 text-slate-400 hover:border-white/10 hover:text-white"
                                }`}
                              >
                                <div className="flex justify-between items-center w-full">
                                  <span className={`text-[9px] uppercase font-black px-1 rounded ${isSelected ? "bg-[#FBBF24]/20 text-[#FBBF24]" : "bg-slate-900 text-slate-500"}`}>
                                    PARTS REQ
                                  </span>
                                  <span className="font-mono text-[9px] text-slate-500">{ord.date}</span>
                                </div>
                                <span className="font-mono font-black text-[#FBBF24] text-xs leading-none mt-1">{ord.id}</span>
                                <span className="text-[10px] truncate mt-0.5 leading-normal opacity-85">{ord.status}</span>
                              </button>
                            );
                          })}

                          {/* Render Service Appointments list */}
                          {customerAppointments.map((app) => {
                            const isSelected = selectedTrackId === app.id && selectedTrackType === "service";
                            return (
                              <button
                                key={app.id}
                                onClick={() => { setSelectedTrackId(app.id); setSelectedTrackType("service"); }}
                                className={`w-full text-left p-3 rounded border text-xs font-bold transition-all flex flex-col gap-1 cursor-pointer focus:outline-none ${
                                  isSelected
                                    ? "bg-[#FBBF24]/10 border-[#FBBF24] text-white"
                                    : "bg-black/20 border-white/5 text-slate-400 hover:border-white/10 hover:text-white"
                                }`}
                              >
                                <div className="flex justify-between items-center w-full">
                                  <span className={`text-[9px] uppercase font-black px-1 rounded ${isSelected ? "bg-amber-500/20 text-amber-400" : "bg-slate-900 text-slate-505"}`}>
                                    SERVICE APT
                                  </span>
                                  <span className="font-mono text-[9px] text-slate-405">{app.date}</span>
                                </div>
                                <span className="font-mono font-black text-amber-400 text-xs leading-none mt-1">{app.id}</span>
                                <span className="text-[10px] truncate mt-0.5 leading-normal opacity-85">{app.status}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* MAIN MONITOR: TRACKER DETAILS */}
                        <div className="md:col-span-8 bg-black/30 border border-white/10 rounded-lg p-4 space-y-4 max-h-[460px] overflow-y-auto">
                          {selectedTrackType === "order" && (() => {
                            const order = customerOrders.find(o => o.id === selectedTrackId);
                            if (!order) return <p className="text-[11px] text-slate-450 font-mono uppercase">Initializing datalink stream...</p>;
                            
                            const activeStep = PART_STATUS_STEPS.indexOf(order.status);
                            const pct = activeStep === 0 ? 15 : activeStep === 1 ? 35 : activeStep === 2 ? 65 : activeStep === 3 ? 85 : 100;
                            
                            return (
                              <div className="space-y-4">
                                {/* Header metrics card */}
                                <div className="flex justify-between items-start border-b border-white/5 pb-3">
                                  <div>
                                    <h3 className="text-xs font-black uppercase text-white font-mono tracking-wide flex items-center gap-1.5">
                                      <ShoppingBag className="w-3.5 h-3.5 text-[#FBBF24]" />
                                      <span>PARTS REQUISITION MONITOR</span>
                                    </h3>
                                    <p className="font-mono text-xs text-[#FBBF24] font-black tracking-wider mt-1">{order.id}</p>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest block">// TRANSACTION VALUE</span>
                                    <span className="font-mono text-xs font-black text-white">${order.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                  </div>
                                </div>

                                {/* Progress bar info */}
                                <div className="space-y-1 rounded bg-[#050B16] p-2.5 border border-white/5 select-none text-left">
                                  <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-400 leading-none">
                                    <span>DATALINK PIPELINE FEED</span>
                                    <span className="text-[#FBBF24] font-mono font-black">{pct}% CONNECTED</span>
                                  </div>
                                  <div className="w-full bg-slate-900 h-2 rounded border border-white/5 overflow-hidden">
                                    <div className="bg-[#FBBF24] h-full transition-all duration-1000" style={{ width: `${pct}%` }} />
                                  </div>
                                </div>

                                {/* Vertical Stepper timeline */}
                                <div className="space-y-1.5 pl-2 select-none text-left">
                                  {PART_STATUS_STEPS.map((step, idx) => {
                                    const isDone = idx < activeStep;
                                    const isCurrent = idx === activeStep;
                                    const isFuture = idx > activeStep;
                                    
                                    const stepIcon = 
                                      idx === 0 ? <FileText className="w-3 h-3" /> :
                                      idx === 1 ? <Wrench className="w-3 h-3" /> :
                                      idx === 2 ? <Truck className="w-3 h-3 text-[#0a1428]" /> :
                                      idx === 3 ? <CheckCircle className="w-3 h-3" /> :
                                      <Lock className="w-3 h-3" />;
                                      
                                    return (
                                      <div key={idx} className="flex gap-3.5 relative">
                                        {idx < PART_STATUS_STEPS.length - 1 && (
                                          <div className={`absolute left-2.5 top-5 bottom-0 w-0.5 -ml-[1px] ${isDone ? "bg-[#FBBF24]" : "bg-white/10"}`} />
                                        )}
                                        <div className={`w-5.5 h-5.5 rounded-full flex items-center justify-center shrink-0 border relative z-10 transition-colors ${
                                          isDone ? "bg-[#FBBF24] text-[#0A1428] border-[#FBBF24]" :
                                          isCurrent ? "bg-[#050B16] text-[#FBBF24] border-[#FBBF24] animate-pulse" :
                                          "bg-[#050B16] text-slate-500 border-white/15"
                                        }`}>
                                          {stepIcon}
                                        </div>
                                        <div className="pb-3.5 pt-0.5 text-left">
                                          <h4 className={`text-[11px] font-black uppercase tracking-wider ${isFuture ? "text-slate-500" : isCurrent ? "text-[#FBBF24]" : "text-white"}`}>
                                            {step} {isCurrent && <span className="text-[8px] animate-pulse lowercase font-mono"> (active monitoring stage)</span>}
                                          </h4>
                                          <p className="text-[10px] text-slate-400 uppercase leading-relaxed mt-0.5 font-bold">
                                            {idx === 0 ? "Desk check counter verification completed successfully." :
                                             idx === 1 ? "OEM logistics coordinator assembly on storage racks." :
                                             idx === 2 ? "Wagon courier loading active. Porting down Rockaway Blvd corridor." :
                                             idx === 3 ? "Package logged in counters and bays. Ready for counter signature." :
                                             "Recipient verified lock. Requisition complete."}
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Interactive Live Monitor Feed */}
                                <div className="bg-black/50 border border-white/10 rounded p-3 font-mono text-[10px] select-all space-y-1 text-[#FBBF24] leading-relaxed text-left">
                                  <p className="text-slate-500 uppercase font-black tracking-wider text-[8px] mb-1.5 select-none">// REAL-TIME DIAGNOSTIC MATRIX FEED</p>
                                  <p className="opacity-90">[{order.date}] REQUISITION STREAM CONNECTED.</p>
                                  <p className={activeStep >= 1 ? "opacity-90" : "opacity-35"}>[{order.date}] LOGISTICS: ASSEMBLY SEQUENCE COMPLETE FOR DEPOT HARNESS.</p>
                                  <p className={activeStep >= 2 ? "opacity-90 font-black animate-pulse" : "opacity-35"}>[{order.date}] DISPATCH: WAGON COURIER OUTWARD TRANSIT ACTIVE.</p>
                                  <p className={activeStep >= 3 ? "opacity-90" : "opacity-35"}>[{order.date}] TERMINAL STATUS: ARRIVED AT COUNTER AND BAYS.</p>
                                  <p className={activeStep >= 4 ? "opacity-90" : "opacity-35"}>[{order.date}] TRANSACTION: SUCCESS SECURE COURIER CLOSED.</p>
                                </div>
                              </div>
                            );
                          })()}

                          {selectedTrackType === "service" && (() => {
                            const app = customerAppointments.find(a => a.id === selectedTrackId);
                            if (!app) return <p className="text-[11px] text-slate-450 font-mono uppercase">Initializing service datalink...</p>;
                            
                            const activeStep = SERVICE_STATUS_STEPS.indexOf(app.status);
                            const pct = activeStep === 0 ? 10 : activeStep === 1 ? 30 : activeStep === 2 ? 50 : activeStep === 3 ? 75 : activeStep === 4 ? 90 : 100;
                            
                            return (
                              <div className="space-y-4">
                                {/* Header metrics card */}
                                <div className="flex justify-between items-start border-b border-white/5 pb-3">
                                  <div>
                                    <h3 className="text-xs font-black uppercase text-white font-mono tracking-wide flex items-center gap-1.5">
                                      <Wrench className="w-3.5 h-3.5 text-amber-405" />
                                      <span>FLEET REBUILD BAY STATUS</span>
                                    </h3>
                                    <p className="font-mono text-xs text-amber-400 font-black tracking-wider mt-1">{app.id}</p>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest block">// APP ESTIMATE</span>
                                    <span className="font-mono text-xs font-bold text-[#FBBF24]">${app.estimatedPrice.toLocaleString()}</span>
                                  </div>
                                </div>

                                {/* Progress bar info */}
                                <div className="space-y-1 rounded bg-[#050B16] p-2.5 border border-white/5 select-none text-left">
                                  <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-400 leading-none">
                                    <span>BAY SERVICE CONSOLE FEED</span>
                                    <span className="text-amber-400 font-mono font-black">{pct}% DIAGNOSTICS</span>
                                  </div>
                                  <div className="w-full bg-slate-900 h-2 rounded border border-white/5 overflow-hidden">
                                    <div className="bg-amber-450 h-full transition-all duration-1000" style={{ width: `${pct}%` }} />
                                  </div>
                                </div>

                                {/* Tech & Bay Specs */}
                                <div className="grid grid-cols-2 gap-3.5 bg-black/25 p-3 rounded text-[11px] leading-relaxed uppercase border border-white/5 font-sans font-bold text-left">
                                  <div>
                                    <span className="text-[9px] text-slate-500 block font-black mb-0.5 tracking-wider">// LEAD REBUILD HEAVY-DUTY TECHNICIAN</span>
                                    <span className="text-white">{app.assignedTechnician || "Marc Davis (Senior Coordinator)"}</span>
                                  </div>
                                  <div>
                                    <span className="text-[9px] text-slate-500 block font-black mb-0.5 tracking-wider">// ASSIGNED BAY POSITION</span>
                                    <span className="text-amber-450 font-mono font-black">{app.bayNumber || "Bay #4 (Richmond Hill Hub)"}</span>
                                  </div>
                                </div>

                                {/* Vertical Stepper timeline */}
                                <div className="space-y-1.5 pl-2 select-none text-left">
                                  {SERVICE_STATUS_STEPS.map((step, idx) => {
                                    const isDone = idx < activeStep;
                                    const isCurrent = idx === activeStep;
                                    const isFuture = idx > activeStep;
                                    
                                    const stepIcon = 
                                      idx === 0 ? <Calendar className="w-3 h-3" /> :
                                      idx === 1 ? <Activity className="w-3 h-3" /> :
                                      idx === 2 ? <ShoppingBag className="w-3 h-3" /> :
                                      idx === 3 ? <Wrench className="w-3 h-3 text-[#0a1428]" /> :
                                      idx === 4 ? <CheckCircle className="w-3 h-3" /> :
                                      <Lock className="w-3 h-3" />;
                                      
                                    return (
                                      <div key={idx} className="flex gap-3.5 relative">
                                        {idx < SERVICE_STATUS_STEPS.length - 1 && (
                                          <div className={`absolute left-2.5 top-5 bottom-0 w-0.5 -ml-[1px] ${isDone ? "bg-amber-400" : "bg-white/10"}`} />
                                        )}
                                        <div className={`w-5.5 h-5.5 rounded-full flex items-center justify-center shrink-0 border relative z-10 transition-colors ${
                                          isDone ? "bg-amber-400 text-[#0A1428] border-amber-500" :
                                          isCurrent ? "bg-[#050B16] text-amber-400 border-amber-400 animate-pulse" :
                                          "bg-[#050B16] text-slate-500 border-white/15"
                                        }`}>
                                          {stepIcon}
                                        </div>
                                        <div className="pb-3.5 pt-0.5 text-left">
                                          <h4 className={`text-[11px] font-black uppercase tracking-wider ${isFuture ? "text-slate-500" : isCurrent ? "text-amber-400" : "text-white"}`}>
                                            {step} {isCurrent && <span className="text-[8px] animate-pulse lowercase font-mono"> (bay working stage)</span>}
                                          </h4>
                                          <p className="text-[10px] text-slate-400 uppercase leading-relaxed mt-0.5 font-bold">
                                            {idx === 0 ? "Scheduler desk locks and validates technician dispatch slot." :
                                             idx === 1 ? "Wired digital scanners connected to chassis framework modules." :
                                             idx === 2 ? "Parts counter sourcing OEM valves from depot cabinets." :
                                             idx === 3 ? "Heavy-duty wrench and rebuild active under hydraulic lifts." :
                                             idx === 4 ? "Diagnostics check cleared. Quality team signs bay release forms." :
                                             "Rebuild archived. Carrier departed from lot premises."}
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Technician Action Log Notes */}
                                <div className="bg-amber-950/20 border border-amber-500/20 rounded p-3 select-text text-[11.5px] leading-relaxed text-amber-200 uppercase font-sans font-extrabold flex gap-2.5 items-start text-left">
                                  <AlertTriangle className="w-4.5 h-4.5 text-amber-400 shrink-0 select-none" />
                                  <div>
                                    <span className="text-[9px] text-amber-400 block font-black leading-none mb-1 select-none">LEAD TECHNICIAN STATUS COMMENT:</span>
                                    <p>{app.statusNotes || "Vehicle loaded into bay diagnostics position. Awaiting initial diagnostic scanner scan."}</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {activeTab === "orders" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center select-none">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">// REGISTERED ACCOUNT INVOICE LEDGER</span>
                    <span className="text-[9px] text-[#FBBF24] font-black uppercase font-mono bg-amber-950/20 px-2 py-0.5 border border-amber-950 rounded">
                      Secured SSL Bay
                    </span>
                  </div>

                  {customerOrders.length > 0 ? (
                    <div className="space-y-4">
                      {customerOrders.map((order) => (
                        <div 
                          key={order.id}
                          className="bg-black/30 border border-white/5 rounded-lg p-4 space-y-3.5 hover:border-white/10 transition-colors"
                        >
                          {/* Order header row */}
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3.5 border-b border-white/5">
                            <div>
                              <div className="flex items-center gap-2.5">
                                <span className="text-xs font-black text-[#FBBF24] font-mono tracking-wide">{order.id}</span>
                                <span className="text-[9px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-400 font-mono">{order.date}</span>
                              </div>
                              <span className="text-[9px] text-slate-400 block mt-1 uppercase font-bold leading-normal truncate">
                                Drop-off destination: {order.address}
                              </span>
                            </div>

                            <span className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider ${
                              order.status === "Dispatched & Completed" 
                                ? "bg-emerald-950/50 text-emerald-405 border border-emerald-900/40"
                                : order.status === "Ready for Pickup"
                                ? "bg-amber-950/50 text-[#FBBF24] border border-amber-900/40"
                                : "bg-blue-950/50 text-blue-300 border border-blue-900/40"
                            }`}>
                              🔹 {order.status}
                            </span>
                          </div>

                          {/* Order item rows / totals split */}
                          <div className="grid sm:grid-cols-12 gap-3.5 items-center">
                            <div className="sm:col-span-8 space-y-1.5">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-[11px] bg-black/15 p-2 rounded">
                                  <span className="text-slate-300 font-bold uppercase truncate max-w-[80%]">
                                    {item.name} <strong className="text-[#FBBF24] font-mono text-xs pl-1">x{item.quantity}</strong>
                                  </span>
                                  <span className="text-white font-mono font-bold font-mono">${(item.price * item.quantity).toLocaleString()}</span>
                                </div>
                              ))}
                            </div>

                            <div className="sm:col-span-4 bg-[#050B16] p-3 rounded border border-white/5 text-right font-sans font-bold leading-relaxed text-[11px] space-y-1">
                              <span className="text-[9px] text-slate-500 font-black tracking-widest block uppercase">// FINANCIAL SETTLEMENT</span>
                              <p className="text-slate-400 uppercase">Subtotal: <strong className="text-white font-mono">${order.subtotal.toLocaleString()}</strong></p>
                              <p className="text-slate-400 uppercase">NYC Sales Tax: <strong className="text-white font-mono">${order.tax.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong></p>
                              <div className="border-t border-white/5 my-1.5 pt-1 flex justify-between font-black text-xs text-[#FBBF24]">
                                <span className="uppercase font-extrabold pb-0.5">Grand Total:</span>
                                <span className="font-mono">${order.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-14 text-center rounded bg-black/20 border border-white/5 select-none space-y-4">
                      <ShoppingBag className="w-9 h-9 text-slate-500 mx-auto" />
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Inventory Ledger is Empty</h4>
                        <p className="text-[10px] text-slate-500 mt-1 max-w-[260px] mx-auto leading-relaxed uppercase font-bold text-center">
                          You have not filed any checkout receipts yet. Open the Parts Catalog, load your cart, and file a secure checkout to purchase directly!
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB CONTENT: PROFILE DISPLAY & EDIT */}
              {activeTab === "profile" && (
                <div className="space-y-4">
                  {!isEditingProfile ? (
                    <div className="bg-black/35 border border-white/10 rounded-lg p-5 space-y-4 font-bold uppercase text-xs">
                      <div className="flex justify-between items-center pb-3 border-b border-white/5">
                        <span className="text-[10px] font-black uppercase text-[#FBBF24] tracking-widest">// DEPOSIT BAY INFO</span>
                        <button
                          onClick={() => startEditingProfile(currentCustomer)}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded text-[10px] font-black uppercase tracking-wider text-[#FBBF24] border border-white/10 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Modify Details</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-[9px] text-slate-500 font-black tracking-wider block">Company Fleet Name</p>
                          <span className="text-sm font-black text-white">{currentCustomer.companyName}</span>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-500 font-black tracking-wider block">Authorized Representative</p>
                          <span className="text-xs font-extrabold text-slate-300">{currentCustomer.name}</span>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-500 font-black tracking-wider block">Registered Email Address</p>
                          <span className="text-xs font-extrabold text-slate-300 normal-case">{currentCustomer.email}</span>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-500 font-black tracking-wider block">Dispatch Call-Back Mobile</p>
                          <span className="text-xs font-black text-[#FBBF24]">{currentCustomer.phone}</span>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-[9px] text-slate-500 font-black tracking-wider block">Default Dropoff Coordinates</p>
                          <span className="text-xs font-extrabold text-slate-300">
                            {currentCustomer.address || "None specified. Will collect at Richmond Hill Depot counter."}
                          </span>
                        </div>
                      </div>

                      <div className="pt-3.5 border-t border-white/5 flex justify-between items-center text-[10px] text-slate-500 font-medium">
                        <span>Account Created on: {currentCustomer.dateCreated}</span>
                        <span>Official Richmond Hill Partner</span>
                      </div>
                    </div>
                  ) : (
                    /* EDITING VIEW */
                    <form onSubmit={handleProfileSave} className="space-y-4">
                      <div className="bg-black/35 border border-white/10 rounded-lg p-5 space-y-4">
                        <div className="pb-2 border-b border-white/5">
                          <span className="text-[10px] font-black uppercase text-[#FBBF24] tracking-widest block">// MODIFY ACCOUNT INFORMATION</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-350 block mb-1">Company Registered Name</label>
                            <input
                              type="text"
                              required
                              value={profileForm.companyName}
                              onChange={(e) => setProfileForm({ ...profileForm, companyName: e.target.value })}
                              className="w-full px-3 py-2 bg-[#050B16] border border-white/10 rounded text-xs text-white focus:outline-none focus:border-[#FBBF24] uppercase font-bold"
                            />
                          </div>

                          <div>
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-350 block mb-1">Primary Representative</label>
                            <input
                              type="text"
                              required
                              value={profileForm.name}
                              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                              className="w-full px-3 py-2 bg-[#050B16] border border-white/10 rounded text-xs text-white focus:outline-none focus:border-[#FBBF24] font-bold"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-350 block mb-1">Dispatch Callback Number</label>
                            <input
                              type="tel"
                              required
                              value={profileForm.phone}
                              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                              className="w-full px-3 py-2 bg-[#050B16] border border-white/10 rounded text-xs text-white focus:outline-none focus:border-[#FBBF24]"
                            />
                          </div>

                          <div>
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-350 block mb-1">Email Credentials</label>
                            <input
                              type="email"
                              required
                              value={profileForm.email}
                              onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                              className="w-full px-3 py-2 bg-[#050B16] border border-[#050B16] opacity-75 rounded text-xs text-slate-400 cursor-not-allowed"
                              disabled
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-350 block mb-1">Default Dispatch Depot Address</label>
                          <input
                            type="text"
                            value={profileForm.address}
                            onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                            className="w-full px-3 py-2 bg-[#050B16] border border-white/10 rounded text-xs text-white focus:outline-none focus:border-[#FBBF24]"
                          />
                        </div>

                        <div className="flex justify-end gap-2.5 pt-3 select-none">
                          <button
                            type="button"
                            onClick={() => setIsEditingProfile(false)}
                            className="px-4 py-2 bg-transparent text-slate-400 hover:text-white rounded text-xs font-black uppercase tracking-wide cursor-pointer"
                          >
                            Cancel
                          </button>
                          
                          <button
                            type="submit"
                            className="px-5 py-2.5 bg-[#FBBF24] text-[#0A1428] rounded text-xs font-black uppercase tracking-widest flex items-center gap-1.5 cursor-pointer shadow-md"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Save Changes</span>
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer info lock */}
        <div className="px-6 py-4.5 bg-[#050B16] border-t border-white/10 text-center select-none flex flex-col sm:flex-row justify-between items-center gap-2 shrink-0">
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
            Secured Customer Channel. Diehl's Truck World Inc.
          </p>
          <span className="text-[9px] text-[#FBBF24] font-black uppercase tracking-widest font-mono">
            ★ RICHMOND HILL'S TRUCK LEADER ★
          </span>
        </div>

      </div>
    </div>
  );
}
