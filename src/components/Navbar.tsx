/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Phone, MapPin, Clock, Menu, X, Truck, Settings } from "lucide-react";
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

const NAV_ITEMS = [
  { label: "Truck Sales", page: "showroom" as const, id: "inventory" },
  { label: "Municipal Sales", page: "showroom" as const, id: "customizer" },
  { label: "Parts Center", page: "parts" as const },
  { label: "Service Shop", page: "services" as const },
  { label: "Dealer Info", page: "about" as const },
  { label: "Careers", page: "about" as const },
];

export default function Navbar({ onAdminClick, onCustomerClick, currentPage, navigateTo }: NavbarProps) {
  const { settings, currentCustomer } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  const handleLinkClick = (page: DealerPage, sectionId?: string) => {
    navigateTo(page, sectionId);
    setIsOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full shadow-lg bg-[#0A1428]/95 backdrop-blur-md text-slate-100 border-b border-white/10 select-none">
      {/* Top Banner with Direct Info */}
      <div className="w-full text-xs font-bold border-b border-white/5 bg-[#050B16]">
        <div className="flex flex-col flex-wrap justify-between gap-2 px-4 py-2 mx-auto max-w-7xl md:flex-row md:items-center">
          <div className="flex gap-4 sm:items-center">
            <span className="flex items-center gap-1.5 text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-[#FBBF24]" />
              <span>{settings.address || "112-14 Atlantic Ave, Richmond Hill, NY 11418"}</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-[#FBBF24]" />
              <span>Mon-Fri: {settings.weekdayHours || "7:30 AM - 6:00 PM"} | Sat: {settings.saturdayHours || "7:30 AM - 5:00 PM"}</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href={`tel:${settings.phone}`}
              className="flex items-center gap-1.5 text-[#FBBF24] hover:text-[#FBBF24]/80 transition-colors font-black uppercase tracking-wider font-mono text-[11px]"
            >
              <Phone className="w-3.5 h-3.5 text-[#FBBF24]" />
              <span>Direct Sales & Service: {settings.phone || "(718) 555-0190"}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="px-4 py-4 mx-auto max-w-7xl">
        <div className="flex items-center justify-between">
          {/* Logo Brand */}
          <button
            onClick={() => handleLinkClick("showroom")}
            className="flex items-center gap-3.5 text-left group cursor-pointer"
            id="nav-logo-btn"
          >
            <BrandLogo size="md" />
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-5 font-black uppercase tracking-widest text-[9.5px] select-none">
            {NAV_ITEMS.map((item, idx) => {
              const isActive = currentPage === item.page;
              return (
                <button
                  key={`${item.page}-${idx}`}
                  onClick={() => handleLinkClick(item.page, item.id)}
                  className={`transition-colors relative py-1 hover:text-[#FBBF24] cursor-pointer ${
                    isActive ? "text-[#FBBF24] font-extrabold" : "text-slate-300"
                  }`}
                  id={`nav-link-${item.page}-${idx}`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#FBBF24]" />
                  )}
                </button>
              );
            })}

            <button
              onClick={onCustomerClick}
              className="text-[#FBBF24] hover:text-white transition-all border border-[#FBBF24]/30 hover:bg-[#FBBF24]/10 px-3.5 py-2.5 rounded-sm flex items-center gap-1.5 cursor-pointer font-black shrink-0"
              id="desktop-customer-portal-btn"
            >
              <span>👤 {currentCustomer ? `Hi, ${currentCustomer.name.split(' ')[0]}` : "Customer Login"}</span>
            </button>

            <button
              onClick={onAdminClick}
              className="text-slate-300 hover:text-[#FBBF24] transition-all relative border border-white/10 hover:bg-white/5 px-3.5 py-2.5 rounded-sm flex items-center gap-1.5 cursor-pointer font-black shrink-0"
              id="desktop-admin-console-btn"
            >
              <Settings className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
              <span>⚙ Admin console</span>
            </button>

            <button
              onClick={() => handleLinkClick("showroom", "contact")}
              className="px-5 py-3 font-black uppercase tracking-widest bg-[#FBBF24] text-[#0A1428] hover:bg-[#FBBF24]/90 transition-all shadow-[0_0_15px_rgba(251,191,36,0.2)] active:scale-95 cursor-pointer text-[10px]"
              id="nav-contact-btn"
            >
              Get Quote / Booking
            </button>
          </nav>

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-slate-300 hover:text-white rounded focus:outline-none lg:hidden border border-white/10 cursor-pointer"
            id="mobile-menu-toggle"
            aria-label="Toggle navigation menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="lg:hidden border-t border-white/10 bg-[#0A1428] overflow-hidden"
          >
            <div className="px-5 py-6 space-y-4 flex flex-col font-black uppercase tracking-wider text-xs">
              {NAV_ITEMS.map((item, idx) => (
                <button
                  key={`${item.page}-${idx}`}
                  onClick={() => handleLinkClick(item.page, item.id)}
                  className="w-full text-left py-3 text-slate-200 hover:text-[#FBBF24] transition-colors border-b border-white/5 cursor-pointer animate-fade-in"
                  id={`mobile-nav-link-${item.page}-${idx}`}
                >
                  {item.label}
                </button>
              ))}

              <button
                onClick={() => {
                  setIsOpen(false);
                  onCustomerClick();
                }}
                className="w-full text-left py-3 text-[#FBBF24] hover:text-white transition-colors border-b border-white/5 font-black uppercase flex items-center gap-1.5 cursor-pointer"
                id="mobile-nav-link-customer"
              >
                <span>👤 {currentCustomer ? `MY FLEET PORTAL (${currentCustomer.companyName.toUpperCase()})` : "CUSTOMER LOGIN / REGISTER"}</span>
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  onAdminClick();
                }}
                className="w-full text-left py-3 text-slate-300 hover:text-white transition-colors border-b border-white/5 font-black uppercase flex items-center gap-1.5 cursor-pointer"
                id="mobile-nav-link-admin"
              >
                <span>⚙ ENTERPRISE ADMIN CONSOLE</span>
              </button>

              <div className="pt-4 flex flex-col gap-4 font-black">
                <a
                  href={`tel:${settings.phone}`}
                  className="flex items-center justify-center gap-2 p-3 bg-[#050B16] text-[#FBBF24] border border-white/10 rounded font-black text-center"
                  id="mobile-call-btn"
                >
                  <Phone className="w-4 h-4 text-[#FBBF24]" />
                  <span>Call {settings.phone || "(718) 555-0190"}</span>
                </a>
                <button
                  onClick={() => handleLinkClick("showroom", "contact")}
                  className="w-full p-3 uppercase tracking-widest bg-[#FBBF24] text-[#0A1428] rounded text-center hover:bg-[#FBBF24]/90 text-xs shadow-md shadow-[#FBBF24]/10 font-bold cursor-pointer"
                  id="mobile-quote-btn"
                >
                  Schedule Service
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
