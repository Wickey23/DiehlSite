/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Truck, Clock, ShieldCheck, Mail, MapPin } from "lucide-react";
import BrandLogo from "./BrandLogo";
import { DealerPage } from "../App";

interface FooterProps {
  navigateTo: (page: DealerPage, sectionId?: string) => void;
}

export default function Footer({ navigateTo }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-[#050B16] text-slate-400 text-xs sm:text-sm border-t border-white/10 py-12 select-none">
      <div className="px-4 mx-auto max-w-7xl space-y-12">
        {/* Upper Column layout */}
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          {/* Brand Column */}
          <div className="space-y-4">
            <button
              onClick={() => navigateTo("showroom")}
              className="flex items-center gap-3 text-left group cursor-pointer"
            >
              <BrandLogo size="sm" />
            </button>
            <p className="text-xs text-slate-500 leading-relaxed font-bold font-sans uppercase tracking-wider">
              Richmond Hill’s premier destination for heavy and medium-weight commercial transportation, OEM parts inventories, and specialized utility builds since 1982.
            </p>
          </div>

          {/* Quick Links Column */}
          <div className="space-y-3.5">
            <h4 className="text-white text-xs font-black uppercase tracking-[0.2em]">// Quick Navigation</h4>
            <ul className="space-y-2 text-xs font-bold uppercase tracking-wider">
              {[
                { label: "Dealership Inventory", page: "showroom" as const, id: "inventory" },
                { label: "Custom Build Estimator", page: "showroom" as const, id: "customizer" },
                { label: "Parts Catalog & RFQ", page: "parts" as const },
                { label: "Fleet Services Repair", page: "services" as const },
                { label: "About Diehl's", page: "about" as const }
              ].map((link, idx) => (
                <li key={idx}>
                  <button
                    onClick={() => navigateTo(link.page, link.id)}
                    className="hover:text-[#FBBF24] transition-colors cursor-pointer text-left text-[11px]"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Business Hours */}
          <div className="space-y-3.5">
            <h4 className="text-white text-xs font-black uppercase tracking-[0.2em] flex items-center gap-1.5 font-sans">
              <Clock className="w-4.5 h-4.5 text-[#FBBF24]" />
              <span>// Operating Hours</span>
            </h4>
            <div className="text-xs space-y-1 text-slate-400 font-bold font-mono uppercase tracking-wider">
              <div className="flex justify-between">
                <span>Mon - Fri:</span>
                <span className="text-white">7:30 AM - 6:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span>Sat:</span>
                <span className="text-white">7:30 AM - 5:00 PM</span>
              </div>
              <div className="flex justify-between py-1 border-t border-white/5">
                <span>Sun Service:</span>
                <span className="text-red-400 uppercase font-black text-[9px] border border-red-900/35 px-1 bg-red-950/10 rounded">EMERGENCY ONLY</span>
              </div>
            </div>
          </div>

          {/* NYC Compliance Licensing */}
          <div className="space-y-3.5">
            <h4 className="text-white text-xs font-black uppercase tracking-[0.2em]">// Queens Licensing</h4>
            <div className="space-y-2 text-xs text-slate-450 font-bold uppercase tracking-wider leading-relaxed">
              <p>Certified NYS station for Heavy Commercial vehicle safety audits.</p>
              <div className="pt-2 flex items-center gap-1.5 text-emerald-450 text-[10px] font-black uppercase tracking-widest">
                <ShieldCheck className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
                <span>NYS Station ID: 718-922</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lower Disclaimer row */}
        <div className="pt-6 border-t border-white/5 text-slate-600 text-[11px] font-black uppercase tracking-wider flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          <p>© {currentYear} Diehl’s Truck World. All Rights Reserved. Richmond Hill, NY.</p>
          <p className="text-[#FBBF24] font-black uppercase tracking-[0.15em] font-mono">
            ★ OVER 44 YEARS OF TRUCKING EXCELLENCE IN QUEENS ★
          </p>
        </div>
      </div>
    </footer>
  );
}
