/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { CommercialTruck, PartItem, ServiceDetail, Testimonial, Order, DealerSettings, Customer, ServiceAppointment, Lead } from "../types";
import { TRUCK_INVENTORY, SPECIALIZED_PARTS, DEALERSHIP_SERVICES, NY_TESTIMONIALS } from "../data";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  deleteDoc, 
  onSnapshot, 
  getDocFromServer
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";

interface AppContextType {
  trucks: CommercialTruck[];
  parts: PartItem[];
  services: ServiceDetail[];
  testimonials: Testimonial[];
  orders: Order[];
  settings: DealerSettings;
  customers: Customer[];
  currentCustomer: Customer | null;
  serviceAppointments: ServiceAppointment[];
  leads: Lead[];
  careers: any[];
  
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
  
  // Service Appointment Operations
  createServiceAppointment: (appData: Omit<ServiceAppointment, "id" | "date" | "status">) => ServiceAppointment;
  updateServiceAppointmentStatus: (id: string, status: ServiceAppointment["status"]) => void;
  
  // Customer Operations
  registerCustomer: (customer: Omit<Customer, "id" | "dateCreated">) => { success: boolean; error?: string; customer?: Customer };
  loginCustomer: (email: string, pass: string) => { success: boolean; error?: string; customer?: Customer };
  logoutCustomer: () => void;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (id: string) => void;
  
  // CRM Leads operations
  addLead: (lead: Omit<Lead, "id" | "date" | "status"> & { date?: string; status?: Lead["status"] }) => Lead;
  updateLeadStatus: (id: string, status: Lead["status"]) => void;
  updateLeadNotes: (id: string, notes: string) => void;
  deleteLead: (id: string) => void;
  
  // Careers operations
  addCareerApplicant: (applicant: { name: string; role: string; experience: string; pitch: string; phone: string }) => void;
  deleteCareerApplicant: (id: string) => void;
  
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

const DEFAULT_ORDERS: Order[] = [
  {
    id: "DTW-PO-49182",
    customerId: "cust-sal",
    customerName: "Sal Moretti",
    companyName: "Queens Construction Co.",
    phone: "(718) 555-8833",
    email: "sal@queensconstruction.com",
    address: "102-45 Rockaway Blvd, Ozone Park, NY 11417",
    items: [
      {
        id: "p-2",
        sku: "DTW-BRK-4022",
        name: "Premium Front Ceramic Brake Shoes",
        price: 189.95,
        quantity: 2
      },
      {
        id: "p-4",
        sku: "DTW-FIL-2191",
        name: "Fuel Water Separator Micronic Filter",
        price: 48.20,
        quantity: 3
      }
    ],
    subtotal: 524.50,
    tax: 46.52,
    shipping: 15.00,
    total: 586.02,
    paymentMethod: "Credit Card",
    cardNumberHidden: "•••• •••• •••• 9012",
    status: "In-Transit to Queens Bay",
    date: "Jun 3, 2026"
  }
];

const DEFAULT_APPOINTMENTS: ServiceAppointment[] = [
  {
    id: "DTW-APT-88201",
    customerId: "cust-sal",
    companyName: "Queens Construction Co.",
    customerName: "Sal Moretti",
    phone: "(718) 555-8833",
    email: "sal@queensconstruction.com",
    vehicleClass: "heavy",
    serviceType: "repair",
    addons: ["Official NYS DOT Safety Inspection"],
    estimatedPrice: 375,
    duration: "Same-day Diagnosed",
    status: "Bay Servicing",
    date: "Jun 5, 2026",
    timeSlot: "09:30 AM",
    bayNumber: "Bay #4",
    assignedTechnician: "Marc Davis",
    statusNotes: "Oil leak diagnosed. Replacing oil pan gasket on Freightliner M2 dump truck."
  }
];

const DEFAULT_LEADS: Lead[] = [
  {
    id: "lead-1",
    name: "Danny Miller",
    companyName: "Brooklyn Beverage Handlers",
    phone: "(718) 555-2911",
    email: "danny@brooklynbeverage.com",
    message: "Interested in dry boxes with a Maxon 2500lb liftgate, we distribute regional glass items.",
    source: "Custom Build",
    status: "New",
    date: "Jun 4, 2026",
    details: "Isuzu Class 5 NRR Gas Cab-Chassis + Morgan 26ft dry box + Maxon aluminum liftgate + Lightbar",
    notes: "Follow up about regional delivery lease rates."
  },
  {
    id: "lead-2",
    name: "Manny Ortiz",
    companyName: "Queens Landscaping Svc",
    phone: "(347) 555-8844",
    email: "manny@queenslandscapes.com",
    message: "Need a light duty flatbed with side stakes to run stone slabs across Elmhurst.",
    source: "Contact Form",
    status: "Contacted",
    date: "Jun 3, 2026",
    notes: "Emailed initial flatbed quotes. Left VM."
  },
  {
    id: "lead-3",
    name: "Abe Lincoln",
    companyName: "Abe's Logistical Freight",
    phone: "(516) 555-9011",
    email: "abe@freightnyc.com",
    message: "Need instant pricing for 4-ton diesel box trucks.",
    source: "Service Estimator",
    status: "Qualified",
    date: "Jun 1, 2026",
    details: "Class 6 Heavy duty diagnostic bay tracking setup",
    notes: "Referred to fleet finance coordinator."
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
  const [serviceAppointments, setServiceAppointments] = useState<ServiceAppointment[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [careers, setCareers] = useState<any[]>([]);

  // Validate Firestore connection on boot
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, "test", "connection"));
      } catch (error) {
        if (error instanceof Error && error.message.includes("offline")) {
          console.warn("Firestore client is starting offline. Utilizing cached local schema.");
        }
      }
    }
    testConnection();
  }, []);

  // Set up collection live snapshot listeners with inline error catching and default seeding
  useEffect(() => {
    // 1. Trucks listener
    const unsubTrucks = onSnapshot(collection(db, "trucks"), (snapshot) => {
      if (snapshot.empty) {
        TRUCK_INVENTORY.forEach(async (t) => {
          await setDoc(doc(db, "trucks", t.id), t).catch((err) => console.error("Truck seed failed", err));
        });
      } else {
        const list: CommercialTruck[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ ...docSnap.data() } as CommercialTruck);
        });
        setTrucks(list);
      }
    }, (error) => handleFirestoreError(error, OperationType.LIST, "trucks"));

    // 2. Parts listener
    const unsubParts = onSnapshot(collection(db, "parts"), (snapshot) => {
      if (snapshot.empty) {
        SPECIALIZED_PARTS.forEach(async (p) => {
          await setDoc(doc(db, "parts", p.id), p).catch((err) => console.error("Parts seed failed", err));
        });
      } else {
        const list: PartItem[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ ...docSnap.data() } as PartItem);
        });
        setParts(list);
      }
    }, (error) => handleFirestoreError(error, OperationType.LIST, "parts"));

    // 3. Services listener
    const unsubServices = onSnapshot(collection(db, "services"), (snapshot) => {
      if (snapshot.empty) {
        DEALERSHIP_SERVICES.forEach(async (s) => {
          await setDoc(doc(db, "services", s.id), s).catch((err) => console.error("Services seed failed", err));
        });
      } else {
        const list: ServiceDetail[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ ...docSnap.data() } as ServiceDetail);
        });
        setServices(list);
      }
    }, (error) => handleFirestoreError(error, OperationType.LIST, "services"));

    // 4. Testimonials listener
    const unsubTestimony = onSnapshot(collection(db, "testimonials"), (snapshot) => {
      if (snapshot.empty) {
        NY_TESTIMONIALS.forEach(async (t) => {
          await setDoc(doc(db, "testimonials", t.id), t).catch((err) => console.error("Testimonials seed failed", err));
        });
      } else {
        const list: Testimonial[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ ...docSnap.data() } as Testimonial);
        });
        setTestimonials(list);
      }
    }, (error) => handleFirestoreError(error, OperationType.LIST, "testimonials"));

    // 5. Settings listener
    const unsubSettings = onSnapshot(doc(db, "dealerSettings", "default"), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as DealerSettings);
      } else {
        setDoc(doc(db, "dealerSettings", "default"), DEFAULT_SETTINGS).catch((err) => console.error("Settings seed failed", err));
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, "dealerSettings/default"));

    // 6. Orders listener
    const unsubOrders = onSnapshot(collection(db, "orders"), (snapshot) => {
      if (snapshot.empty) {
        DEFAULT_ORDERS.forEach(async (o) => {
          await setDoc(doc(db, "orders", o.id), o).catch((err) => console.error("Orders seed failed", err));
        });
      } else {
        const list: Order[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ ...docSnap.data() } as Order);
        });
        setOrders(list);
      }
    }, (error) => handleFirestoreError(error, OperationType.LIST, "orders"));

    // 7. Customers listener
    const unsubCustomers = onSnapshot(collection(db, "customers"), (snapshot) => {
      if (snapshot.empty) {
        DEFAULT_CUSTOMERS.forEach(async (c) => {
          await setDoc(doc(db, "customers", c.id), c).catch((err) => console.error("Customers seed failed", err));
        });
      } else {
        const list: Customer[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ ...docSnap.data() } as Customer);
        });
        setCustomers(list);
      }
    }, (error) => handleFirestoreError(error, OperationType.LIST, "customers"));

    // 8. Service appointments listener
    const unsubAppointments = onSnapshot(collection(db, "serviceAppointments"), (snapshot) => {
      if (snapshot.empty) {
        DEFAULT_APPOINTMENTS.forEach(async (a) => {
          await setDoc(doc(db, "serviceAppointments", a.id), a).catch((err) => console.error("Appointments seed failed", err));
        });
      } else {
        const list: ServiceAppointment[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ ...docSnap.data() } as ServiceAppointment);
        });
        setServiceAppointments(list);
      }
    }, (error) => handleFirestoreError(error, OperationType.LIST, "serviceAppointments"));

    // 9. Leads listener
    const unsubLeads = onSnapshot(collection(db, "leads"), (snapshot) => {
      if (snapshot.empty) {
        DEFAULT_LEADS.forEach(async (l) => {
          await setDoc(doc(db, "leads", l.id), l).catch((err) => console.error("Leads seed failed", err));
        });
      } else {
        const list: Lead[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ ...docSnap.data() } as Lead);
        });
        setLeads(list);
      }
    }, (error) => handleFirestoreError(error, OperationType.LIST, "leads"));

    // 10. Careers Applications listener
    const unsubCareers = onSnapshot(collection(db, "careers"), (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ ...docSnap.data() });
      });
      setCareers(list);
    }, (error) => handleFirestoreError(error, OperationType.LIST, "careers"));

    // Load logged in account index from local storage if available
    try {
      const storedCurrentCustomer = localStorage.getItem("dtw_current_customer");
      if (storedCurrentCustomer) {
        setCurrentCustomer(JSON.parse(storedCurrentCustomer));
      }
    } catch (e) {
      console.warn("Failed to parse logged customer state. Cleared cache.", e);
    }

    return () => {
      unsubTrucks();
      unsubParts();
      unsubServices();
      unsubTestimony();
      unsubSettings();
      unsubOrders();
      unsubCustomers();
      unsubAppointments();
      unsubLeads();
      unsubCareers();
    };
  }, []);

  // Direct Firestore write operations with transactional error boundary catches
  const addTruck = async (data: Omit<CommercialTruck, "id">) => {
    const id = `truck-${Date.now()}`;
    const newTruck: CommercialTruck = { ...data, id };
    try {
      await setDoc(doc(db, "trucks", id), newTruck);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `trucks/${id}`);
    }
  };

  const updateTruck = async (updatedTruck: CommercialTruck) => {
    try {
      await setDoc(doc(db, "trucks", updatedTruck.id), updatedTruck);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `trucks/${updatedTruck.id}`);
    }
  };

  const deleteTruck = async (id: string) => {
    try {
      await deleteDoc(doc(db, "trucks", id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `trucks/${id}`);
    }
  };

  const addPart = async (data: Omit<PartItem, "id">) => {
    const id = `p-${Date.now()}`;
    const newPart: PartItem = { ...data, id };
    try {
      await setDoc(doc(db, "parts", id), newPart);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `parts/${id}`);
    }
  };

  const updatePart = async (updatedPart: PartItem) => {
    try {
      await setDoc(doc(db, "parts", updatedPart.id), updatedPart);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `parts/${updatedPart.id}`);
    }
  };

  const deletePart = async (id: string) => {
    try {
      await deleteDoc(doc(db, "parts", id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `parts/${id}`);
    }
  };

  const decrementPartStock = async (id: string, count: number) => {
    const partRef = doc(db, "parts", id);
    try {
      const snap = await getDoc(partRef);
      if (snap.exists()) {
        const curStock = snap.data().stock || 0;
        await setDoc(partRef, { ...snap.data(), stock: Math.max(0, curStock - count) });
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `parts/${id}`);
    }
  };

  const updateService = async (updatedService: ServiceDetail) => {
    try {
      await setDoc(doc(db, "services", updatedService.id), updatedService);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `services/${updatedService.id}`);
    }
  };

  const addTestimonial = async (data: Omit<Testimonial, "id" | "date">) => {
    const id = `t-${Date.now()}`;
    const newTestimonial: Testimonial = {
      ...data,
      id,
      date: new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
      })
    };
    try {
      await setDoc(doc(db, "testimonials", id), newTestimonial);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `testimonials/${id}`);
    }
  };

  const createOrder = (orderData: Omit<Order, "id" | "date" | "status">) => {
    const formattedDate = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
    const id = `DTW-PO-${Math.floor(10000 + Math.random() * 90000)}`;
    const newOrder: Order = {
      ...orderData,
      id,
      date: formattedDate,
      status: orderData.paymentMethod === "Quote Request" ? "Pending Desk Review" : "Assembling at Depot"
    };

    // Decrement stock for purchased items async
    orderData.items.forEach((item) => {
      decrementPartStock(item.id, item.quantity);
    });

    setDoc(doc(db, "orders", id), newOrder)
      .catch((e) => handleFirestoreError(e, OperationType.CREATE, `orders/${id}`));

    return newOrder;
  };

  const updateOrderStatus = async (orderId: string, status: Order["status"]) => {
    const orderRef = doc(db, "orders", orderId);
    try {
      const snap = await getDoc(orderRef);
      if (snap.exists()) {
        await setDoc(orderRef, { ...snap.data(), status });
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const deleteOrder = async (id: string) => {
    try {
      await deleteDoc(doc(db, "orders", id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `orders/${id}`);
    }
  };

  const createServiceAppointment = (appData: Omit<ServiceAppointment, "id" | "date" | "status">) => {
    const formattedDate = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
    
    const techs = ["Marc Davis", "Sal Moretti", "Junior Colon", "Abe Link"];
    const bays = ["Bay #1", "Bay #2", "Bay #3", "Bay #4", "Bay #5"];
    const assignedTech = techs[Math.floor(Math.random() * techs.length)];
    const assignedBay = bays[Math.floor(Math.random() * bays.length)];
    
    const id = `DTW-APT-${Math.floor(10000 + Math.random() * 90000)}`;
    const newApp: ServiceAppointment = {
      ...appData,
      id,
      date: formattedDate,
      status: "Scheduling",
      timeSlot: appData.timeSlot || "08:00 AM",
      bayNumber: assignedBay,
      assignedTechnician: assignedTech,
      statusNotes: "Awaiting final confirmation in available dispatch slot."
    };
    
    setDoc(doc(db, "serviceAppointments", id), newApp)
      .catch((e) => handleFirestoreError(e, OperationType.CREATE, `serviceAppointments/${id}`));

    return newApp;
  };

  const updateServiceAppointmentStatus = async (id: string, status: ServiceAppointment["status"]) => {
    const statusNotesMap: Record<ServiceAppointment["status"], string> = {
      "Scheduling": "Awaiting final confirmation in available dispatch slot.",
      "Diagnosing": "Truck loaded into bay. Connective electronic systems diagnostics sequence initiated.",
      "Parts Sourcing": "Original OEM mechanical coordinates sourced from parts depot storage shelves.",
      "Bay Servicing": "Active chassis upfit, wrenching, fluids recycle and maintenance underway.",
      "Ready for Pickup": "Service complete. Diagnostics verified clean. Ready for dispatch pickup.",
      "Archived & Dispatched": "Transaction successfully billed. Vehicle departed from Richmond Hill lot."
    };
    
    const appRef = doc(db, "serviceAppointments", id);
    try {
      const snap = await getDoc(appRef);
      if (snap.exists()) {
        await setDoc(appRef, { 
          ...snap.data(), 
          status, 
          statusNotes: statusNotesMap[status] || snap.data().statusNotes 
        });
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `serviceAppointments/${id}`);
    }
  };

  const registerCustomer = (custData: Omit<Customer, "id" | "dateCreated">) => {
    const emailLower = custData.email.toLowerCase().trim();
    const exists = customers.some((c) => c.email.toLowerCase().trim() === emailLower);
    if (exists) {
      return { success: false, error: "An account with this email address already exists." };
    }

    const id = `cust-${Date.now()}`;
    const newCustomer: Customer = {
      ...custData,
      id,
      dateCreated: new Date().toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric"
      })
    };

    setDoc(doc(db, "customers", id), newCustomer)
      .catch((e) => handleFirestoreError(e, OperationType.CREATE, `customers/${id}`));

    // Set active locally
    setCurrentCustomer(newCustomer);
    try {
      localStorage.setItem("dtw_current_customer", JSON.stringify(newCustomer));
    } catch (err) {}

    return { success: true, customer: newCustomer };
  };

  const loginCustomer = (email: string, pass: string) => {
    const emailLower = email.toLowerCase().trim();
    const user = customers.find((c) => c.email.toLowerCase().trim() === emailLower && c.password === pass);
    if (!user) {
      return { success: false, error: "Invalid email credentials or secure password details." };
    }

    setCurrentCustomer(user);
    try {
      localStorage.setItem("dtw_current_customer", JSON.stringify(user));
    } catch (err) {}
    return { success: true, customer: user };
  };

  const logoutCustomer = () => {
    setCurrentCustomer(null);
    try {
      localStorage.removeItem("dtw_current_customer");
    } catch (err) {}
  };

  const updateCustomer = async (updatedCust: Customer) => {
    try {
      await setDoc(doc(db, "customers", updatedCust.id), updatedCust);
      if (currentCustomer && currentCustomer.id === updatedCust.id) {
        setCurrentCustomer(updatedCust);
        localStorage.setItem("dtw_current_customer", JSON.stringify(updatedCust));
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `customers/${updatedCust.id}`);
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      await deleteDoc(doc(db, "customers", id));
      if (currentCustomer && currentCustomer.id === id) {
        setCurrentCustomer(null);
        localStorage.removeItem("dtw_current_customer");
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `customers/${id}`);
    }
  };

  const addLead = (leadData: Omit<Lead, "id" | "date" | "status"> & { date?: string; status?: Lead["status"] }) => {
    const formattedDate = leadData.date || new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
    const id = `lead-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newLead: Lead = {
      ...leadData,
      id,
      status: leadData.status || "New",
      date: formattedDate
    };
    
    setDoc(doc(db, "leads", id), newLead)
      .catch((e) => handleFirestoreError(e, OperationType.CREATE, `leads/${id}`));

    return newLead;
  };

  const updateLeadStatus = async (id: string, status: Lead["status"]) => {
    const leadRef = doc(db, "leads", id);
    try {
      const snap = await getDoc(leadRef);
      if (snap.exists()) {
        await setDoc(leadRef, { ...snap.data(), status });
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `leads/${id}`);
    }
  };

  const updateLeadNotes = async (id: string, notes: string) => {
    const leadRef = doc(db, "leads", id);
    try {
      const snap = await getDoc(leadRef);
      if (snap.exists()) {
        await setDoc(leadRef, { ...snap.data(), notes });
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `leads/${id}`);
    }
  };

  const deleteLead = async (id: string) => {
    try {
      await deleteDoc(doc(db, "leads", id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `leads/${id}`);
    }
  };

  const addCareerApplicant = (applicant: { name: string; role: string; experience: string; pitch: string; phone: string }) => {
    const id = `app-${Date.now()}`;
    const newApplicant = {
      ...applicant,
      id,
      date: new Date().toLocaleDateString()
    };
    setDoc(doc(db, "careers", id), newApplicant)
      .catch((e) => handleFirestoreError(e, OperationType.CREATE, `careers/${id}`));
  };

  const deleteCareerApplicant = async (id: string) => {
    try {
      await deleteDoc(doc(db, "careers", id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `careers/${id}`);
    }
  };

  const updateSettings = async (newSettings: Partial<DealerSettings>) => {
    const finalSettings = { ...settings, ...newSettings };
    try {
      await setDoc(doc(db, "dealerSettings", "default"), finalSettings);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, "dealerSettings/default");
    }
  };

  const resetToFactoryDefaults = async () => {
    // Factory reset wipes current cloud references back to catalog specifications
    try {
      const batchWipes = [
        ...trucks.map((t) => deleteDoc(doc(db, "trucks", t.id))),
        ...parts.map((p) => deleteDoc(doc(db, "parts", p.id))),
        ...services.map((s) => deleteDoc(doc(db, "services", s.id))),
        ...testimonials.map((t) => deleteDoc(doc(db, "testimonials", t.id))),
        ...orders.map((o) => deleteDoc(doc(db, "orders", o.id))),
        ...serviceAppointments.map((a) => deleteDoc(doc(db, "serviceAppointments", a.id))),
        ...leads.map((l) => deleteDoc(doc(db, "leads", l.id))),
        ...careers.map((c) => deleteDoc(doc(db, "careers", c.id))),
        ...customers.map((c) => deleteDoc(doc(db, "customers", c.id))),
        deleteDoc(doc(db, "dealerSettings", "default")),
      ];
      await Promise.all(batchWipes);
    } catch (e) {
      console.warn("Wipe sequence complete. Seeding defaults.", e);
    }
    
    // Core default seeding triggers automatically on snapshot state transitions
    setCurrentCustomer(null);
    try {
      localStorage.removeItem("dtw_current_customer");
    } catch (err) {}
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
        serviceAppointments,
        leads,
        careers,
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
        createServiceAppointment,
        updateServiceAppointmentStatus,
        registerCustomer,
        loginCustomer,
        logoutCustomer,
        updateCustomer,
        deleteCustomer,
        updateSettings,
        resetToFactoryDefaults,
        addLead,
        updateLeadStatus,
        updateLeadNotes,
        deleteLead,
        addCareerApplicant,
        deleteCareerApplicant
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
