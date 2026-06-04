/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CommercialTruck {
  id: string;
  name: string;
  category: "Box Truck" | "Flatbed" | "Dump Truck" | "Reefer" | "Utility" | "Cab & Chassis";
  condition: "New" | "Pre-Owned";
  year: number;
  make: string;
  model: string;
  engine: string;
  transmission: string;
  mileage?: number;
  price: number;
  status?: "Available" | "Sold" | "Stock Limited";
  isQuoteOnly?: boolean;
  specs: string[];
  imageUrl: string;
}

export interface PartItem {
  id: string;
  sku: string;
  name: string;
  category: "Engine & Drivetrain" | "Braking System" | "Hydraulics" | "Electrical" | "Filters & Fluids";
  price: number;
  brand: string;
  stock: number;
  compatibleModels: string[];
}

export interface ServiceDetail {
  id: string;
  title: string;
  description: string;
  iconName: string;
  features: string[];
}

export interface Testimonial {
  id: string;
  clientName: string;
  companyName: string;
  review: string;
  rating: number;
  date: string;
}

export interface BuildOption {
  chassis: "Medium Duty" | "Heavy Duty" | "Super Duty";
  bodyType: "Flatbed" | "Service Utility" | "Dump Box" | "Stake Body" | "Dry Box";
  accessories: string[];
  color: string;
}

export interface OrderItem {
  id: string;
  sku: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  customerId?: string;
  customerName: string;
  companyName: string;
  phone: string;
  email: string;
  address: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  paymentMethod: "Fleet Card" | "Credit Card" | "Quote Request";
  cardNumberHidden?: string;
  status: "Pending Desk Review" | "Assembling at Depot" | "In-Transit to Queens Bay" | "Ready for Pickup" | "Dispatched & Completed";
  date: string;
}

export interface Customer {
  id: string;
  name: string;
  companyName: string;
  phone: string;
  email: string;
  password?: string; // Optional client-side credentials
  address?: string;
  dateCreated: string;
}

export interface DealerSettings {
  phone: string;
  partsPhone: string;
  towPhone: string;
  address: string;
  weekdayHours: string;
  saturdayHours: string;
  promoBanner: string;
  heroHeading: string;
  heroSubheading: string;
}

export interface ServiceAppointment {
  id: string;
  customerId?: string;
  companyName: string;
  customerName: string;
  phone: string;
  email: string;
  vehicleClass: "medium" | "heavy";
  serviceType: "pm" | "repair" | "body";
  addons: string[];
  estimatedPrice: number;
  duration: string;
  status: "Scheduling" | "Diagnosing" | "Parts Sourcing" | "Bay Servicing" | "Ready for Pickup" | "Archived & Dispatched";
  date: string;
  timeSlot?: string;
  bayNumber?: string;
  assignedTechnician?: string;
  statusNotes?: string;
}

export interface Lead {
  id: string;
  name: string;
  companyName: string;
  phone: string;
  email: string;
  message?: string;
  source: "Contact Form" | "Custom Build" | "Service Estimator" | "Parts RFQ" | "Quick Inquiry";
  status: "New" | "Contacted" | "Qualified" | "Lost" | "Converted";
  date: string;
  details?: string;
  notes?: string;
}


