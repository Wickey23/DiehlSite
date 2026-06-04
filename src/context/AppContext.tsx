/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { CommercialTruck, PartItem, ServiceDetail, Testimonial, Order, DealerSettings, Customer } from "../types";
import { TRUCK_INVENTORY, SPECIALIZED_PARTS, DEALERSHIP_SERVICES, NY_TESTIMONIALS } from "../data";

interface AppContextType {
  trucks: CommercialTruck[];
  parts: PartItem[];
  services: ServiceDetail[];
  testimonials: Testimonial[];
  orders: Order[];
  settings: DealerSettings;
  customers: Customer[];
  currentCustomer: Customer | null;
  
  // Truck CRUD
  addTruck: (truck: Omit<CommercialTruck, "id">) => void;
  updateTruck: (truck: CommercialTruck) => void;
  deleteTruck: (id: string) => void;
  
  // Parts CRUD
  addPart: (part: Omit<PartItem, "id">) => void;
  updatePart: (part: PartItem) => void;
  deletePart: (id: string) => void;
  decrementPartStock: (id: string, count: number) => void;
  
  // Services CRUD
  updateService: (service: ServiceDetail) => void;
  
  // Testimonials CRUD
  addTestimonial: (testimonial: Omit<Testimonial, "id" | "date">) => void;
  
  // Order Operations
  createOrder: (order: Omit<Order, "id" | "date" | "status">) => Order;
  updateOrderStatus: (orderId: string, status: Order["status"]) => void;
  deleteOrder: (id: string) => void;
  
  // Customer Operations
  registerCustomer: (customer: Omit<Customer, "id" | "dateCreated">) => { success: boolean; error?: string; customer?: Customer };
  loginCustomer: (email: string, pass: string) => { success: boolean; error?: string; customer?: Customer };
  logoutCustomer: () => void;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (id: string) => void;
  
  // Settings Update
  updateSettings: (settings: Partial<DealerSettings>) => void;
  
  // System Reset
  resetToFactoryDefaults: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_SETTINGS: DealerSettings = {
  phone: "(718) 441-0900",
  partsPhone: "(718) 441-0900 (Ext 2)",
  towPhone: "(718) 441-0900",
  address: "112-14 Atlantic Ave, Richmond Hill, NY 11418",
  weekdayHours: "7:30 AM - 6:00 PM",
  saturdayHours: "7:30 AM - 2:00 PM",
  promoBanner: "★ DIEHL'S TRUCK WORLD • EST. 1982 • AUTHORIZED NEW YORK ISUZU COMMERCIAL VEHICLE PARTNER ★",
  heroHeading: "DIEHL’S TRUCK WORLD: NYC’S FLEET LIFELINE",
  heroSubheading: "Authorized Isuzu Commercial Truck Dealer on Atlantic Avenue since 1982. Custom vocational upfit programs & heavy-duty repair services.",
};

const DEFAULT_CUSTOMERS: Customer[] = [
  {
    id: "cust-sal",
    name: "Sal Moretti",
    companyName: "Queens Construction Co.",
    phone: "(718) 555-8833",
    email: "sal@queensconstruction.com",
    password: "password",
    address: "102-45 Rockaway Blvd, Ozone Park, NY 11417",
    dateCreated: "04/18/2026"
  }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [trucks, setTrucks] = useState<CommercialTruck[]>([]);
  const [parts, setParts] = useState<PartItem[]>([]);
  const [services, setServices] = useState<ServiceDetail[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<DealerSettings>(DEFAULT_SETTINGS);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);

  // Load and populate on initial render
  useEffect(() => {
    try {
      const storedTrucks = localStorage.getItem("dtw_trucks");
      let parsedTrucks = storedTrucks ? JSON.parse(storedTrucks) : [];
      const hasCorrectTrucks = parsedTrucks.some((t: any) => t.id === "SSA01318");
      
      if (storedTrucks && hasCorrectTrucks) {
        // Upgrade image list with our clean Isuzu URLs to bust stale storage cache
        const upgradedTrucks = parsedTrucks.map((pt: any) => {
          const fresh = TRUCK_INVENTORY.find(item => item.id === pt.id);
          return fresh ? { ...pt, imageUrl: fresh.imageUrl } : pt;
        });
        setTrucks(upgradedTrucks);
        localStorage.setItem("dtw_trucks", JSON.stringify(upgradedTrucks));
      } else {
        setTrucks(TRUCK_INVENTORY);
        localStorage.setItem("dtw_trucks", JSON.stringify(TRUCK_INVENTORY));
      }

      const storedParts = localStorage.getItem("dtw_parts");
      if (storedParts) setParts(JSON.parse(storedParts));
      else {
        setParts(SPECIALIZED_PARTS);
        localStorage.setItem("dtw_parts", JSON.stringify(SPECIALIZED_PARTS));
      }

      const storedServices = localStorage.getItem("dtw_services");
      if (storedServices) setServices(JSON.parse(storedServices));
      else {
        setServices(DEALERSHIP_SERVICES);
        localStorage.setItem("dtw_services", JSON.stringify(DEALERSHIP_SERVICES));
      }

      const storedTestimonials = localStorage.getItem("dtw_testimonials");
      if (storedTestimonials) setTestimonials(JSON.parse(storedTestimonials));
      else {
        setTestimonials(NY_TESTIMONIALS);
        localStorage.setItem("dtw_testimonials", JSON.stringify(NY_TESTIMONIALS));
      }

      const storedSettings = localStorage.getItem("dtw_dealer_settings");
      if (storedSettings) setSettings(JSON.parse(storedSettings));
      else {
        setSettings(DEFAULT_SETTINGS);
        localStorage.setItem("dtw_dealer_settings", JSON.stringify(DEFAULT_SETTINGS));
      }

      const storedOrders = localStorage.getItem("dtw_orders");
      if (storedOrders) setOrders(JSON.parse(storedOrders));
      else {
        setOrders([]);
        localStorage.setItem("dtw_orders", JSON.stringify([]));
      }

      const storedCustomers = localStorage.getItem("dtw_customers");
      if (storedCustomers) setCustomers(JSON.parse(storedCustomers));
      else {
        setCustomers(DEFAULT_CUSTOMERS);
        localStorage.setItem("dtw_customers", JSON.stringify(DEFAULT_CUSTOMERS));
      }

      const storedCurrentCustomer = localStorage.getItem("dtw_current_customer");
      if (storedCurrentCustomer) setCurrentCustomer(JSON.parse(storedCurrentCustomer));
    } catch (e) {
      console.error("Local storage error:", e);
      // Fallback
      setTrucks(TRUCK_INVENTORY);
      setParts(SPECIALIZED_PARTS);
      setServices(DEALERSHIP_SERVICES);
      setTestimonials(NY_TESTIMONIALS);
      setSettings(DEFAULT_SETTINGS);
      setCustomers(DEFAULT_CUSTOMERS);
      setOrders([]);
    }
  }, []);

  // Helper to persist standard values
  const saveToStorage = (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`Failed to save ${key} in localstorage`, e);
    }
  };

  // Truck CRUD operations
  const addTruck = (data: Omit<CommercialTruck, "id">) => {
    const newTruck: CommercialTruck = {
      ...data,
      id: `truck-${Date.now()}`
    };
    const updated = [newTruck, ...trucks];
    setTrucks(updated);
    saveToStorage("dtw_trucks", updated);
  };

  const updateTruck = (updatedTruck: CommercialTruck) => {
    const updated = trucks.map((t) => (t.id === updatedTruck.id ? updatedTruck : t));
    setTrucks(updated);
    saveToStorage("dtw_trucks", updated);
  };

  const deleteTruck = (id: string) => {
    const updated = trucks.filter((t) => t.id !== id);
    setTrucks(updated);
    saveToStorage("dtw_trucks", updated);
  };

  // Parts CRUD operations
  const addPart = (data: Omit<PartItem, "id">) => {
    const newPart: PartItem = {
      ...data,
      id: `p-${Date.now()}`
    };
    const updated = [newPart, ...parts];
    setParts(updated);
    saveToStorage("dtw_parts", updated);
  };

  const updatePart = (updatedPart: PartItem) => {
    const updated = parts.map((p) => (p.id === updatedPart.id ? updatedPart : p));
    setParts(updated);
    saveToStorage("dtw_parts", updated);
  };

  const deletePart = (id: string) => {
    const updated = parts.filter((p) => p.id !== id);
    setParts(updated);
    saveToStorage("dtw_parts", updated);
  };

  const decrementPartStock = (id: string, count: number) => {
    const updated = parts.map((p) => {
      if (p.id === id) {
        return { ...p, stock: Math.max(0, p.stock - count) };
      }
      return p;
    });
    setParts(updated);
    saveToStorage("dtw_parts", updated);
  };

  // Services
  const updateService = (updatedService: ServiceDetail) => {
    const updated = services.map((s) => (s.id === updatedService.id ? updatedService : s));
    setServices(updated);
    saveToStorage("dtw_services", updated);
  };

  // Testimonials
  const addTestimonial = (data: Omit<Testimonial, "id" | "date">) => {
    const newTestimonial: Testimonial = {
      ...data,
      id: `t-${Date.now()}`,
      date: new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
      })
    };
    const updated = [newTestimonial, ...testimonials];
    setTestimonials(updated);
    saveToStorage("dtw_testimonials", updated);
  };

  // Orders
  const createOrder = (orderData: Omit<Order, "id" | "date" | "status">) => {
    const formattedDate = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
    const newOrder: Order = {
      ...orderData,
      id: `DTW-PO-${Math.floor(10000 + Math.random() * 90000)}`,
      date: formattedDate,
      status: orderData.paymentMethod === "Quote Request" ? "Pending Desk Review" : "Assembling at Depot"
    };

    // Decrement stock for purchased items
    orderData.items.forEach(item => {
      decrementPartStock(item.id, item.quantity);
    });

    const updated = [newOrder, ...orders];
    setOrders(updated);
    saveToStorage("dtw_orders", updated);
    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: Order["status"]) => {
    const updated = orders.map((o) => (o.id === orderId ? { ...o, status } : o));
    setOrders(updated);
    saveToStorage("dtw_orders", updated);
  };

  const deleteOrder = (id: string) => {
    const updated = orders.filter((o) => o.id !== id);
    setOrders(updated);
    saveToStorage("dtw_orders", updated);
  };

  // Customer Operations
  const registerCustomer = (custData: Omit<Customer, "id" | "dateCreated">) => {
    const emailLower = custData.email.toLowerCase().trim();
    const exists = customers.some(c => c.email.toLowerCase().trim() === emailLower);
    if (exists) {
      return { success: false, error: "An account with this email address already exists." };
    }

    const newCustomer: Customer = {
      ...custData,
      id: `cust-${Date.now()}`,
      dateCreated: new Date().toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric"
      })
    };

    const updated = [...customers, newCustomer];
    setCustomers(updated);
    saveToStorage("dtw_customers", updated);

    // Auto login
    setCurrentCustomer(newCustomer);
    saveToStorage("dtw_current_customer", newCustomer);

    return { success: true, customer: newCustomer };
  };

  const loginCustomer = (email: string, pass: string) => {
    const emailLower = email.toLowerCase().trim();
    const user = customers.find(c => c.email.toLowerCase().trim() === emailLower && c.password === pass);
    if (!user) {
      return { success: false, error: "Invalid email credentials or secure password details." };
    }

    setCurrentCustomer(user);
    saveToStorage("dtw_current_customer", user);
    return { success: true, customer: user };
  };

  const logoutCustomer = () => {
    setCurrentCustomer(null);
    localStorage.removeItem("dtw_current_customer");
  };

  const updateCustomer = (updatedCust: Customer) => {
    const updated = customers.map(c => c.id === updatedCust.id ? updatedCust : c);
    setCustomers(updated);
    saveToStorage("dtw_customers", updated);

    if (currentCustomer && currentCustomer.id === updatedCust.id) {
      setCurrentCustomer(updatedCust);
      saveToStorage("dtw_current_customer", updatedCust);
    }
  };

  const deleteCustomer = (id: string) => {
    const updated = customers.filter(c => c.id !== id);
    setCustomers(updated);
    saveToStorage("dtw_customers", updated);

    if (currentCustomer && currentCustomer.id === id) {
      setCurrentCustomer(null);
      localStorage.removeItem("dtw_current_customer");
    }
  };

  // Settings
  const updateSettings = (newSettings: Partial<DealerSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    saveToStorage("dtw_dealer_settings", updated);
  };

  // Factory reset
  const resetToFactoryDefaults = () => {
    localStorage.removeItem("dtw_trucks");
    localStorage.removeItem("dtw_parts");
    localStorage.removeItem("dtw_services");
    localStorage.removeItem("dtw_testimonials");
    localStorage.removeItem("dtw_dealer_settings");
    localStorage.removeItem("dtw_orders");
    localStorage.removeItem("dtw_customers");
    localStorage.removeItem("dtw_current_customer");

    setTrucks(TRUCK_INVENTORY);
    setParts(SPECIALIZED_PARTS);
    setServices(DEALERSHIP_SERVICES);
    setTestimonials(NY_TESTIMONIALS);
    setSettings(DEFAULT_SETTINGS);
    setCustomers(DEFAULT_CUSTOMERS);
    setOrders([]);
    setCurrentCustomer(null);
    
    // Save defaults back
    localStorage.setItem("dtw_trucks", JSON.stringify(TRUCK_INVENTORY));
    localStorage.setItem("dtw_parts", JSON.stringify(SPECIALIZED_PARTS));
    localStorage.setItem("dtw_services", JSON.stringify(DEALERSHIP_SERVICES));
    localStorage.setItem("dtw_testimonials", JSON.stringify(NY_TESTIMONIALS));
    localStorage.setItem("dtw_dealer_settings", JSON.stringify(DEFAULT_SETTINGS));
    localStorage.setItem("dtw_customers", JSON.stringify(DEFAULT_CUSTOMERS));
    localStorage.setItem("dtw_orders", JSON.stringify([]));
  };

  return (
    <AppContext.Provider
      value={{
        trucks,
        parts,
        services,
        testimonials,
        orders,
        settings,
        customers,
        currentCustomer,
        addTruck,
        updateTruck,
        deleteTruck,
        addPart,
        updatePart,
        deletePart,
        decrementPartStock,
        updateService,
        addTestimonial,
        createOrder,
        updateOrderStatus,
        deleteOrder,
        registerCustomer,
        loginCustomer,
        logoutCustomer,
        updateCustomer,
        deleteCustomer,
        updateSettings,
        resetToFactoryDefaults
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used inside an AppProvider");
  }
  return context;
};
