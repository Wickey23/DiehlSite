/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Phone, MapPin, Clock, Menu, X, Truck, Settings,
  Home, Tag, Wrench, Info, Users, Globe, ChevronDown,
  Facebook, Instagram, Youtube, Activity
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useApp } from "../context/AppContext";
import BrandLogo from "./BrandLogo";
import { DealerPage } from "../App";

interface NavbarProps {
  onAdminClick: () => void;
  onCustomerClick: () => void;
  currentPage: DealerPage;
  navigateTo: (page: DealerPage, sectionId?: string) => void;
}

export default function Navbar({ onAdminClick, onCustomerClick, currentPage, navigateTo }: NavbarProps) {
  const { settings, currentCustomer } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [isLangOpen, setIsLangOpen] = useState(false);

  const handleLinkClick = (page: DealerPage, sectionId?: string) => {
    navigateTo(page, sectionId);
    setIsOpen(false);
  };

  // Structured list mirroring the exact look & feel of the original bottom/header menu options of the attached image:
  // HOME (Orange home), TRUCK SALES (Blue truck), MUNICIPAL SALES (Orange tag), SERVICE (Blue wrench), PARTS (Orange gear/settings), DEALER INFO (Blue info), CAREERS (Orange users), CONTACT US (Blue map pin)
  const menuItems = [
    { label: "Home", page: "showroom" as const, id: undefined, icon: Home, color: "text-amber-500" },
    { label: "Truck Sales", page: "showroom" as const, id: "inventory", icon: Truck, color: "text-sky-500" },
    { label: "Municipal Sales", page: "showroom" as const, id: "customizer", icon: Tag, color: "text-amber-500" },
    { label: "Live Operations", page: "showroom" as const, id: "operations", icon: Activity, color: "text-sky-400" },
    { label: "Service", page: "services" as const, id: undefined, icon: Wrench, color: "text-sky-500" },
    { label: "Parts", page: "parts" as const, id: undefined, icon: Settings, color: "text-amber-500" },
    { label: "Dealer Info", page: "about" as const, id: "dealer-info-section", icon: Info, color: "text-sky-500" },
    { label: "Careers", page: "about" as const, id: "careers-section", icon: Users, color: "text-amber-500" },
    { label: "Contact Us", page: "showroom" as const, id: "contact", icon: MapPin, color: "text-sky-400" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full select-none" id="main-header">
      {/* 1. UPPER BRAND INFO BAR */}
      <div className="w-full bg-[#030712] border-b border-white/5 py-3 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Brand Logo component */}
          <button
            onClick={() => handleLinkClick("showroom")}
            className="flex items-center gap-2 text-left group cursor-pointer focus:outline-none"
            id="header-brand-logo-btn"
          >
            <BrandLogo size="md" />
          </button>

          {/* Central Hotline & Coordinates Desk (Mirroring the image) */}
          <div className="flex flex-col items-center md:items-end text-center md:text-right gap-1 font-mono uppercase">
            <span className="text-[10px] text-slate-400 tracking-wider font-semibold flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
              129-01 ATLANTIC AVE | RICHMOND HILL, NY 11418
            </span>
            
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-x-3 gap-y-1">
              {/* Primary Toll Free */}
              <a
                href="tel:8006825825"
                className="text-lg font-black tracking-tight text-white hover:text-amber-500 transition-colors flex items-center gap-1"
              >
                <Phone className="w-4 h-4 text-amber-500" />
                800.682.5825
              </a>

              {/* Action Extensions in Badge Grid */}
              <div className="flex gap-1 text-[9px] font-bold">
                <span className="px-1.5 py-0.5 bg-black/50 border border-white/5 rounded text-slate-300">
                  SERVICE: <strong className="text-sky-400">EXT-6</strong>
                </span>
                <span className="px-1.5 py-0.5 bg-black/50 border border-white/5 rounded text-slate-300">
                  PARTS: <strong className="text-amber-500">EXT-5</strong>
                </span>
                <span className="px-1.5 py-0.5 bg-black/50 border border-white/5 rounded text-slate-300">
                  SALES: <strong className="text-sky-400">EXT-4</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Right Action Stack: Social + Google Translates + Find Us Orange Button */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Social Circle Links */}
            <div className="flex items-center gap-1.5">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noreferrer" 
                className="w-7 h-7 rounded-full bg-slate-900 border border-white/10 hover:border-amber-500 hover:text-amber-500 text-slate-300 flex items-center justify-center transition-all"
                aria-label="Facebook Link"
                id="header-facebook-link"
              >
                <Facebook className="w-3.5 h-3.5" />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noreferrer" 
                className="w-7 h-7 rounded-full bg-slate-900 border border-white/10 hover:border-amber-500 hover:text-amber-500 text-slate-300 flex items-center justify-center transition-all"
                aria-label="Instagram Link"
                id="header-instagram-link"
              >
                <Instagram className="w-3.5 h-3.5" />
              </a>
              <a 
                href="https://youtube.com" 
                target="_blank" 
                rel="noreferrer" 
                className="w-7 h-7 rounded-full bg-slate-900 border border-white/10 hover:border-amber-500 hover:text-amber-500 text-slate-300 flex items-center justify-center transition-all"
                aria-label="Youtube Link"
                id="header-youtube-link"
              >
                <Youtube className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Google Translation Mock Selector */}
            <div className="relative">
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="px-2 py-1 bg-black text-[10px] text-slate-300 border border-white/10 rounded flex items-center gap-1.5 hover:text-white transition-all cursor-pointer"
                id="google-translate-mock-btn"
              >
                <Globe className="w-3 h-3 text-sky-400" />
                <span>Select Language</span>
                <ChevronDown className="w-2.5 h-2.5 text-slate-500" />
              </button>

              <AnimatePresence>
                {isLangOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute right-0 top-full mt-1.5 bg-black border border-white/10 rounded p-1.5 w-32 shadow-xl z-50 text-[10px] uppercase font-bold"
                  >
                    {["English", "Español", "Italiano", "Polski"].map((lang) => (
                      <button
                        key={lang}
                        onClick={() => {
                          setSelectedLanguage(lang);
                          setIsLangOpen(false);
                        }}
                        className="w-full text-left p-1.5 hover:bg-amber-500 hover:text-black rounded text-slate-300 font-bold transition-all text-[10px] block"
                      >
                        {lang}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Orange FIND US Button (Attached style) */}
            <button
              onClick={() => handleLinkClick("about", "dealer-info-section")}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 hover:from-amber-400 hover:to-orange-500 transition-all font-black uppercase text-[10px] tracking-wider rounded-sm shadow-md shadow-orange-600/20 active:scale-95 flex items-center gap-1.5 cursor-pointer"
              id="header-find-us-btn"
            >
              <MapPin className="w-3 h-3 text-slate-950 fill-current" />
              Find Us
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAIN NAV BAR (Signature Pure Black Grid Menu with custom colorized icons above texts) */}
      <div className="w-full bg-[#000000] border-b border-white/15 py-1 px-4 text-center">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Horizontal Desktop Navigation Items */}
          <nav className="hidden lg:flex items-center w-full justify-between select-none">
            <div className="flex items-center gap-1 xl:gap-2">
              {menuItems.map((item, idx) => {
                const IconComponent = item.icon;
                const isItemActive = 
                  currentPage === item.page && 
                  (item.id ? document.getElementById(item.id) !== null : true);

                return (
                  <button
                    key={idx}
                    onClick={() => handleLinkClick(item.page, item.id)}
                    className="group px-4 py-3 xl:px-5 flex flex-col items-center justify-center gap-1.5 hover:bg-white/5 transition-all text-center focus:outline-none cursor-pointer border-r border-white/5 relative"
                    id={`menu-item-${idx}`}
                  >
                    {/* Colorized Icon Above Text */}
                    <IconComponent className={`w-4 h-4 transition-transform group-hover:scale-110 ${item.color}`} />
                    
                    {/* Text Label */}
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#F3F4F6] group-hover:text-amber-400 transition-colors">
                      {item.label}
                    </span>

                    {/* Active highlight marker */}
                    {isItemActive && currentPage === item.page && (
                      <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-amber-500" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Action Group: Fleet Portal & Admin Drawer */}
            <div className="flex items-center gap-2">
              <button
                onClick={onCustomerClick}
                className="px-3.5 py-1 text-[9px] font-black uppercase tracking-widest text-amber-400 border border-amber-400/30 hover:bg-amber-400/10 rounded transition-all cursor-pointer flex items-center gap-1"
                id="navbar-parts-reorder-btn"
              >
                <span>👤 {currentCustomer ? `${currentCustomer.companyName.toUpperCase()}` : "FLEET LOGIN"}</span>
              </button>

              <button
                onClick={onAdminClick}
                className="px-3.5 py-1 text-[9px] font-black uppercase tracking-widest text-slate-400 border border-white/10 hover:bg-white/5 rounded transition-all cursor-pointer flex items-center gap-1"
                id="navbar-admin-status-btn"
              >
                <Settings className="w-2.5 h-2.5 animate-spin" style={{ animationDuration: '8s' }} />
                <span>ADMIN</span>
              </button>
            </div>
          </nav>

          {/* Quick Stats/Hours Bar on Large screens */}
          <div className="hidden xl:flex items-center gap-2 text-[10px] font-mono text-slate-400 uppercase font-bold py-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Richmond Hill bays active now</span>
          </div>

          {/* Mobile Navigation Toggle Button */}
          <div className="w-full flex items-center justify-between lg:hidden py-1">
            <span className="text-[10px] text-amber-500 uppercase font-black tracking-widest flex items-center gap-1">
              <Phone className="w-3 h-3 text-sky-400 animate-bounce" />
              Live Hotline: 800.682.5825
            </span>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-slate-300 hover:text-white rounded border border-white/10 cursor-pointer focus:outline-none flex items-center gap-1 bg-black/60"
              id="mobile-drawer-toggle-btn"
              aria-label="Open Core Navigation"
            >
              {isOpen ? <X className="w-4 h-4 text-amber-400" /> : <Menu className="w-4 h-4 text-sky-400" />}
              <span className="text-[10px] uppercase font-black text-slate-200">MENU</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. MOBILE MENU DRAWER */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="lg:hidden w-full bg-[#050B16] border-b border-white/10 text-left overflow-hidden z-40"
          >
            <div className="p-4 grid grid-cols-2 gap-2 text-center uppercase font-black tracking-widest text-[9px]">
              {menuItems.map((item, idx) => {
                const MobileIcon = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleLinkClick(item.page, item.id)}
                    className="p-3 bg-black/50 border border-white/5 rounded hover:border-amber-500 hover:bg-neutral-900 transition-all text-xs flex flex-col items-center justify-center gap-2 text-slate-200 cursor-pointer"
                    id={`mobile-grid-btn-${idx}`}
                  >
                    <MobileIcon className={`w-4 h-4 ${item.color}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="p-4 pt-1 space-y-2 text-xs uppercase font-black tracking-wider">
              {/* Fleet Link */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  onCustomerClick();
                }}
                className="w-full p-2.5 text-center bg-amber-500 text-black font-black uppercase text-xs rounded shadow-lg shadow-amber-500/10 cursor-pointer hover:bg-amber-400"
                id="mobile-fleet-login-btn"
              >
                👤 {currentCustomer ? `MY FLEET: ${currentCustomer.companyName.toUpperCase()}` : "ACCESS FLEET ACCOUNT PORTAL"}
              </button>

              {/* Admin Link */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  onAdminClick();
                }}
                className="w-full p-2 text-center bg-slate-900 text-slate-350 border border-white/10 rounded text-[10px] hover:text-white"
                id="mobile-admin-panel-btn"
              >
                ⚙ ENTERPRISE ADMIN CONSOLE
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
