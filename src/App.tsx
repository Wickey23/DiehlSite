/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Inventory from "./components/Inventory";
import OperationsHub from "./components/OperationsHub";
import BuildCustomizer from "./components/BuildCustomizer";
import PartsCatalog from "./components/PartsCatalog";
import Services from "./components/Services";
import AboutAndLocal from "./components/AboutAndLocal";
import ContactSection from "./components/ContactSection";
import Footer from "./components/Footer";
import AdminDashboard from "./components/AdminDashboard";
import CustomerDashboard from "./components/CustomerDashboard";

export type DealerPage = "showroom" | "parts" | "services" | "about";

export default function App() {
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isCustomerOpen, setIsCustomerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<DealerPage>("showroom");

  const navigateTo = (page: DealerPage, sectionId?: string) => {
    setCurrentPage(page);
    setTimeout(() => {
      if (sectionId) {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
          return;
        }
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased overflow-x-clip selection:bg-amber-500 selection:text-slate-950">
      {/* Brand Navigation */}
      <Navbar 
        onAdminClick={() => setIsAdminOpen(true)} 
        onCustomerClick={() => setIsCustomerOpen(true)} 
        currentPage={currentPage}
        navigateTo={navigateTo}
      />

      <main className="min-h-[60vh]">
        {currentPage === "showroom" && (
          <>
            {/* Hero Showcase header with interactive slideshow */}
            <Hero onNavigate={navigateTo} />
            
            {/* Featured inventories with filters and specific real Isuzu photos */}
            <Inventory />

            {/* Live Operations & traffic dashboard for fleet managers */}
            <OperationsHub />
            
            {/* Specialized custom fleet & vocational body configurer */}
            <BuildCustomizer />
          </>
        )}

        {currentPage === "parts" && (
          <div className="animate-fade-in">
            {/* Searchable OEM Parts stock center */}
            <PartsCatalog />
          </div>
        )}

        {currentPage === "services" && (
          <div className="animate-fade-in">
            {/* Heavy-duty 12-bay garage estimators and rates */}
            <Services />
          </div>
        )}

        {currentPage === "about" && (
          <div className="animate-fade-in">
            {/* Store details, directions coordinates, and career applications */}
            <AboutAndLocal />
          </div>
        )}
      </main>

      {/* Quick response dispatch emergency callback and messaging */}
      <ContactSection />

      {/* Brand informational Footer */}
      <Footer navigateTo={navigateTo} />

      {/* Admin Dashboard Overlay Modal */}
      {isAdminOpen && (
        <AdminDashboard onClose={() => setIsAdminOpen(false)} />
      )}

      {/* Customer Account Dashboard Modal */}
      {isCustomerOpen && (
        <CustomerDashboard onClose={() => setIsCustomerOpen(false)} />
      )}
    </div>
  );
}
