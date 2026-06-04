/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { CommercialTruck, PartItem, Order, DealerSettings, Lead } from "../types";
import { X, Plus, Trash2, Edit2, ShieldAlert, FileText, CheckCircle, Save, Settings, Package, Truck, Phone, BarChart2, RefreshCw, Upload, Download, Lock, LogOut, Wrench, Users } from "lucide-react";
import { motion } from "motion/react";
import * as XLSX from "xlsx";

interface AdminDashboardProps {
  onClose: () => void;
}

export default function AdminDashboard({ onClose }: AdminDashboardProps) {
  const {
    trucks,
    parts,
    services,
    testimonials,
    orders,
    settings,
    serviceAppointments,
    leads,
    careers,
    addTruck,
    updateTruck,
    deleteTruck,
    addPart,
    updatePart,
    deletePart,
    updateSettings,
    updateOrderStatus,
    deleteOrder,
    updateServiceAppointmentStatus,
    resetToFactoryDefaults,
    addLead,
    updateLeadStatus,
    updateLeadNotes,
    deleteLead,
    deleteCareerApplicant,
  } = useApp();

  const [activeTab, setActiveTab] = useState<"trucks" | "parts" | "settings" | "orders" | "stats" | "services" | "leads" | "careers">("trucks");
  const [leadSearchQuery, setLeadSearchQuery] = useState("");
  const careerApplicants = careers;

  const deleteApplicant = (id: string) => {
    deleteCareerApplicant(id);
    triggerNotification("Applicant purged from directory.");
  };

  // Admin security states
  const [isAdminAuthorized, setIsAdminAuthorized] = useState(() => {
    return localStorage.getItem("dtw_admin_authorized") === "true";
  });
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [adminLoginError, setAdminLoginError] = useState("");
  const [adminPassword, setAdminPassword] = useState(() => {
    return localStorage.getItem("dtw_admin_password") || "admin123";
  });

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginError("");
    if (adminPasswordInput === adminPassword) {
      setIsAdminAuthorized(true);
      localStorage.setItem("dtw_admin_authorized", "true");
    } else {
      setAdminLoginError("Access Denied: Invalid Security Key Passphrase.");
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuthorized(false);
    localStorage.removeItem("dtw_admin_authorized");
  };

  // Excel Importer
  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>, type: "trucks" | "parts") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const bstr = event.target?.result;
        const workbook = XLSX.read(bstr, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(worksheet) as any[];

        if (!rawData || rawData.length === 0) {
          triggerNotification("Excel sheet is empty or has invalid columns.");
          return;
        }

        let importCount = 0;
        if (type === "trucks") {
          rawData.forEach((row) => {
            const name = row.name || row.Name || row.title || row.Title;
            if (!name) return;

            addTruck({
              name,
              category: (row.category || row.Category || "Box Truck") as any,
              condition: (row.condition || row.Condition || "New") as any,
              year: Number(row.year || row.Year || 2026),
              make: row.make || row.Make || "Freightliner",
              model: row.model || row.Model || "M2",
              engine: row.engine || row.Engine || "Detroit DD5",
              transmission: row.transmission || row.Transmission || "Allison Auto",
              mileage: row.condition === "Pre-Owned" ? Number(row.mileage || row.Mileage || 0) : undefined,
              price: Number(row.price || row.Price || 0),
              specs: row.specs ? String(row.specs).split(";").map((s: string) => s.trim()).filter(Boolean) : ["Factory Spec", "DOT Certified"],
              imageUrl: row.imageUrl || row.ImageUrl || "/src/assets/images/diehls_hero_truck_1780493334702.png"
            });
            importCount++;
          });
          triggerNotification(`Successfully bulk-imported ${importCount} Commercial Chassis listings!`);
        } else {
          rawData.forEach((row) => {
            const name = row.name || row.Name || row.title || row.Title;
            if (!name) return;
            const sku = row.sku || row.Sku || row.SKU || `SKU-${Math.floor(100000 + Math.random() * 900000)}`;

            addPart({
              sku,
              name,
              category: (row.category || row.Category || "Engine & Drivetrain") as any,
              price: Number(row.price || row.Price || 0),
              brand: row.brand || row.Brand || "Genuine OEM",
              stock: Number(row.stock || row.Stock || 10),
              compatibleModels: row.compatibleModels ? String(row.compatibleModels).split(",").map((s: string) => s.trim()).filter(Boolean) : ["Western Star 4700", "Freightliner M2"]
            });
            importCount++;
          });
          triggerNotification(`Successfully bulk-imported ${importCount} components into live SKUs!`);
        }
      } catch (err) {
        console.error(err);
        triggerNotification("Excel parser error: Please check files format.");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const downloadExcelTemplate = (type: "trucks" | "parts") => {
    let headers = [];
    let filename = "";
    if (type === "trucks") {
      headers = [
        ["name", "category", "condition", "year", "make", "model", "engine", "transmission", "mileage", "price", "specs", "imageUrl"],
        ["Western Star 4700 Box Truck", "Box Truck", "New", 2026, "Western Star", "4700", "Detroit DD13", "Allison 4000 RDS", 0, 149500, "DOT Certified;Air Brakes;Genuine Detroit Engine;26ft Supreme Box", "/src/assets/images/diehls_hero_truck_1780493334702.png"]
      ];
      filename = "diehls_trucks_import_template.xlsx";
    } else {
      headers = [
        ["sku", "name", "category", "price", "brand", "stock", "compatibleModels"],
        ["DTW-EAK-90409", "Cylinder Head Gasket Heavy Duty", "Engine & Drivetrain", 249.99, "Detroit Diesel", 12, "Freightliner Cascadia, Western Star 4700, Isuzu NPR"]
      ];
      filename = "diehls_parts_import_template.xlsx";
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(headers);
    XLSX.utils.book_append_sheet(wb, ws, "Standard Template");
    XLSX.writeFile(wb, filename);
  };
  
  // Notification state
  const [notification, setNotification] = useState<string | null>(null);
  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Editing states
  const [editingTruck, setEditingTruck] = useState<CommercialTruck | null>(null);
  const [editingPart, setEditingPart] = useState<PartItem | null>(null);

  // Drag and drop states for truck images
  const [isDragOver, setIsDragOver] = useState(false);

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      triggerNotification("Error: Selected file is not an image.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        setTruckForm((prev) => ({ ...prev, imageUrl: dataUrl }));
        triggerNotification("Image asset processed and cached.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleImageFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageFile(file);
    }
  };

  // New item form states - Trucks
  const [truckForm, setTruckForm] = useState({
    name: "",
    category: "Box Truck" as CommercialTruck["category"],
    condition: "New" as CommercialTruck["condition"],
    year: 2026,
    make: "",
    model: "",
    engine: "",
    transmission: "",
    mileage: 0,
    price: 0,
    specsString: "",
    imageUrl: "/src/assets/images/diehls_hero_truck_1780493334702.png"
  });

  // New item form states - Parts
  const [partForm, setPartForm] = useState({
    sku: "",
    name: "",
    category: "Engine & Drivetrain" as PartItem["category"],
    price: 0,
    brand: "",
    stock: 10,
    compatString: ""
  });

  // Settings form states
  const [settingsForm, setSettingsForm] = useState<DealerSettings>({ ...settings });

  // Sync settings when modified externally
  React.useEffect(() => {
    setSettingsForm({ ...settings });
  }, [settings]);

  // Handle Truck Submit (Create or Update)
  const handleTruckSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const specs = truckForm.specsString.split("\n").map(s => s.trim()).filter(Boolean);
    
    if (editingTruck) {
      updateTruck({
        ...editingTruck,
        name: truckForm.name,
        category: truckForm.category,
        condition: truckForm.condition,
        year: Number(truckForm.year),
        make: truckForm.make,
        model: truckForm.model,
        engine: truckForm.engine,
        transmission: truckForm.transmission,
        mileage: truckForm.condition === "Pre-Owned" ? Number(truckForm.mileage) : undefined,
        price: Number(truckForm.price),
        specs,
        imageUrl: truckForm.imageUrl
      });
      triggerNotification("Chassis specification updated successfully!");
      setEditingTruck(null);
    } else {
      addTruck({
        name: truckForm.name,
        category: truckForm.category,
        condition: truckForm.condition,
        year: Number(truckForm.year),
        make: truckForm.make,
        model: truckForm.model,
        engine: truckForm.engine,
        transmission: truckForm.transmission,
        mileage: truckForm.condition === "Pre-Owned" ? Number(truckForm.mileage) : undefined,
        price: Number(truckForm.price),
        specs,
        imageUrl: truckForm.imageUrl
      });
      triggerNotification("New vehicle listing deployed successfully!");
    }

    // Reset Form
    setTruckForm({
      name: "",
      category: "Box Truck",
      condition: "New",
      year: 2026,
      make: "",
      model: "",
      engine: "",
      transmission: "",
      mileage: 0,
      price: 0,
      specsString: "",
      imageUrl: "/src/assets/images/diehls_hero_truck_1780493334702.png"
    });
  };

  // Start Editing Truck
  const startEditTruck = (t: CommercialTruck) => {
    setEditingTruck(t);
    setTruckForm({
      name: t.name,
      category: t.category,
      condition: t.condition,
      year: t.year,
      make: t.make,
      model: t.model,
      engine: t.engine,
      transmission: t.transmission,
      mileage: t.mileage || 0,
      price: t.price,
      specsString: t.specs.join("\n"),
      imageUrl: t.imageUrl
    });
  };

  // Cancel edit truck
  const cancelEditTruck = () => {
    setEditingTruck(null);
    setTruckForm({
      name: "",
      category: "Box Truck",
      condition: "New",
      year: 2026,
      make: "",
      model: "",
      engine: "",
      transmission: "",
      mileage: 0,
      price: 0,
      specsString: "",
      imageUrl: "/src/assets/images/diehls_hero_truck_1780493334702.png"
    });
  };

  // Handle Part Submit
  const handlePartSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const compatibleModels = partForm.compatString.split(",").map(c => c.trim()).filter(Boolean);

    if (editingPart) {
      updatePart({
        ...editingPart,
        sku: partForm.sku,
        name: partForm.name,
        category: partForm.category,
        price: Number(partForm.price),
        brand: partForm.brand,
        stock: Number(partForm.stock),
        compatibleModels
      });
      triggerNotification("Heavy-duty part configuration updated!");
      setEditingPart(null);
    } else {
      addPart({
        sku: partForm.sku,
        name: partForm.name,
        category: partForm.category,
        price: Number(partForm.price),
        brand: partForm.brand,
        stock: Number(partForm.stock),
        compatibleModels
      });
      triggerNotification("New parts index successfully registered!");
    }

    setPartForm({
      sku: "",
      name: "",
      category: "Engine & Drivetrain",
      price: 0,
      brand: "",
      stock: 10,
      compatString: ""
    });
  };

  const startEditPart = (p: PartItem) => {
    setEditingPart(p);
    setPartForm({
      sku: p.sku,
      name: p.name,
      category: p.category,
      price: p.price,
      brand: p.brand,
      stock: p.stock,
      compatString: p.compatibleModels.join(", ")
    });
  };

  const cancelEditPart = () => {
    setEditingPart(null);
    setPartForm({
      sku: "",
      name: "",
      category: "Engine & Drivetrain",
      price: 0,
      brand: "",
      stock: 10,
      compatString: ""
    });
  };

  // Handle Settings Save
  const handleSettingsSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(settingsForm);
    triggerNotification("Company address, hotline and operating hours saved!");
  };

  // Total sales helper
  const totalSales = orders
    .filter(o => o.paymentMethod !== "Quote Request")
    .reduce((sum, o) => sum + o.total, 0);

  const totalQuotes = orders
    .filter(o => o.paymentMethod === "Quote Request")
    .length;

  if (!isAdminAuthorized) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 font-sans select-text">
        <div className="relative w-full max-w-sm bg-[#0A1428] border border-white/10 rounded-lg shadow-2xl overflow-hidden text-slate-100 flex flex-col">
          <div className="absolute top-0 right-0 left-0 h-1 bg-[#FBBF24]" />
          
          <div className="px-6 py-5 border-b border-white/15 bg-[#050B16] flex justify-between items-center">
            <div>
              <span className="p-1 px-1.5 bg-[#FBBF24]/10 text-[#FBBF24] rounded-sm text-[8px] font-black tracking-widest font-mono">// ADMINISTRATIVE LOCK</span>
              <h3 className="text-sm font-extrabold uppercase mt-1">Enterprise Login Gate</h3>
            </div>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/5 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleAdminLogin} className="p-6 space-y-4">
            {adminLoginError && (
              <div className="p-3 bg-red-950/30 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-wide rounded">
                ⚠️ {adminLoginError}
              </div>
            )}

            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold leading-relaxed mb-4">
                This console holds sensitive commercial truck inventory, parts stock ledgers, settings override and stats counters. Please enter administrative passphrase.
              </p>

              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Passphrase Code Key *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-550" />
                <input
                  type="password"
                  required
                  autoFocus
                  placeholder="Password (default is admin123)"
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-black/45 border border-white/10 rounded text-xs text-white placeholder-slate-600 focus:outline-[#FBBF24]"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-between items-center border-t border-white/5 select-none">
              <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">
                Default: <strong className="text-[#FBBF24]">admin123</strong>
              </span>
              
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#FBBF24] text-[#0A1428] hover:bg-[#FBBF24]/95 rounded text-[10px] font-black uppercase tracking-widest cursor-pointer transition-colors"
              >
                Access Terminal
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 font-sans select-text">
      {/* Modal Wrapper */}
      <div className="relative w-full max-w-6xl h-[92vh] sm:h-[85vh] bg-[#0A1428] border border-white/10 rounded shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Banner Notification */}
        {notification && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-[#FBBF24] text-[#0A1428] font-black text-xs uppercase px-5 py-2.5 rounded shadow-lg animate-fade-in tracking-wider select-none flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-[#0A1428] stroke-[2.5]" />
            <span>{notification}</span>
          </div>
        )}

        {/* Console Header */}
        <div className="px-6 py-5 border-b border-white/10 bg-[#050B16] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 px-1.5 bg-[#FBBF24]/10 text-[#FBBF24] rounded-sm text-[9px] font-black tracking-widest font-mono">// SECURE COMMAND</span>
              <span className="text-[10px] text-emerald-400 font-black tracking-widest flex items-center gap-1">● DEPLOYED</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white uppercase italic tracking-wide mt-1 select-none">
              Diehl’s Enterprise Fleet Console
            </h2>
            <p className="text-xs text-slate-400 leading-none mt-1">
              Live adjustments to truck specifications, components stock, price registers, and payment schedules.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAdminLogout}
              className="px-3 py-2 bg-red-950/20 hover:bg-red-900/30 border border-red-900/40 text-red-400 hover:text-red-300 rounded text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer flex items-center gap-1.5 font-bold"
              id="admin-logout"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Lock Terminal</span>
            </button>
            
            <button
              onClick={onClose}
              className="p-1.5 rounded border border-white/10 bg-[#0A1428] hover:border-[#FBBF24] transition-all cursor-pointer group"
            >
              <X className="w-5 h-5 text-slate-400 group-hover:text-[#FBBF24]" />
            </button>
          </div>
        </div>

         {/* Tab Selection */}
        <div className="flex flex-wrap border-b border-white/5 bg-[#050B16] px-4 py-1 gap-1 select-none">
          {[
            { id: "trucks", label: "Commercial Rigs", icon: Truck },
            { id: "parts", label: "Parts Registry", icon: Package },
            { id: "settings", label: "Dealer Identity", icon: Settings },
            { id: "orders", label: "Requisitions Ledger", icon: FileText, count: orders.length },
            { id: "services", label: "Service Bookings", icon: Wrench, count: (serviceAppointments || []).length },
            { id: "leads", label: "CRM Leads", icon: Users, count: (leads || []).length },
            { id: "careers", label: "Hiring Applicants", icon: Users, count: careerApplicants.length },
            { id: "stats", label: "Terminal Monitor", icon: BarChart2 }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 rounded-none text-xs font-black uppercase tracking-widest transition-all cursor-pointer relative py-3.5 ${
                  isActive
                    ? "text-[#FBBF24] bg-white/5 border-b-2 border-[#FBBF24]"
                    : "text-slate-400 hover:text-white"
                }`}
                id={`admin-tab-btn-${tab.id}`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-[#FBBF24] text-[#0A1428] text-[9px] font-black">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Workspace Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* TAB: TRUCKS */}
          {activeTab === "trucks" && (
            <div className="grid lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: List */}
              <div className="lg:col-span-7 space-y-4">
                <div className="p-3 bg-black/25 border border-white/5 rounded-md flex flex-wrap gap-3 items-center justify-between select-none">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase text-[#FBBF24] tracking-widest">// ACTIVE SHOWROOM VEHICLES ({trucks.length})</span>
                    <span className="text-[9px] text-slate-500 uppercase font-bold mt-0.5">Bulk deploy inventory from spreadsheets</span>
                  </div>

                  <div className="flex gap-1.5 font-sans">
                    <button
                      type="button"
                      onClick={() => downloadExcelTemplate("trucks")}
                      className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[9px] font-black uppercase tracking-wider text-[#FBBF24] flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      <span>Template</span>
                    </button>
                    
                    <label className="px-2.5 py-1.5 bg-[#FBBF24] text-[#0A1428] hover:bg-[#FBBF24]/90 rounded text-[9px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors relative">
                      <Upload className="w-3 h-3" />
                      <span>Upload Excel</span>
                      <input
                        type="file"
                        accept=".xlsx, .xls"
                        onChange={(e) => handleExcelImport(e, "trucks")}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                    </label>
                  </div>
                </div>

                <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-2">
                  {trucks.map((truck) => (
                    <div
                      key={truck.id}
                      className="p-3 rounded bg-black/40 border border-white/5 hover:border-white/10 flex justify-between items-center gap-4 text-xs"
                      id={`admin-truck-row-${truck.id}`}
                    >
                      <div className="flex gap-3 items-center min-w-0">
                        {truck.imageUrl && (
                          <img
                            src={truck.imageUrl}
                            alt=""
                            className="w-12 h-9 object-cover rounded bg-slate-900 border border-white/5"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <div className="min-w-0">
                          <span className="text-[8px] font-mono text-slate-500 block uppercase font-black tracking-wider">
                            ID: {truck.id} | {truck.condition} • {truck.category}
                          </span>
                          <span className="font-extrabold text-white block uppercase tracking-wide truncate">{truck.name}</span>
                          <span className="text-[#FBBF24] font-black font-mono tracking-wider">${truck.price.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => startEditTruck(truck)}
                          className="p-2 rounded bg-white/5 border border-white/5 text-[#FBBF24] hover:bg-[#FBBF24]/10 hover:border-[#FBBF24]/30 cursor-pointer text-[10px] uppercase font-black flex items-center gap-1"
                          id={`btn-edit-truck-${truck.id}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Remove this truck listing?\n"${truck.name}"`)) {
                              deleteTruck(truck.id);
                              triggerNotification("Vehicle index scrubbed!");
                            }
                          }}
                          className="p-2 rounded bg-red-950/20 border border-red-900/35 text-red-400 hover:bg-red-900/40 cursor-pointer"
                          id={`btn-delete-truck-${truck.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Add/Edit Form */}
              <div className="lg:col-span-5 bg-black/35 rounded border border-white/5 p-5 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-white/5 select-none">
                  <span className={`w-2 h-2 rounded-full ${editingTruck ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
                  <h4 className="text-xs font-black uppercase tracking-widest text-white">
                    {editingTruck ? "Modify Active specification" : "Add New Rig to Showroom"}
                  </h4>
                </div>

                <form onSubmit={handleTruckSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Make / Provider</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Hino"
                        value={truckForm.make}
                        onChange={(e) => setTruckForm({ ...truckForm, make: e.target.value })}
                        className="w-full px-2.5 py-2 bg-[#0A1428] border border-white/10 rounded text-xs text-white font-bold placeholder:text-slate-600 focus:outline-none focus:border-[#FBBF24]"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Model Series</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. L6 Series"
                        value={truckForm.model}
                        onChange={(e) => setTruckForm({ ...truckForm, model: e.target.value })}
                        className="w-full px-2.5 py-2 bg-[#0A1428] border border-white/10 rounded text-xs text-white font-bold placeholder:text-slate-600 focus:outline-none focus:border-[#FBBF24]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Full Listing Display Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 2026 Hino L6 Regular Cab Dry Box"
                      value={truckForm.name}
                      onChange={(e) => setTruckForm({ ...truckForm, name: e.target.value })}
                      className="w-full px-2.5 py-2 bg-[#0A1428] border border-white/10 rounded text-xs text-white font-bold placeholder:text-slate-600 focus:outline-none focus:border-[#FBBF24]"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Category</label>
                      <select
                        value={truckForm.category}
                        onChange={(e) => setTruckForm({ ...truckForm, category: e.target.value as any })}
                        className="w-full px-2.5 py-2 bg-[#0A1428] border border-white/10 rounded text-xs text-[#FBBF24] font-bold focus:outline-none focus:border-[#FBBF24]"
                      >
                        <option value="Box Truck">Box Truck</option>
                        <option value="Flatbed">Flatbed</option>
                        <option value="Dump Truck">Dump Truck</option>
                        <option value="Reefer">Reefer</option>
                        <option value="Utility">Utility Rig</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Chassis Age</label>
                      <select
                        value={truckForm.condition}
                        onChange={(e) => setTruckForm({ ...truckForm, condition: e.target.value as any })}
                        className="w-full px-2.5 py-2 bg-[#0A1428] border border-white/10 rounded text-xs text-white font-bold focus:outline-none focus:border-[#FBBF24]"
                      >
                        <option value="New">New</option>
                        <option value="Pre-Owned">Pre-Owned</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Year</label>
                      <input
                        type="number"
                        required
                        value={truckForm.year}
                        onChange={(e) => setTruckForm({ ...truckForm, year: Number(e.target.value) })}
                        className="w-full px-2.5 py-2 bg-[#0A1428] border border-white/10 rounded text-xs text-white font-bold focus:outline-none focus:border-[#FBBF24]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Price ($USD)</label>
                      <input
                        type="number"
                        required
                        value={truckForm.price}
                        onChange={(e) => setTruckForm({ ...truckForm, price: Number(e.target.value) })}
                        className="w-full px-2.5 py-2 bg-[#0A1428] border border-white/10 rounded text-xs text-white font-bold font-mono focus:outline-none focus:border-[#FBBF24]"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Engine Block</label>
                      <input
                        type="text"
                        placeholder="e.g. Cummins B6.7"
                        value={truckForm.engine}
                        onChange={(e) => setTruckForm({ ...truckForm, engine: e.target.value })}
                        className="w-full px-2.5 py-2 bg-[#0A1428] border border-white/10 rounded text-xs text-white font-bold focus:outline-none focus:border-[#FBBF24]"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Transmission</label>
                      <input
                        type="text"
                        placeholder="Allison RDS Automatic"
                        value={truckForm.transmission}
                        onChange={(e) => setTruckForm({ ...truckForm, transmission: e.target.value })}
                        className="w-full px-2.5 py-2 bg-[#0A1428] border border-white/10 rounded text-xs text-white font-bold focus:outline-none focus:border-[#FBBF24]"
                      />
                    </div>
                  </div>

                  {truckForm.condition === "Pre-Owned" && (
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Verified Mileage (Miles)</label>
                      <input
                        type="number"
                        required
                        value={truckForm.mileage}
                        onChange={(e) => setTruckForm({ ...truckForm, mileage: Number(e.target.value) })}
                        className="w-full px-2.5 py-2 bg-[#0A1428] border border-white/10 rounded text-xs text-white font-mono focus:outline-none focus:border-[#FBBF24]"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Specs & Accessories (One Per Line)</label>
                    <textarea
                      rows={3}
                      placeholder="Roll-up Rear Door&#10;2,500 lbs liftgate&#10;LED warning beacons"
                      value={truckForm.specsString}
                      onChange={(e) => setTruckForm({ ...truckForm, specsString: e.target.value })}
                      className="w-full px-2.5 py-2 bg-[#0A1428] border border-white/10 rounded text-xs text-white font-bold focus:outline-none focus:border-[#FBBF24]"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Showcase Image & Asset Upload</label>
                    
                    <div 
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => document.getElementById("truck-image-uploader")?.click()}
                      className={`relative min-h-[95px] flex flex-col items-center justify-center border-2 border-dashed rounded p-3 text-center cursor-pointer select-none transition-all duration-200 ${
                        isDragOver 
                          ? "border-[#FBBF24] bg-[#FBBF24]/5" 
                          : "border-white/10 hover:border-white/20 bg-[#0A1428]"
                      }`}
                    >
                      <input 
                        type="file"
                        id="truck-image-uploader"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      
                      {truckForm.imageUrl ? (
                        <div className="w-full flex items-center gap-3 text-left">
                          <img 
                            src={truckForm.imageUrl} 
                            alt="Preview" 
                            className="w-12 h-12 object-cover rounded border border-white/10 shrink-0 bg-black/40"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/src/assets/images/diehls_hero_truck_1780493334702.png";
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] text-[#FBBF24] font-black uppercase tracking-wider block">Image Asset Configured</span>
                            <span className="text-[9px] text-slate-400 block truncate font-mono mt-0.5">{truckForm.imageUrl.startsWith("data:") ? "Base64 Compressed Data URL" : truckForm.imageUrl}</span>
                            <span className="text-[8px] text-slate-500 uppercase tracking-widest font-black block mt-0.5">// CLICK OR DRAG TO OVERWRITE</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <Upload className="w-5 h-5 text-slate-500 mx-auto" />
                          <div className="leading-snug">
                            <span className="text-[10px] text-slate-350 font-black uppercase tracking-wider block">Drag & Drop Truck Photo</span>
                            <span className="text-[9px] text-slate-500 font-bold uppercase mt-0.5 block">Or Click to Browse Local Desk Assets</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-3">
                      <label className="text-[8px] font-black uppercase tracking-wider text-slate-500 block mb-1">// Manually Edit Image URL / Path String</label>
                      <input
                        type="text"
                        required
                        placeholder="/src/assets/images/diehls_hero_truck_1780493334702.png"
                        value={truckForm.imageUrl}
                        onChange={(e) => setTruckForm({ ...truckForm, imageUrl: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-[#050B16] border border-white/10 rounded text-[10.5px] font-mono text-slate-350 focus:outline-none focus:border-[#FBBF24]"
                      />
                    </div>

                    <div className="flex gap-2.5 mt-2 flex-wrap items-center">
                      <span className="text-[9px] text-slate-500 font-bold uppercase font-sans">Quick Picker:</span>
                      {[
                        { label: "Box Truck (Hero)", val: "/src/assets/images/diehls_hero_truck_1780493334702.png" },
                        { label: "Bay (Dump)", val: "/src/assets/images/diehls_service_bay_1780493347262.png" },
                        { label: "Utility (Custom)", val: "/src/assets/images/diehls_custom_build_1780493374866.png" },
                        { label: "Shelves (Parts)", val: "/src/assets/images/diehls_parts_1780493360336.png" }
                      ].map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setTruckForm({ ...truckForm, imageUrl: item.val })}
                          className="px-1.5 py-0.5 rounded border border-white/5 bg-slate-900 text-[8px] uppercase tracking-wide text-slate-400 hover:text-white"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    {editingTruck && (
                      <button
                        type="button"
                        onClick={cancelEditTruck}
                        className="px-4 py-2 border border-slate-700 hover:bg-white/5 rounded text-xs uppercase font-black tracking-widest text-slate-300 transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#FBBF24] text-[#0A1428] hover:bg-[#FBBF24]/90 rounded text-xs uppercase font-black tracking-widest transition-all flex items-center gap-1 cursor-pointer shadow-md shadow-[#FBBF24]/10"
                      id="save-truck-form"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{editingTruck ? "Commit Specs" : "Launch Listing"}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB: PARTS */}
          {activeTab === "parts" && (
            <div className="grid lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Parts Catalog Table */}
              <div className="lg:col-span-7 space-y-4">
                <div className="p-3 bg-black/25 border border-white/5 rounded-md flex flex-wrap gap-3 items-center justify-between select-none">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase text-[#FBBF24] tracking-widest">// CORE PARTS INVENTORY ({parts.length})</span>
                    <span className="text-[9px] text-slate-500 uppercase font-bold mt-0.5">Bulk deploy SKU components from spreadsheets</span>
                  </div>

                  <div className="flex gap-1.5 font-sans">
                    <button
                      type="button"
                      onClick={() => downloadExcelTemplate("parts")}
                      className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[9px] font-black uppercase tracking-wider text-[#FBBF24] flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      <span>Template</span>
                    </button>
                    
                    <label className="px-2.5 py-1.5 bg-[#FBBF24] text-[#0A1428] hover:bg-[#FBBF24]/90 rounded text-[9px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors relative">
                      <Upload className="w-3 h-3" />
                      <span>Upload Excel</span>
                      <input
                        type="file"
                        accept=".xlsx, .xls"
                        onChange={(e) => handleExcelImport(e, "parts")}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                    </label>
                  </div>
                </div>

                <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-2">
                  {parts.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 rounded bg-black/40 border border-white/5 hover:border-white/10 flex justify-between items-center gap-4 text-xs"
                      id={`admin-part-row-${p.id}`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 bg-black/60 border border-white/5 rounded text-[8px] text-[#FBBF24] font-mono tracking-wider">
                            SKU: {p.sku}
                          </span>
                          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest font-sans">{p.category}</span>
                        </div>
                        <span className="font-extrabold text-white block uppercase tracking-wide truncate mt-1 leading-normal">{p.name}</span>
                        <div className="flex gap-4 text-[10px] uppercase font-bold text-slate-400 mt-1">
                          <span>Qty: <strong className={p.stock <= 5 ? "text-red-400" : "text-emerald-400"}>{p.stock} Units</strong></span>
                          <span>Unit Cost: <strong className="text-white">${p.price.toLocaleString()}</strong></span>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => startEditPart(p)}
                          className="p-2 rounded bg-white/5 border border-white/5 text-[#FBBF24] hover:bg-[#FBBF24]/10 hover:border-[#FBBF24]/30 cursor-pointer"
                          id={`btn-edit-part-${p.id}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete Heavy Component "${p.name}" from parts sheets?`)) {
                              deletePart(p.id);
                              triggerNotification("Component deleted from index sheets.");
                            }
                          }}
                          className="p-2 rounded bg-red-950/20 border border-red-900/35 text-red-400 hover:bg-red-900/40 cursor-pointer"
                          id={`btn-delete-part-${p.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Part Add/Edit Form */}
              <div className="lg:col-span-5 bg-black/35 rounded border border-white/5 p-5 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-white/5 select-none">
                  <span className={`w-2 h-2 rounded-full ${editingPart ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
                  <h4 className="text-xs font-black uppercase tracking-widest text-white">
                    {editingPart ? "Modify component specs" : "Register New Bulk Component"}
                  </h4>
                </div>

                <form onSubmit={handlePartSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Unique SKU Number</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. HW-44109-HYD"
                        value={partForm.sku}
                        onChange={(e) => setPartForm({ ...partForm, sku: e.target.value })}
                        className="w-full px-2.5 py-2 bg-[#0A1428] border border-white/10 rounded text-xs text-white font-mono uppercase focus:outline-none focus:border-[#FBBF24]"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Manufacturer Brand</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Muncie Power"
                        value={partForm.brand}
                        onChange={(e) => setPartForm({ ...partForm, brand: e.target.value })}
                        className="w-full px-2.5 py-2 bg-[#0A1428] border border-white/10 rounded text-xs text-white font-bold focus:outline-none focus:border-[#FBBF24]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Component Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Commercial Hydraulic Pump Assembly"
                      value={partForm.name}
                      onChange={(e) => setPartForm({ ...partForm, name: e.target.value })}
                      className="w-full px-2.5 py-2 bg-[#0A1428] border border-white/10 rounded text-xs text-white font-bold focus:outline-none focus:border-[#FBBF24]"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">System Category</label>
                      <select
                        value={partForm.category}
                        onChange={(e) => setPartForm({ ...partForm, category: e.target.value as any })}
                        className="w-full px-2.5 py-2 bg-[#0A1428] border border-white/10 rounded text-xs text-[#FBBF24] font-bold focus:outline-none focus:border-[#FBBF24]"
                      >
                        <option value="Engine & Drivetrain">Engine & Drivetrain</option>
                        <option value="Braking System">Braking System</option>
                        <option value="Hydraulics">Hydraulics</option>
                        <option value="Electrical">Electrical</option>
                        <option value="Filters & Fluids">Filters & Fluids</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Stock (Units)</label>
                      <input
                        type="number"
                        required
                        value={partForm.stock}
                        onChange={(e) => setPartForm({ ...partForm, stock: Number(e.target.value) })}
                        className="w-full px-2.5 py-2 bg-[#0A1428] border border-white/10 rounded text-xs text-white font-mono focus:outline-none focus:border-[#FBBF24]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Direct Unit Cost ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={partForm.price}
                        onChange={(e) => setPartForm({ ...partForm, price: Number(e.target.value) })}
                        className="w-full px-2.5 py-2 bg-[#0A1428] border border-white/10 rounded text-xs text-white font-bold font-mono focus:outline-none focus:border-[#FBBF24]"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Fitting/Compatibilities (CSV)</label>
                      <input
                        type="text"
                        placeholder="Hino L Series, Isuzu NRR"
                        value={partForm.compatString}
                        onChange={(e) => setPartForm({ ...partForm, compatString: e.target.value })}
                        className="w-full px-2.5 py-2 bg-[#0A1428] border border-white/10 rounded text-xs text-white font-bold placeholder:text-slate-600 focus:outline-none focus:border-[#FBBF24]"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    {editingPart && (
                      <button
                        type="button"
                        onClick={cancelEditPart}
                        className="px-4 py-2 border border-slate-700 hover:bg-white/5 rounded text-xs uppercase font-black tracking-widest text-slate-300 transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#FBBF24] text-[#0A1428] hover:bg-[#FBBF24]/90 rounded text-xs uppercase font-black tracking-widest transition-all flex items-center gap-1 cursor-pointer shadow-md shadow-[#FBBF24]/10"
                      id="save-part-form"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{editingPart ? "Update Register" : "Deploy Component"}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB: SETTINGS */}
          {activeTab === "settings" && (
            <div className="max-w-3xl mx-auto bg-black/35 rounded border border-white/5 p-6 space-y-6">
              <div className="border-b border-white/5 pb-3 select-none">
                <h3 className="text-xs font-black uppercase tracking-widest text-[#FBBF24]">// Dealership Identity Variables</h3>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">Modify brand texts, call hotlines, service locations and main hero messages displayed throughout the portal.</p>
              </div>

              <form onSubmit={handleSettingsSave} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Company Primary Direct Line</label>
                    <input
                      type="text"
                      required
                      value={settingsForm.phone}
                      onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                      className="w-full px-3 py-2.5 bg-[#0A1428] border border-white/10 rounded text-xs text-white font-bold focus:outline-none focus:border-[#FBBF24]"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Parts Sales Hotline</label>
                    <input
                      type="text"
                      required
                      value={settingsForm.partsPhone}
                      onChange={(e) => setSettingsForm({ ...settingsForm, partsPhone: e.target.value })}
                      className="w-full px-3 py-2.5 bg-[#0A1428] border border-white/10 rounded text-xs text-white font-bold focus:outline-none focus:border-[#FBBF24]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Emergency Towing Hotline</label>
                    <input
                      type="text"
                      required
                      value={settingsForm.towPhone}
                      onChange={(e) => setSettingsForm({ ...settingsForm, towPhone: e.target.value })}
                      className="w-full px-3 py-2.5 bg-[#0A1428] border border-white/10 rounded text-xs text-[#FBBF24] font-black font-mono focus:outline-none focus:border-[#FBBF24]"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Operational Facility Address</label>
                    <input
                      type="text"
                      required
                      value={settingsForm.address}
                      onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                      className="w-full px-3 py-2.5 bg-[#0A1428] border border-white/10 rounded text-xs text-slate-300 font-bold focus:outline-none focus:border-[#FBBF24]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Weekday Hours (Mon-Fri)</label>
                    <input
                      type="text"
                      required
                      value={settingsForm.weekdayHours}
                      onChange={(e) => setSettingsForm({ ...settingsForm, weekdayHours: e.target.value })}
                      className="w-full px-3 py-2.5 bg-[#0A1428] border border-white/10 rounded text-xs text-white font-bold focus:outline-none focus:border-[#FBBF24]"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Saturday Hours</label>
                    <input
                      type="text"
                      required
                      value={settingsForm.saturdayHours}
                      onChange={(e) => setSettingsForm({ ...settingsForm, saturdayHours: e.target.value })}
                      className="w-full px-3 py-2.5 bg-[#0A1428] border border-white/10 rounded text-xs text-white font-bold focus:outline-none focus:border-[#FBBF24]"
                    />
                  </div>
                </div>

                <div className="p-4 bg-[#FBBF24]/5 rounded border border-[#FBBF24]/10 space-y-3">
                  <div className="flex items-center gap-1.5 text-[#FBBF24] font-black uppercase text-[10px]">
                    <ShieldAlert className="w-4 h-4 animate-pulse" />
                    <span>Console Access Authorization Shield Key</span>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 leading-relaxed mb-3">Adjust the master code passphrase necessary to load or customize active configurations. Keep it secure.</p>
                    <input
                      type="text"
                      required
                      value={adminPassword}
                      onChange={(e) => {
                        setAdminPassword(e.target.value);
                        localStorage.setItem("dtw_admin_password", e.target.value);
                      }}
                      className="w-full px-3 py-2 bg-[#0A1428] border border-white/10 rounded text-xs text-emerald-400 font-mono focus:outline-none focus:border-[#FBBF24]"
                    />
                  </div>
                </div>

                <hr className="border-white/5" />

                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Hero Title Heading</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.heroHeading}
                    onChange={(e) => setSettingsForm({ ...settingsForm, heroHeading: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#0A1428] border border-white/10 rounded text-xs text-white font-black uppercase italic tracking-wider focus:outline-none focus:border-[#FBBF24]"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Hero Subheading description</label>
                  <textarea
                    required
                    rows={2}
                    value={settingsForm.heroSubheading}
                    onChange={(e) => setSettingsForm({ ...settingsForm, heroSubheading: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#0A1428] border border-white/10 rounded text-xs text-slate-300 font-bold focus:outline-none focus:border-[#FBBF24]"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">License & Trademark Disclaimer Banner</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.promoBanner}
                    onChange={(e) => setSettingsForm({ ...settingsForm, promoBanner: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0A1428] border border-white/10 rounded text-[10px] text-[#FBBF24] font-black uppercase tracking-widest focus:outline-none focus:border-[#FBBF24]"
                  />
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    type="submit"
                    className="px-6 py-3.5 bg-[#FBBF24] text-[#0A1428] hover:bg-[#FBBF24]/90 rounded text-xs uppercase font-black tracking-widest transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#FBBF24]/10 font-sans"
                    id="save-identity-settings"
                  >
                    <Save className="w-4 h-4" />
                    <span>Conclude Configurations</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB: ORDERS */}
          {activeTab === "orders" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center select-none">
                <h3 className="text-xs font-black uppercase tracking-widest text-[#FBBF24]">// Live Parts Requisitions & Order Ledger ({orders.length})</h3>
                <span className="text-[10px] text-slate-500 font-bold uppercase font-mono">Tracks Live Checkout purchases in Real time</span>
              </div>

              {orders.length > 0 ? (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="p-5 rounded bg-black/40 border border-white/10 space-y-4 text-xs hover:border-white/20 transition-all"
                      id={`admin-order-card-${order.id}`}
                    >
                      {/* Order Header info */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-white/5">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-[#FBBF24] font-mono">{order.id}</span>
                            <span className="text-[10px] text-slate-500 font-semibold">{order.date}</span>
                          </div>
                          <span className="text-[10px] text-slate-300 block uppercase font-black truncate mt-1">
                            {order.companyName} ({order.customerName})
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="px-2 py-0.5 bg-black/60 border border-white/5 rounded text-[10px] font-black tracking-wider uppercase text-slate-400">
                            {order.paymentMethod}
                          </span>
                          
                          {/* Order Status Controller */}
                          <select
                            value={order.status}
                            onChange={(e) => {
                              updateOrderStatus(order.id, e.target.value as any);
                              triggerNotification(`Order ${order.id} status updated to: ${e.target.value}!`);
                            }}
                            className="px-2.5 py-1 bg-[#0A1428] border border-white/10 rounded text-[10px] font-black uppercase tracking-wider text-[#FBBF24] focus:outline-none focus:border-[#FBBF24] cursor-pointer"
                          >
                            <option value="Pending Desk Review">Pending Desk Review</option>
                            <option value="Assembling at Depot">Assembling at Depot</option>
                            <option value="In-Transit to Queens Bay">In-Transit to Queens Bay</option>
                            <option value="Ready for Pickup">Ready for Pickup</option>
                            <option value="Dispatched & Completed">Dispatched & Completed</option>
                          </select>

                          <button
                            onClick={() => {
                              if (confirm(`Scrub Order Records for "${order.id}"?\nThis cannot be undone.`)) {
                                deleteOrder(order.id);
                                triggerNotification("Order record successfully cleared.");
                              }
                            }}
                            className="p-1 rounded bg-red-950/20 border border-red-900/35 text-red-550 hover:bg-red-900/40 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Items details */}
                      <div className="grid sm:grid-cols-12 gap-4 items-start">
                        <div className="sm:col-span-7 space-y-2.5">
                          <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest block">// Purchased Components</span>
                          <div className="space-y-1.5">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center text-[11px] bg-black/20 p-2 border border-white/5 rounded">
                                <span className="text-white font-extrabold uppercase tracking-wide">
                                  {item.name} <span className="text-[#FBBF24] font-mono">x{item.quantity}</span>
                                </span>
                                <span className="text-slate-400 font-mono font-bold">${(item.price * item.quantity).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Customer callback information & financial tally */}
                        <div className="sm:col-span-5 bg-[#050B16] p-3 rounded border border-white/5 text-[11px] uppercase font-bold space-y-2">
                          <span className="text-[9px] text-slate-500 font-black tracking-widest block">// Dispatch Coordinates</span>
                          <p className="text-white">Phone: <strong className="text-slate-350">{order.phone}</strong></p>
                          {order.email && <p className="text-white">Email: <strong className="text-slate-350">{order.email}</strong></p>}
                          <p className="text-white">Delivery destination: <strong className="text-slate-350">{order.address}</strong></p>
                          <hr className="border-white/5" />
                          <div className="flex justify-between font-black text-xs text-[#FBBF24]">
                            <span>Grand Total Invoice:</span>
                            <span className="font-mono">${order.total.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center rounded bg-black/35 border border-white/10 select-none space-y-3">
                  <FileText className="w-9 h-9 text-[#FBBF24] mx-auto opacity-70" />
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">No Checkouts or Order Logs Yet</h4>
                    <p className="text-[10px] text-slate-500 mt-1 max-w-[200px] mx-auto leading-relaxed">Purchases from the parts catalog checkout form will compile here immediately in real time.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: SERVICE APPOINTMENTS LEDGER */}
          {activeTab === "services" && (
            <div className="space-y-4 text-left">
              <div className="flex justify-between items-center select-none">
                <h3 className="text-xs font-black uppercase tracking-widest text-[#FBBF24]">// Service Appointments & Bay Ledger ({(serviceAppointments || []).length})</h3>
                <span className="text-[10px] text-slate-500 font-bold uppercase font-mono">Manage technician assignments & live bay servicing status</span>
              </div>

              {(serviceAppointments || []).length > 0 ? (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {serviceAppointments.map((app) => (
                    <div
                      key={app.id}
                      className="p-5 rounded bg-black/40 border border-white/10 space-y-4 text-xs hover:border-white/20 transition-all text-left animate-in fade-in"
                      id={`admin-service-card-${app.id}`}
                    >
                      {/* Appointment Header */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-white/5">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-amber-400 font-mono">{app.id}</span>
                            <span className="text-[10px] text-slate-500 font-semibold">{app.date}</span>
                          </div>
                          <span className="text-[10px] text-slate-305 block uppercase font-black truncate mt-1">
                            {app.companyName} ({app.customerName})
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="px-2 py-0.5 bg-black/60 border border-white/5 rounded text-[10px] font-black tracking-wider uppercase text-slate-400">
                            {app.vehicleClass === "heavy" ? "Heavy-Duty Rig" : "Medium-Duty Truck"}
                          </span>
                          
                          {/* Service Status Controller */}
                          <select
                            value={app.status}
                            onChange={(e) => {
                              updateServiceAppointmentStatus(app.id, e.target.value as any);
                              triggerNotification(`Appointment ${app.id} status modified to: ${e.target.value}!`);
                            }}
                            className="px-2.5 py-1 bg-[#0A1428] border border-white/10 rounded text-[10px] font-black uppercase tracking-wider text-amber-400 focus:outline-none focus:border-amber-400 cursor-pointer"
                          >
                            <option value="Scheduling">Scheduling</option>
                            <option value="Diagnosing">Diagnosing</option>
                            <option value="Parts Sourcing">Parts Sourcing</option>
                            <option value="Bay Servicing">Bay Servicing</option>
                            <option value="Ready for Pickup">Ready for Pickup</option>
                            <option value="Archived & Dispatched">Archived & Dispatched</option>
                          </select>
                        </div>
                      </div>

                      {/* Info grid & details breakdown */}
                      <div className="grid md:grid-cols-12 gap-4">
                        <div className="md:col-span-8 space-y-1.5 text-left uppercase">
                          <p className="text-[10px] text-slate-500 font-black tracking-widest block mb-0.5">// REBUILD WORK ORDER DETAIL</p>
                          <div className="flex justify-between p-2 rounded bg-black/20 text-[11px] font-bold">
                            <span className="text-slate-400">Core Service Category:</span>
                            <span className="text-white font-black">{app.serviceType === "pm" ? "Preventative Maintenance" : app.serviceType === "repair" ? "Heavy Diagnostics & Repair" : "Collision & Body Mount"}</span>
                          </div>
                          {app.addons && app.addons.length > 0 && (
                            <div className="flex flex-col p-2 rounded bg-black/20 text-[11px] font-bold">
                              <span className="text-slate-400 mb-1">Addon Special Services:</span>
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                {app.addons.map((add, idx) => (
                                  <span key={idx} className="bg-amber-955/30 text-amber-300 border border-amber-900/40 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                    {add}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="flex justify-between p-2 rounded bg-black/20 text-[11px] font-bold">
                            <span className="text-slate-400">Assigned Technician:</span>
                            <span className="text-white">{app.assignedTechnician || "Marc Davis"}</span>
                          </div>
                          <div className="flex justify-between p-2 rounded bg-black/20 text-[11px] font-bold">
                            <span className="text-slate-400">Bay Positions:</span>
                            <span className="text-white font-mono">{app.bayNumber || "Bay #4"}</span>
                          </div>
                        </div>

                        <div className="md:col-span-4 bg-[#050B16] p-4 rounded border border-white/5 space-y-3 font-bold leading-normal text-left text-[11px]">
                          <span className="text-[9px] text-slate-500 font-black tracking-widest block uppercase">// CONTACT & SPECIFICATIONS</span>
                          <p className="text-white">Contact Callback: <strong className="text-slate-350">{app.phone}</strong></p>
                          <p className="text-slate-350 lowercase normal-case">Email: {app.email}</p>
                          <p className="text-white">Estimated Duration: <strong className="text-slate-350">{app.duration}</strong></p>
                          <hr className="border-white/5" />
                          <div className="flex justify-between font-black text-xs text-amber-400">
                            <span>Diagnostic base invoice:</span>
                            <span className="font-mono">${app.estimatedPrice.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Technical Comment Logs */}
                      <div className="bg-black/25 border border-white/5 rounded p-3 text-[10px] font-mono text-slate-400 leading-relaxed text-left">
                        <span className="text-[8px] text-slate-500 uppercase font-black block mb-1 tracking-widest">// ACTIVE INTERNAL SERVICE LOGS</span>
                        <p className="text-[#FBBF24]">STATUS NOTES: {app.statusNotes || "Appointment logged. Awaiting technician scanner."}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center rounded bg-black/35 border border-white/10 select-none space-y-3">
                  <Wrench className="w-9 h-9 text-amber-500 mx-auto opacity-70 animate-pulse" />
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">No Services Scheduled Yet</h4>
                    <p className="text-[10px] text-slate-500 mt-1 max-w-[200px] mx-auto leading-relaxed">Service requests from the estimator tool or corporate accounts will populate here instantly inside the bay controller.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: CRM LEADS TRACKER */}
          {activeTab === "leads" && (
            <div className="space-y-6">
              {/* Top Filters & Controls */}
              <div className="p-4 bg-black/25 border border-white/5 rounded-md flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-col select-none">
                  <span className="text-[10px] font-black uppercase text-[#FBBF24] tracking-widest">// CRM PIPELINE LEAD TRACKING ({leads.length})</span>
                  <span className="text-[9px] text-slate-500 uppercase font-bold mt-0.5">Route submissions, schedule phone dials and log follow-ups</span>
                </div>

                <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
                  {/* Search input */}
                  <input
                    type="text"
                    placeholder="Search by name/company/email..."
                    value={leadSearchQuery}
                    onChange={(e) => setLeadSearchQuery(e.target.value)}
                    className="px-3 py-1.5 bg-[#0A1428] border border-white/10 rounded text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-[#FBBF24] uppercase font-bold tracking-wider text-[10px]"
                  />

                  {/* Excel Export */}
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        const dataToExport = leads.map(l => ({
                          ID: l.id,
                          Name: l.name,
                          Company: l.companyName,
                          Phone: l.phone,
                          Email: l.email,
                          Source: l.source,
                          Status: l.status,
                          Inquiry: l.message || "",
                          Specs: l.details || "",
                          Notes: l.notes || "",
                          Date: l.date
                        }));
                        const wb = XLSX.utils.book_new();
                        const ws = XLSX.utils.json_to_sheet(dataToExport);
                        XLSX.utils.book_append_sheet(wb, ws, "CRM Sales Leads");
                        XLSX.writeFile(wb, "diehls_crm_leads.xlsx");
                        triggerNotification("Successfully exported CRM leads database!");
                      } catch (err) {
                        console.error(err);
                        triggerNotification("Failed to export leads.");
                      }
                    }}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[10px] font-black uppercase tracking-wider text-[#FBBF24] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export to Excel</span>
                  </button>
                </div>
              </div>

              {/* Grid content split: Form (Left 1/3) & Leads Cards (Right 2/3) */}
              <div className="grid lg:grid-cols-12 gap-6 items-start">
                
                {/* Form to manual add a CRM lead */}
                <div className="lg:col-span-4 bg-black/35 rounded border border-white/5 p-5 space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-white/5 select-none">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <h4 className="text-xs font-black uppercase tracking-widest text-white">
                      File Manual Lead Card
                    </h4>
                  </div>

                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      const f = e.currentTarget;
                      const d = new FormData(f);
                      const name = d.get("name") as string;
                      const email = d.get("email") as string;
                      const phone = d.get("phone") as string;
                      const company = d.get("companyName") as string;
                      const source = d.get("source") as any;
                      const status = d.get("status") as any;
                      const message = d.get("message") as string;
                      const notes = d.get("notes") as string;

                      if (!name || !phone) {
                        triggerNotification("Name and phone number are required.");
                        return;
                      }

                      addLead({
                        name,
                        companyName: company || "Independent",
                        email: email || "N/A",
                        phone,
                        source,
                        status,
                        message,
                        notes
                      });

                      triggerNotification("Manual lead card registered successfully!");
                      f.reset();
                    }}
                    className="space-y-3"
                  >
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">// Lead Name *</label>
                      <input
                        type="text"
                        name="name"
                        required
                        placeholder="Danny Castano"
                        className="w-full px-2.5 py-2 bg-[#0A1428] border border-white/10 rounded text-xs text-white focus:outline-none focus:border-[#FBBF24] font-black uppercase"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">// Company Svc</label>
                      <input
                        type="text"
                        name="companyName"
                        placeholder="Richmond Hill Movers"
                        className="w-full px-2.5 py-2 bg-[#0A1428] border border-white/10 rounded text-xs text-white focus:outline-none focus:border-[#FBBF24] font-black uppercase"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">// E-mail address</label>
                        <input
                          type="email"
                          name="email"
                          placeholder="mover@richmond.com"
                          className="w-full px-2.5 py-2 bg-[#0A1428] border border-white/10 rounded text-xs text-white focus:outline-none focus:border-[#FBBF24]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">// Tel Phone *</label>
                        <input
                          type="text"
                          name="phone"
                          required
                          placeholder="(718) 555-8822"
                          className="w-full px-2.5 py-2 bg-[#0A1428] border border-white/10 rounded text-xs text-white focus:outline-none focus:border-[#FBBF24] font-black uppercase"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">// Lead Source</label>
                        <select
                          name="source"
                          defaultValue="Quick Inquiry"
                          className="w-full px-2 py-2 bg-[#0A1428] border border-white/10 rounded text-[11px] text-slate-300 font-extrabold focus:outline-none focus:border-[#FBBF24]"
                        >
                          <option value="Quick Inquiry">Quick Inquiry</option>
                          <option value="Contact Form">Contact Form</option>
                          <option value="Custom Build">Custom Build</option>
                          <option value="Service Estimator">Service Estimator</option>
                          <option value="Parts RFQ">Parts RFQ</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">// Pipe Status</label>
                        <select
                          name="status"
                          defaultValue="New"
                          className="w-full px-2 py-2 bg-[#0A1428] border border-white/10 rounded text-[11px] text-[#FBBF24] font-black focus:outline-none focus:border-[#FBBF24]"
                        >
                          <option value="New">New</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Qualified">Qualified</option>
                          <option value="Lost">Lost</option>
                          <option value="Converted">Converted</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">// Requirements Inquiry details</label>
                      <textarea
                        name="message"
                        rows={2}
                        placeholder="Inbound lead requesting quick lease rates on medium boxes..."
                        className="w-full px-2 py-1.5 bg-[#0A1428] border border-white/10 rounded text-xs text-white focus:outline-none focus:border-[#FBBF24]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">// Follow-up Notes comment</label>
                      <textarea
                        name="notes"
                        rows={2}
                        placeholder="Need pricing spreadsheet by Friday..."
                        className="w-full px-2 py-1.5 bg-[#0A1428] border border-white/10 rounded text-xs text-white focus:outline-none focus:border-[#FBBF24]"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-[#FBBF24] text-[#0A1428] hover:bg-[#FBBF24]/90 rounded text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-md text-center"
                    >
                      File CRM Entry
                    </button>
                  </form>
                </div>

                {/* Right Leads Cards Panel */}
                <div className="lg:col-span-8 space-y-4">
                  {leads.length === 0 ? (
                    <div className="p-12 text-center rounded bg-black/20 border border-white/5 space-y-3">
                      <Users className="w-10 h-10 text-slate-600 mx-auto animate-pulse" />
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">No Leads Loaded in CRM Sheet</h4>
                        <p className="text-[10px] text-slate-500 mt-1 max-w-[200px] mx-auto leading-relaxed">Submit the contact inquiry form or design custom vehicles to populate lead registries.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3.5 max-h-[620px] overflow-y-auto pr-2">
                      {leads
                        .filter(l => {
                          if (!leadSearchQuery) return true;
                          const q = leadSearchQuery.toLowerCase();
                          return (
                            l.name.toLowerCase().includes(q) ||
                            (l.companyName && l.companyName.toLowerCase().includes(q)) ||
                            (l.email && l.email.toLowerCase().includes(q)) ||
                            l.phone.includes(q)
                          );
                        })
                        .map((lead) => {
                          const statusColors = {
                            New: "bg-blue-500/10 text-blue-400 border-blue-500/20",
                            Contacted: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                            Qualified: "bg-purple-500/10 text-purple-400 border-purple-500/20",
                            Lost: "bg-red-500/10 text-red-400 border-red-500/20",
                            Converted: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          };

                          return (
                            <div
                              key={lead.id}
                              className="p-4 rounded bg-[#050B16] border border-white/10 hover:border-white/20 transition-all flex flex-col md:flex-row md:items-start justify-between gap-4 text-xs"
                            >
                              <div className="space-y-3 min-w-0 flex-1">
                                {/* Header details */}
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-[10px] font-black text-white uppercase tracking-wider">
                                    {lead.name}
                                  </span>
                                  {lead.companyName && lead.companyName !== "N/A" && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/40 text-slate-450 border border-white/5 uppercase font-bold">
                                      🏢 {lead.companyName}
                                    </span>
                                  )}
                                  <span className="text-[8px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 font-mono">
                                    SOURCE: {lead.source}
                                  </span>
                                  <span className="text-[8.5px] text-slate-500 font-mono ml-auto">
                                    Received {lead.date}
                                  </span>
                                </div>

                                {/* Contact Information */}
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 py-1.5 border-y border-white/5 select-text">
                                  <div className="text-[10px]">
                                    <span className="text-slate-500 block text-[7px] uppercase font-bold tracking-widest">// DIRECT DIAL</span>
                                    <a href={`tel:${lead.phone}`} className="text-white hover:text-[#FBBF24] font-black font-mono transition-colors">
                                      {lead.phone}
                                    </a>
                                  </div>
                                  <div className="text-[10px]">
                                    <span className="text-slate-500 block text-[7px] uppercase font-bold tracking-widest">// EMAIL INBOX</span>
                                    <a href={`mailto:${lead.email}`} className="text-white hover:text-[#FBBF24] font-medium font-mono text-[9.5px] truncate block max-w-[150px] transition-colors">
                                      {lead.email}
                                    </a>
                                  </div>
                                  <div className="text-[10px] col-span-2 md:col-span-1">
                                    <span className="text-slate-500 block text-[7px] uppercase font-bold tracking-widest">// PIPELINE GATE</span>
                                    <select
                                      value={lead.status}
                                      onChange={(e) => {
                                        updateLeadStatus(lead.id, e.target.value as any);
                                        triggerNotification(`Lead "${lead.name}" pipeline updated to ${e.target.value}!`);
                                      }}
                                      className="p-0.5 px-2.5 bg-[#0A1428] border border-white/10 rounded text-[9.5px] font-black uppercase text-[#FBBF24] tracking-wider focus:outline-none focus:border-[#FBBF24] cursor-pointer"
                                    >
                                      <option value="New">New Lead</option>
                                      <option value="Contacted">Active Contacted</option>
                                      <option value="Qualified">Qualified Route</option>
                                      <option value="Lost">Lost Pipeline</option>
                                      <option value="Converted">Converted Account</option>
                                    </select>
                                  </div>
                                </div>

                                {/* Inquiry Message Details */}
                                {lead.message && (
                                  <div className="p-2.5 bg-black/40 border border-white/5 rounded text-[10.5px] text-slate-350 leading-relaxed font-sans mt-1">
                                    <p className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest mb-1">// CLIENT INQUIRY DESCRIPTION</p>
                                    {lead.message}
                                  </div>
                                )}

                                {/* Custom Config Details */}
                                {lead.details && (
                                  <div className="p-2.5 bg-amber-950/10 border border-amber-500/10 rounded text-[10px] text-amber-300 leading-normal font-mono uppercase mt-1">
                                    <p className="text-[7.5px] font-black text-amber-500 uppercase tracking-widest mb-1">// CUSTOM RIG MATRIX SPECIFICATIONS</p>
                                    {lead.details}
                                  </div>
                                )}

                                {/* Interactive Inline Notes */}
                                <div className="space-y-1 mt-1 font-sans">
                                  <p className="text-[7.5px] font-black text-slate-500 uppercase block mt-2">// DEALER STAFF COMMENTARY & CALL NOTES</p>
                                  <textarea
                                    defaultValue={lead.notes || ""}
                                    onBlur={(e) => {
                                      updateLeadNotes(lead.id, e.target.value);
                                    }}
                                    placeholder="Type notes (e.g., 'Spoke with client, scheduled a phone demo...'). Click outside box to auto-save."
                                    className="w-full p-2 bg-[#0A1428] border border-white/5 rounded text-[10.5px] text-slate-300 focus:border-[#FBBF24]/30 focus:outline-none placeholder-slate-700 leading-relaxed font-sans"
                                    rows={1.5}
                                  />
                                  <span className="text-[7.5px] text-slate-500 uppercase block font-semibold text-right leading-none">💬 Notes auto-save when focus exits</span>
                                </div>
                              </div>

                              {/* Actions Right */}
                              <div className="flex md:flex-col justify-end items-end gap-2 shrink-0 select-none">
                                <span className={`px-2 py-1 rounded-sm border text-[9px] font-mono uppercase tracking-wider font-extrabold ${statusColors[lead.status]}`}>
                                  {lead.status}
                                </span>

                                <button
                                  onClick={() => {
                                    if (confirm(`Scrub this lead from active CRM pipeline?\n"${lead.name}"`)) {
                                      deleteLead(lead.id);
                                      triggerNotification(`Lead index of ${lead.name} deleted.`);
                                    }
                                  }}
                                  className="p-2 rounded bg-red-950/20 border border-red-900/35 text-red-400 hover:bg-red-400 hover:text-white cursor-pointer text-[10px] font-black flex items-center gap-1 mt-2 uppercase text-right md:-mr-1 transition-colors"
                                  title="Scrub Lead Entry"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB: CAREERS APPLICATIONS (DEALERSHIP HIRING DESK) */}
          {activeTab === "careers" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center select-none">
                <div className="flex flex-col">
                  <span className="text-xs font-black uppercase text-[#FBBF24] tracking-widest">// ACTIVE APPLICANT RESPONSES ({careerApplicants.length})</span>
                  <span className="text-[10px] text-slate-500 uppercase font-black mt-0.5">ASE mechanics, diesel supervisors, parts team and sales executives</span>
                </div>
                <span className="text-[10px] text-slate-450 uppercase font-mono font-bold">Local Richmond Hill talent pipeline</span>
              </div>

              {careerApplicants.length > 0 ? (
                <div className="space-y-4 max-h-[520px] overflow-y-auto pr-2">
                  {careerApplicants.map((appl: any) => (
                    <div
                      key={appl.id}
                      className="p-5 rounded bg-black/45 border border-white/10 space-y-4 text-xs hover:border-[#FBBF24]/30 transition-all text-left"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-3 border-b border-white/5">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-black text-white uppercase italic">{appl.name}</span>
                            <span className="px-2 py-0.5 rounded-sm bg-[#FBBF24]/10 border border-[#FBBF24]/30 text-[#FBBF24] text-[9px] font-black uppercase font-mono">
                              {appl.role}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-450 uppercase font-bold mt-1 block">
                            Experience Level: <strong className="text-slate-350">{appl.experience}</strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0 select-none">
                          <span className="text-[10px] text-slate-500 font-bold font-mono">Submitted: {appl.date}</span>
                          <button
                            onClick={() => deleteApplicant(appl.id)}
                            className="p-1 px-2.5 rounded bg-red-950/20 border border-red-900/45 text-red-300 hover:bg-red-400 hover:text-white transition-colors text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Purge Application</span>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest block">// PROFESSIONAL BACKGROUND & CERTIFICATIONS</span>
                        <div className="p-3.5 rounded bg-[#050B16] border border-white/5 font-mono text-[11px] text-slate-350 italic leading-relaxed whitespace-pre-wrap select-text">
                          "{appl.pitch}"
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2 bg-[#050B16]/40 p-3 rounded text-[11.5px] font-black uppercase">
                        <div>
                          <span className="text-slate-500 text-[8px] block tracking-wide">// DIRECT DIRECTORY DIAL</span>
                          <span className="text-[#FBBF24] font-mono select-text">{appl.phone}</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-slate-500 block tracking-wide">// TRANSMISSION CLOUD INDEX</span>
                          <span className="text-white select-text font-mono text-[10.5px]">{appl.id}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center rounded bg-black/40 border border-white/5 select-none space-y-3">
                  <span className="text-3xl block">📁</span>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">No Applications Handled Yet</h4>
                    <p className="text-[10px] text-slate-500 mt-1 max-w-[280px] mx-auto leading-relaxed uppercase font-bold">Applications submitted from the Careers subsection on our Atlantic Avenue panel will manifest here instantly.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: TERMINAL STATS */}
          {activeTab === "stats" && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 select-none">
                <div className="p-4 bg-black/40 rounded border border-white/5">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">// ONLINE SALES</span>
                  <p className="text-2xl font-black text-emerald-400 font-mono mt-1">${totalSales.toLocaleString()}</p>
                  <span className="text-[10px] text-slate-400 block mt-1 font-medium">Accumulated Credit purchases</span>
                </div>
                <div className="p-4 bg-black/40 rounded border border-white/5">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">// PENDING RFQS</span>
                  <p className="text-2xl font-black text-[#FBBF24] font-mono mt-1">{totalQuotes}</p>
                  <span className="text-[10px] text-slate-400 block mt-1 font-medium">Bespoke pricing quotations</span>
                </div>
                <div className="p-4 bg-black/40 rounded border border-white/5">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">// SHOWROOM FLEETS</span>
                  <p className="text-2xl font-black text-white font-mono mt-1">{trucks.length}</p>
                  <span className="text-[10px] text-slate-400 block mt-1 font-medium">Commercial chassis units listed</span>
                </div>
                <div className="p-4 bg-black/40 rounded border border-white/5">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">// TOTAL PARTS SKUS</span>
                  <p className="text-2xl font-black text-white font-mono mt-1">{parts.length}</p>
                  <span className="text-[10px] text-slate-400 block mt-1 font-medium">Individual component indexes</span>
                </div>
              </div>

              {/* Utility Panel */}
              <div className="p-6 rounded bg-red-950/15 border border-red-900/35 space-y-4">
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-red-300">Enterprise DB Utility Controls</h4>
                    <p className="text-[10px] text-slate-450 uppercase tracking-wide font-medium mt-0.5 leading-normal">
                      Reset listing prices, SKUs, and diagnostic programs back to original pre-loaded Hino/Isuzu values.
                    </p>
                  </div>
                </div>
                
                <div className="p-3 bg-red-950/10 rounded border border-red-900/20 text-[10px] text-red-300 font-bold uppercase tracking-wider leading-relaxed">
                  ⚠️ WARNING: Purges all customized trucks, edited parts prices, and checkout orders recorded in local storage!
                </div>

                <div>
                  <button
                    onClick={() => {
                      if (confirm("FORCE SYSTEM REVERSION?\nThis will purge all custom e-commerce listings and orders!")) {
                        resetToFactoryDefaults();
                        triggerNotification("System reverted to factory specifications!");
                        setSettingsForm({ ...settings });
                      }
                    }}
                    className="px-5 py-3.5 bg-red-650 hover:bg-red-700 text-white rounded text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-red-900/10"
                    id="reset-db-btn"
                  >
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Revert Entire DB to Factory Specs</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer info lock */}
        <div className="px-6 py-4.5 bg-[#050B16] border-t border-white/10 text-center select-none flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            Licensed Terminal Dashboard Terminal. Ver 4.8.2. Queens Bay District.
          </p>
          <span className="text-[10px] text-[#FBBF24] font-black uppercase tracking-widest font-mono">
            ★ OVER 44 YEARS OF TRUCKING EXCELLENCE ★
          </span>
        </div>

      </div>
    </div>
  );
}
