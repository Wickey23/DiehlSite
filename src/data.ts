/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CommercialTruck, PartItem, ServiceDetail, Testimonial } from "./types";

// Dynamic paths to the high-quality generated assets
export const IMAGE_HERO = "/src/assets/images/diehls_hero_truck_1780493334702.png";
export const IMAGE_SERVICE_BAY = "/src/assets/images/diehls_service_bay_1780493347262.png";
export const IMAGE_PARTS = "/src/assets/images/diehls_parts_1780493360336.png";
export const IMAGE_CUSTOM_BUILD = "/src/assets/images/diehls_custom_build_1780493374866.png";

// Realistic Isuzu-specific generated assets
export const IMAGE_ISUZU_HERO = "/src/assets/images/isuzu_cab_chassis_dealer_hero_1780497284802.png";
export const IMAGE_ISUZU_FTR_REAL = "/src/assets/images/isuzu_ftr_cab_chassis_real_1780497813334.png";
export const IMAGE_ISUZU_GAS_CHASSIS = "/src/assets/images/isuzu_nrr_gas_chassis_1780497301822.png";
export const IMAGE_ISUZU_DRY_VAN = "/src/assets/images/isuzu_nrr_dry_van_body_1780497318871.png";
export const IMAGE_REAL_SERVICE_BAY = "/src/assets/images/diehls_heavy_duty_service_garage_1780497338188.png";

export const TRUCK_INVENTORY: CommercialTruck[] = [
  {
    id: "SSA01318",
    name: "2025 Isuzu Trucks F-Series FTR",
    category: "Cab & Chassis",
    condition: "New",
    year: 2025,
    make: "Isuzu Trucks",
    model: "F-Series FTR",
    engine: "5.2L Turbo Diesel 4HK1-TC 215HP",
    transmission: "Allison Automatic",
    price: 87500,
    status: "Sold",
    specs: [
      "CAB/CHASSIS ONLY FOR 24' TO 26' BODY",
      "Price shown does not include body, equipment, taxes, or fees!",
      "Fuel Type: Diesel",
      "Stock Number: SSA01318"
    ],
    imageUrl: IMAGE_ISUZU_FTR_REAL,
  },
  {
    id: "SSA00873",
    name: "2025 Isuzu Trucks F-Series FTR",
    category: "Cab & Chassis",
    condition: "New",
    year: 2025,
    make: "Isuzu Trucks",
    model: "F-Series FTR",
    engine: "5.2L Turbo Diesel 4HK1-TC 215HP",
    transmission: "Allison Automatic",
    price: 87500,
    status: "Sold",
    specs: [
      "CAB/CHASSIS ONLY FOR 24' TO 26' BODY",
      "Price shown does not include body, equipment, taxes, or fees!",
      "Stock Number: SSA00873"
    ],
    imageUrl: IMAGE_ISUZU_FTR_REAL,
  },
  {
    id: "SSA01372",
    name: "2025 Isuzu Trucks F-Series FTR",
    category: "Cab & Chassis",
    condition: "New",
    year: 2025,
    make: "Isuzu Trucks",
    model: "F-Series FTR",
    engine: "5.2L Turbo Diesel 4HK1-TC 215HP",
    transmission: "Allison Automatic",
    price: 87500,
    status: "Available",
    specs: [
      "CAB/CHASSIS ONLY FOR 24' TO 26' BODY",
      "Price shown does not include body, equipment, taxes, or fees!",
      "Fuel Type: Diesel",
      "Stock Number: SSA01372"
    ],
    imageUrl: IMAGE_ISUZU_FTR_REAL,
  },
  {
    id: "SSA-FVR-01",
    name: "2025 Isuzu Trucks F-Series FVR",
    category: "Cab & Chassis",
    condition: "New",
    year: 2025,
    make: "Isuzu Trucks",
    model: "F-Series FVR",
    engine: "Cummins B6.7 Diesel",
    transmission: "Allison 2500 RDS Automatic",
    price: 0,
    isQuoteOnly: true,
    status: "Available",
    specs: [
      "CAB/CHASSIS ONLY FOR 24' TO 26' BODY",
      "Price shown does not include body, equipment, taxes, or fees!",
      "Fuel Type: Diesel",
      "Get a Custom Quote for body configurations"
    ],
    imageUrl: IMAGE_ISUZU_FTR_REAL,
  },
  {
    id: "SSA-FVR-02",
    name: "2025 Isuzu Trucks F-Series FVR",
    category: "Cab & Chassis",
    condition: "New",
    year: 2025,
    make: "Isuzu Trucks",
    model: "F-Series FVR",
    engine: "Cummins B6.7 Diesel",
    transmission: "Allison 2500 RDS Automatic",
    price: 0,
    isQuoteOnly: true,
    status: "Available",
    specs: [
      "CAB/CHASSIS ONLY FOR 24' TO 26' BODY",
      "Price shown does not include body, equipment, taxes, or fees!",
      "Fuel Type: Diesel",
      "Get a Custom Quote for body configurations"
    ],
    imageUrl: IMAGE_ISUZU_FTR_REAL,
  },
  {
    id: "SSB03639",
    name: "2025 Isuzu Trucks F-Series FVR",
    category: "Cab & Chassis",
    condition: "New",
    year: 2025,
    make: "Isuzu Trucks",
    model: "F-Series FVR",
    engine: "Cummins B6.7 Diesel",
    transmission: "Allison 2500 RDS Automatic",
    price: 94500,
    status: "Sold",
    specs: [
      "CAB/CHASSIS ONLY FOR 24' TO 26' BODY",
      "Price shown does not include body, equipment, taxes, or fees!",
      "Fuel Type: Diesel",
      "Stock Number: SSB03639"
    ],
    imageUrl: IMAGE_ISUZU_FTR_REAL,
  },
  {
    id: "SSR00117",
    name: "2025 Isuzu Trucks N-Series Class 5 Gas NRR",
    category: "Cab & Chassis",
    condition: "New",
    year: 2025,
    make: "Isuzu Trucks",
    model: "N-Series Class 5 NRR",
    engine: "6.6L V8 Gasoline Engine",
    transmission: "Allison 1000 RDS 6-Speed Automatic",
    price: 58000,
    status: "Stock Limited",
    specs: [
      "2025 NRR Gas Cab Chassis, 176\"WB, 153.5\"CA, 19,500 GVWR",
      "Suitable for 18 - 20 foot body",
      "Price shown does not include body, equipment, taxes, or fees!",
      "Fuel Type: Gas (38.6 gal capacity)",
      "Horsepower: 350 HP"
    ],
    imageUrl: IMAGE_ISUZU_GAS_CHASSIS,
  },
  {
    id: "S7P01788",
    name: "2025 Isuzu Trucks N-Series Diesel NRR",
    category: "Cab & Chassis",
    condition: "New",
    year: 2025,
    make: "Isuzu Trucks",
    model: "N-Series NRR Diesel",
    engine: "Isuzu 5.2L Turbo Diesel",
    transmission: "Aisin A465 6-Speed Automatic",
    price: 60000,
    status: "Sold",
    specs: [
      "CAB/CHASSIS ONLY FOR 16' TO 18' BODY",
      "Price shown does not include body, equipment, taxes, or fees!",
      "Stock Number: S7P01788"
    ],
    imageUrl: IMAGE_ISUZU_GAS_CHASSIS,
  },
  {
    id: "S7P01792",
    name: "2025 Isuzu Trucks N-Series Diesel NRR",
    category: "Cab & Chassis",
    condition: "New",
    year: 2025,
    make: "Isuzu Trucks",
    model: "N-Series NRR Diesel",
    engine: "Isuzu 5.2L Turbo Diesel",
    transmission: "Aisin A465 6-Speed Automatic",
    price: 60000,
    status: "Sold",
    specs: [
      "CAB/CHASSIS ONLY FOR 18' TO 20' BODY",
      "Price shown does not include body, equipment, taxes, or fees!",
      "Fuel Type: Diesel",
      "Stock Number: S7P01792"
    ],
    imageUrl: IMAGE_ISUZU_GAS_CHASSIS,
  },
  {
    id: "S7P01733",
    name: "2025 Isuzu Trucks N-Series Diesel NRR",
    category: "Cab & Chassis",
    condition: "New",
    year: 2025,
    make: "Isuzu Trucks",
    model: "N-Series NRR Diesel",
    engine: "Isuzu 5.2L Turbo Diesel",
    transmission: "Aisin A465 6-Speed Automatic",
    price: 60000,
    status: "Sold",
    specs: [
      "For 18' to 20' body",
      "Price shown does not include body, equipment, taxes, or fees",
      "Fuel Type: Diesel",
      "Stock Number: S7P01733"
    ],
    imageUrl: IMAGE_ISUZU_GAS_CHASSIS,
  },
  {
    id: "S7P02077",
    name: "2025 Isuzu Trucks N-Series Diesel NRR",
    category: "Cab & Chassis",
    condition: "New",
    year: 2025,
    make: "Isuzu Trucks",
    model: "N-Series NRR Diesel",
    engine: "Isuzu 5.2L Turbo Diesel",
    transmission: "Aisin A465 6-Speed Automatic",
    price: 0,
    isQuoteOnly: true,
    status: "Sold",
    specs: [
      "Heavy duty cab & chassis configuration",
      "Fuel Type: Diesel",
      "Stock Number: S7P02077"
    ],
    imageUrl: IMAGE_ISUZU_GAS_CHASSIS,
  },
  {
    id: "S7P02023",
    name: "2025 Isuzu Trucks N-Series Diesel NRR",
    category: "Cab & Chassis",
    condition: "New",
    year: 2025,
    make: "Isuzu Trucks",
    model: "N-Series NRR Diesel",
    engine: "Isuzu 5.2L Turbo Diesel",
    transmission: "Aisin A465 6-Speed Automatic",
    price: 0,
    isQuoteOnly: true,
    status: "Sold",
    specs: [
      "Heavy duty cab & chassis configuration",
      "Fuel Type: Diesel",
      "Stock Number: S7P02023"
    ],
    imageUrl: IMAGE_ISUZU_GAS_CHASSIS,
  },
  {
    id: "R7310546",
    name: "2024 Isuzu Trucks N-Series Diesel NRR",
    category: "Box Truck",
    condition: "New",
    year: 2024,
    make: "Isuzu Trucks",
    model: "N-Series NRR Diesel",
    engine: "Isuzu 5.2L Turbo Diesel",
    transmission: "Aisin A465 6-Speed Automatic",
    price: 0,
    isQuoteOnly: true,
    status: "Sold",
    specs: [
      "18 FT dry Morgan Dry Van with Lift Gate",
      "Ready to work dry freight configuration",
      "Fuel Type: Diesel",
      "Stock Number: R7310546"
    ],
    imageUrl: IMAGE_ISUZU_DRY_VAN,
  },
  {
    id: "RS222584",
    name: "2024 Isuzu Trucks N-Series Gas NPR-HD",
    category: "Cab & Chassis",
    condition: "New",
    year: 2024,
    make: "Isuzu Trucks",
    model: "N-Series Gas NPR-HD",
    engine: "6.6L V8 Gasoline Engine",
    transmission: "6-Speed Automatic",
    price: 49999,
    status: "Sold",
    specs: [
      "CAB/CHASSIS ONLY FOR 16' TO 18' BODY",
      "Price shown does not include body, equipment, taxes, or fees!",
      "Fuel Type: Gas",
      "Stock Number: RS222584"
    ],
    imageUrl: IMAGE_ISUZU_GAS_CHASSIS,
  },
  {
    id: "RS222585",
    name: "2024 Isuzu Trucks N-Series Gas NPR-HD",
    category: "Cab & Chassis",
    condition: "New",
    year: 2024,
    make: "Isuzu Trucks",
    model: "N-Series Gas NPR-HD",
    engine: "6.6L V8 Gasoline Engine",
    transmission: "6-Speed Automatic",
    price: 49999,
    status: "Sold",
    specs: [
      "CAB/CHASSIS ONLY FOR 16' TO 18' BODY",
      "Price shown does not include body, equipment, taxes, or fees!",
      "Fuel Type: Gas",
      "Stock Number: RS222585"
    ],
    imageUrl: IMAGE_ISUZU_GAS_CHASSIS,
  }
];

export const SPECIALIZED_PARTS: PartItem[] = [
  {
    id: "p-01",
    sku: "HW-44109-HYD",
    name: "Commercial Hydraulic Pump Assembly",
    category: "Hydraulics",
    price: 1245.0,
    brand: "Muncie Power Products",
    stock: 5,
    compatibleModels: ["Hino L Series", "Mitsubishi FE", "Freightliner M2"],
  },
  {
    id: "p-02",
    sku: "BR-592-HEAVY",
    name: "Severe-Duty Commercial Rear Brake Pad Kit",
    category: "Braking System",
    price: 289.99,
    brand: "Bendix Commercial Vehicle",
    stock: 24,
    compatibleModels: ["Isuzu NQR/NRR", "Mitsubishi FE180", "Hino 195"],
  },
  {
    id: "p-03",
    sku: "EE-G9983-TRK",
    name: "Heavy-Duty 160A Alternator System",
    category: "Electrical",
    price: 435.5,
    brand: "Delco Remy",
    stock: 8,
    compatibleModels: ["Freightliner M2", "Hino L6", "International MV"],
  },
  {
    id: "p-04",
    sku: "FL-WF-2077",
    name: "Premium Water Separator & Fuel Filter Kit",
    category: "Filters & Fluids",
    price: 78.25,
    brand: "Fleetguard",
    stock: 45,
    compatibleModels: ["Cummins B6.7", "Detroit DD5/DD8", "Isuzu 4HK1-TC"],
  },
  {
    id: "p-05",
    sku: "EG-ISD-882",
    name: "Genuine Replacement Exhaust Manifold Gasket Set",
    category: "Engine & Drivetrain",
    price: 112.5,
    brand: "Cummins",
    stock: 12,
    compatibleModels: ["Hino L6", "Freightliner Custom", "International MV"],
  },
];

export const DEALERSHIP_SERVICES: ServiceDetail[] = [
  {
    id: "s-01",
    title: "Heavy-Duty Truck Repair & Diagnostics",
    description: "State-of-the-art computer diagnostic hookups and repairs for all major truck OEMs: Cummins, Detroit Diesel, Isuzu, and Hino. Experienced, certified commercial mechanics.",
    iconName: "Wrench",
    features: [
      "Engine overhaul & tuning",
      "DFP / SCR aftertreatment systems troubleshooting",
      "Allison & Eaton transmission repair",
      "Chassis alignment & suspension",
    ],
  },
  {
    id: "s-02",
    title: "Preventative Fleet Maintenance Programs",
    description: "Keep your delivery, utility, or construction business operating with zero downtime. Formulate scheduled DOT inspections, fluid changes, and tire checks with Diehl's.",
    iconName: "ShieldCheck",
    features: [
      "Scheduled NYS & Federal DOT Inspections",
      "Oil, lubrication & filter updates",
      "Brake efficiency adjustments & testing",
      "Battery & electrical charging system health check",
    ],
  },
  {
    id: "s-03",
    title: "Custom Truck Body Installs & Builds",
    description: "Transform standard cab-chassis commercial vehicles into specialized high-performance service trucks. From custom flatbeds to hydraulic crane outfitting.",
    iconName: "Truck",
    features: [
      "Morgan Dry Box body mounts",
      "Knapheide custom utility cabinetry",
      "Maxon/Anthony Liftgate custom retrofits",
      "Steel/Aluminum custom welding and frame adjustments",
    ],
  },
];

export const NY_TESTIMONIALS: Testimonial[] = [
  {
    id: "t-01",
    clientName: "Sal Moretti",
    companyName: "Queens Construction Co.",
    review: "Diehl’s keeps our entire fleet of 14 dump trucks and flatbeds rolling. Their local service shop right in Richmond Hill is fast, reliable, and understands that every hour our trucks are offline cost us real money.",
    rating: 5,
    date: "April 18, 2026",
  },
  {
    id: "t-02",
    clientName: "Arthur Stern",
    companyName: "Brooklyn Beverage Transport",
    review: "Purchased three custom Hino box trucks from Diehl's Truck World. They handled the tuckunder liftgate upgrades and the custom livery wrap specs perfectly. Outstanding sales team!",
    rating: 5,
    date: "May 22, 2026",
  },
  {
    id: "t-03",
    clientName: "Jessica Zhang",
    companyName: "Metro Express Cargo",
    review: "We do fleet maintenance contracts with Diehl’s. Unmatched parts stock—whenever our Hinos need a replacement alternator or brake kit, they have it on the shelves. Essential Queens local business partner.",
    rating: 5,
    date: "May 30, 2026",
  },
];
