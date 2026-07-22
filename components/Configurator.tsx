"use client";

import React, { createElement, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import AlignmentAdmin from "./AlignmentAdmin";
import InteriorCabViewer from "./InteriorCabViewer";
import ModularTruckViewer, { DEFAULT_ISUZU_BODY_MOUNT, TruckMountConfig } from "./ModularTruckViewer";
import PlaceholderTruckViewer from "./PlaceholderTruckViewer";
import { AccessoryPlacement, AccessorySlotConfig, AssemblyMountRecord, AttachmentPointConfig, DEFAULT_ACCESSORY_SLOTS, DEFAULT_ATTACHMENT_POINTS, DEFAULT_INTERIOR_CAMERA, DEFAULT_REAL_SCALE, InteriorCameraConfig, ModelAssetRecord, RealScaleConfig } from "./modelRegistry";
import { freightlinerAccessories, freightlinerAccessoryCompatible, freightlinerAllBodies, freightlinerBodyCategories, freightlinerBodyCategory, freightlinerBodyFit, freightlinerCatalogEntryCount, priorityFreightlinerBodies } from "./freightlinerCatalog";
import { formatFeetAndInches, formatInches, getTruckSizing } from "./sizingEngine";

type BrandId = "isuzu" | "freightliner" | "western-star";
type ViewMode = "builder" | "sales" | "alignment";
type TruckView = "exterior" | "interior";
type PrintViewName = "front" | "rear" | "left" | "right" | "top";
type PrintViewSet = Partial<Record<PrintViewName, string>>;

type TruckModel = {
  id: string;
  name: string;
  className: string;
  gvwr: string;
  hp: string;
  torque: string;
  description: string;
  applications: string[];
  engines: string[];
  transmissions: string[];
  cabs: string[];
  wheelbases: string[];
  axles: string[];
  bodies: string[];
  baseEstimate: number;
};

type Brand = {
  id: BrandId;
  name: string;
  eyebrow: string;
  description: string;
  accent: string;
  visual: "isuzu-glb" | "freightliner-glb" | "heavy-glb";
  models: TruckModel[];
};

type Lead = {
  id: string;
  customer: string;
  company: string;
  brand: string;
  model: string;
  body: string;
  value: number;
  fit: number;
  status: string;
};

type BuildDraft = {
  version: 2;
  savedAt: string;
  step: number;
  brandId: BrandId;
  modelId: string;
  body: string;
  bodyVariantId: string;
  cab: string;
  wheelbase: string;
  axle: string;
  engine: string;
  transmission: string;
  suspension: string;
  colorName: string;
  bodyColorName?: string;
  completionSignatures?: Record<string, string>;
  selectedPackage: string;
  options: string[];
  accessoryPlacements: AccessoryPlacement[];
  job?: JobProfile;
};

type JobProfile = {
  vocation: string;
  payload: string;
  route: string;
  crew: string;
  fuel: string;
  quantity: string;
  delivery: string;
  notes: string;
};

type BodyVariant = {
  id: string;
  label: string;
  detail: string;
  lengthFt?: number;
  source: string;
};

const bodyCatalog: Record<string, { price: number; description: string; icon: string }> = {
  "Cab & Chassis": { price: 0, description: "Bare chassis for a custom upfit", icon: "＋" },
  "Dry Van Box": { price: 15400, description: "Parcel, retail, furniture and general delivery", icon: "▣" },
  "Refrigerated Box": { price: 31800, description: "Food service, floral, medical and cold chain", icon: "❄" },
  "Stake Body": { price: 13900, description: "Landscape, nursery, lumber and materials", icon: "▥" },
  Flatbed: { price: 12500, description: "Equipment, pallets and building materials", icon: "▰" },
  "Landscape Dump": { price: 19800, description: "Landscape debris and bulk materials", icon: "◩" },
  "Dump Body": { price: 29500, description: "Construction, excavation and municipal work", icon: "◢" },
  "Utility Body": { price: 26800, description: "Electrical, service and municipal fleets", icon: "▦" },
  Rollback: { price: 38900, description: "Vehicle transport, recovery and towing", icon: "↗" },
  "Vacuum / Tank": { price: 86500, description: "Sewer, industrial, environmental and municipal", icon: "◉" },
  Mixer: { price: 112000, description: "Ready-mix concrete and infrastructure", icon: "⬡" },
  Crane: { price: 134000, description: "Boom, material handling and utility work", icon: "⌁" },
  Refuse: { price: 148000, description: "Front, rear and side-loader collection", icon: "▤" },
  Tractor: { price: 18500, description: "Regional, highway and heavy-haul tractor", icon: "↔" }
};

const isuzuBodyCategories: Record<string, string[]> = {
  "Cargo & delivery": ["Standard dry box / van body", "Advantic composite box", "Aluminum dry van", "FRP dry van", "High-cube delivery box", "Parcel / home-delivery body", "Moving / furniture van", "Walk-through delivery body", "Curtain-side body", "Insulated non-refrigerated box", "Refrigerated box", "Frozen-food box", "Multi-temperature reefer", "Side-load beverage body", "Refrigerated beverage / keg body"],
  "Flatbed & landscape": ["Standard steel flatbed", "Aluminum flatbed", "Stake body with removable racks", "Landscape rack body", "Contractor platform body", "Drop-side platform", "Dovetail landscape body", "Beavertail equipment body", "Landscape dump", "Chipper / arborist dump", "Leaf collection body", "Flexible / removable-side body"],
  "Dump & construction": ["Light-duty dump", "Contractor dump", "Masonry dump", "Drop-side dump", "Three-way dump", "Municipal dump", "Grain body", "Asphalt hot box", "Concrete mixer", "Vacuum excavation body", "Equipment hauler"],
  "Utility & service": ["Open-top utility body", "Enclosed utility body", "Electrician service body", "Plumbing service body", "HVAC service body", "Mobile service / workshop body", "Mechanics body", "Mechanics body with hydraulic crane", "Flatbed with knuckle-boom crane", "Lube / maintenance body", "Welding body", "Pest-control body", "Glass-rack / glazier body", "Line-service body", "Tire-service body"],
  "Towing & interchangeable": ["Steel rollback / car carrier", "Aluminum rollback / car carrier", "Rollback with wheel lift", "Conventional wrecker", "Integrated wrecker", "Repo / snatch truck", "Multi-car transporter", "Hooklift", "Cable roll-off", "Hooklift dumpster", "Hooklift flatbed", "Hooklift landscape container", "Hooklift chipper container"],
  "Municipal & environmental": ["Rear-load refuse body", "Side-load refuse body", "Satellite garbage truck", "Recycling collection body", "Street sweeper", "Vacuum sweeper", "Sewer jetter", "Catch-basin cleaner", "Water tank / sprayer", "Septic / vacuum tank", "Fuel / lubrication tank", "Food-grade tank", "Propane body", "Snowplow", "V-plow", "Salt / sand spreader", "Combination dump / plow / spreader"],
  "Aerial & emergency": ["Bucket / aerial body", "Sign-service aerial", "Tree-trimming aerial", "Ambulance", "Fire rescue body", "Fire pumper", "Mobile command vehicle", "Emergency communications body"],
  "Mobile business & passenger": ["Food truck", "Mobile kitchen / catering body", "Mobile retail store", "Mobile office", "Mobile workshop", "Mobile medical / dental clinic", "Shuttle bus", "Paratransit body", "Crew transport body", "RV / expedition camper", "Animal transport body", "Mobile restroom", "Mobile billboard / LED display truck"]
};

const isuzuAllBodies = ["Cab & Chassis", ...Object.values(isuzuBodyCategories).flat()];
const priorityIsuzuBodies = new Set(["Cab & Chassis", "Standard dry box / van body", "Refrigerated box", "Stake body with removable racks", "Standard steel flatbed", "Landscape dump", "Light-duty dump", "Open-top utility body", "Mobile service / workshop body", "Steel rollback / car carrier", "Hooklift", "Mechanics body with hydraulic crane"]);
const bodyCategory = (brandId: BrandId, bodyName: string) => brandId === "freightliner" ? freightlinerBodyCategory(bodyName) : Object.entries(isuzuBodyCategories).find(([, names]) => names.includes(bodyName))?.[0] || "Custom upfit";
const bodyCategoriesFor = (brandId: BrandId) => brandId === "freightliner" ? freightlinerBodyCategories : isuzuBodyCategories;
const catalogBodyCount = (brandId: BrandId) => brandId === "freightliner" ? freightlinerCatalogEntryCount : isuzuAllBodies.length;

const lengthVariants = (prefix: string, lengths: number[], detail: string, source: string): BodyVariant[] => lengths.map((length) => ({ id: `${prefix}-${String(length).replace(".", "-")}ft`, label: `${length} ft`, detail, lengthFt: length, source }));

const bodyVariantCatalog: Record<string, BodyVariant[]> = {
  "Dry Van Box": lengthVariants("dry-van", [10, 12, 14, 16, 18, 20, 22, 24, 26, 28], "Nominal cargo-body length", "Morgan Gold Star published 10–28 ft range"),
  "Refrigerated Box": lengthVariants("reefer", [10, 12, 14, 16, 18, 20, 22, 24, 26, 28], "Nominal insulated-body length", "Morgan Cold Star published 10–28 ft range"),
  "Stake Body": lengthVariants("stake", [9, 11, 12, 14, 16, 18, 20, 22, 24, 26], "Platform length with stake sides", "Knapheide platform published 7–26 ft range"),
  Flatbed: lengthVariants("flatbed", [9, 11, 12, 14, 16, 18, 20, 22, 24, 26], "Nominal platform length", "Knapheide platform published 7–26 ft range"),
  "Landscape Dump": [
    { id: "landscape-9-4", label: "9 ft 4 in", detail: "Compact landscape dump", lengthFt: 9.33, source: "Eby EDGE/FLEX published size" },
    { id: "landscape-11-4", label: "11 ft 4 in", detail: "LCF landscape body", lengthFt: 11.33, source: "Eby FLEX published LCF size" },
    { id: "landscape-13-4", label: "13 ft 4 in", detail: "Long LCF landscape body", lengthFt: 13.33, source: "Eby FLEX published LCF size" }
  ],
  "Dump Body": [
    ...lengthVariants("dump-medium", [9, 10, 11, 12], "Medium-duty dump body", "Ox Stockyard published 9–12 ft range"),
    ...lengthVariants("dump-heavy", [14, 16, 18, 20, 21], "Heavy-duty dump body", "Ox Chisholm published 14–21 ft range")
  ],
  "Utility Body": lengthVariants("utility", [9, 11, 13, 14], "Nominal service-body length", "Planning sizes · final manufacturer series required"),
  Rollback: lengthVariants("rollback", [19, 21, 22, 24, 26, 28, 30], "Carrier deck length", "Jerr-Dan heavy-duty carrier published 24–30 ft range; shorter decks require model confirmation"),
  "Vacuum / Tank": [3, 5, 10, 12, 15].map((capacity) => ({ id: `vacuum-${capacity}yd`, label: `${capacity} yd³ debris`, detail: "Combination vacuum body capacity", source: "Vac-Con published debris-capacity options" })),
  Mixer: [8, 9, 10, 11, 12].map((capacity) => ({ id: `mixer-${capacity}yd`, label: `${capacity} yd³`, detail: "Nominal mixer capacity", source: "Planning capacity · mixer manufacturer confirmation required" })),
  Crane: [
    { id: "crane-9-20", label: "9 ft · 20k ft-lb", detail: "Compact mechanics body", lengthFt: 9, source: "IMT DSC20" },
    { id: "crane-11-52", label: "11 ft · 52k ft-lb", detail: "Medium crane body", lengthFt: 11, source: "IMT Dominator I" },
    { id: "crane-13-75", label: "13 ft · 75k ft-lb", detail: "Heavy mechanics body", lengthFt: 13, source: "IMT Dominator II" },
    { id: "crane-14-81", label: "14 ft · 81k ft-lb", detail: "Heavy crane body", lengthFt: 14, source: "IMT Dominator III" },
    { id: "crane-19-95", label: "19 ft · 95k ft-lb", detail: "Severe-duty crane body", lengthFt: 19, source: "IMT Dominator IV" }
  ],
  Refuse: [16, 20, 22, 23, 24, 26, 28, 30, 32, 33].map((capacity) => ({ id: `refuse-${capacity}yd`, label: `${capacity} yd³`, detail: "Nominal refuse-body volume", source: "Heil published body-size families" })),
  Tractor: [
    { id: "tractor-stationary", label: "Stationary fifth wheel", detail: "Fixed mounting position", source: "Planning selection" },
    { id: "tractor-air-slide", label: "Air-slide fifth wheel", detail: "Adjustable tractor coupling", source: "Planning selection" },
    { id: "tractor-heavy-slide", label: "Heavy-duty slide", detail: "Heavy-haul coupling provision", source: "Planning selection" }
  ]
};

const optionCatalog: Record<string, number> = {
  "Chrome package": 2400,
  "Heated mirrors": 675,
  "LED work lights": 980,
  "Amber beacon package": 1450,
  "Tool storage": 3200,
  "Backup camera": 850,
  "360° camera system": 2650,
  "Air-ride driver seat": 1250,
  "Adaptive cruise control": 2900,
  "PTO provision": 3800,
  "12 kW continuous ePTO": 0,
  "Snow-plow prep": 7200,
  "Lift gate": 6800,
  "Roll-up rear door": 0,
  "Double swing / barn doors": 0,
  "Side access door": 0,
  "Walk ramp": 0,
  "Rail-style liftgate": 0,
  "Dock / ICC bumper": 0,
  "Trailer hitch / receiver": 0,
  "Headache rack": 0,
  "Ladder rack": 0,
  "Removable stake racks": 0,
  "Landscape mesh sides": 0,
  "Dump tarp": 0,
  "Reefer condenser": 0,
  "Refrigeration battery pack": 0,
  "Crane outriggers": 0,
  "Rollback wheel lift": 0,
  "Winch / cable": 0,
  "Snowplow": 0,
  "Salt / sand spreader": 0,
  "Roof fairing": 0,
  "Safety equipment rack": 0,
  "Custom wrap / logo": 0,
  "Reflective striping": 0
};

const commonIsuzuBodies = ["Dry Van Box", "Refrigerated Box", "Stake Body", "Flatbed", "Landscape Dump", "Utility Body", "Rollback"];
const mediumBodies = ["Dry Van Box", "Refrigerated Box", "Stake Body", "Flatbed", "Dump Body", "Utility Body", "Rollback", "Vacuum / Tank"];
const severeBodies = ["Dump Body", "Mixer", "Crane", "Refuse", "Vacuum / Tank", "Flatbed", "Utility Body", "Tractor"];

const brands: Brand[] = [
  {
    id: "isuzu",
    name: "Isuzu",
    eyebrow: "Low cab forward",
    description: "Maneuverable Class 3–7 trucks for delivery, landscape, service and urban fleets.",
    accent: "#d51f2a",
    visual: "isuzu-glb",
    models: [
      { id: "npr-gas", name: "NPR Gas", className: "Class 3", gvwr: "12,000 lbs", hp: "350 hp", torque: "425 lb-ft", description: "Gas-powered low-cab-forward chassis for local delivery and service work.", applications: ["Delivery", "Service", "Landscape"], engines: ["GMPT L8T 6.6L gasoline"], transmissions: ["8L90 Hydra-Matic 8-speed automatic"], cabs: ["Standard Cab · 3 seats", "Crew Cab · 7 seats"], wheelbases: ["109 in", "132.5 in", "150 in", "176 in"], axles: ["4x2 single rear axle"], bodies: isuzuAllBodies, baseEstimate: 0 },
      { id: "npr-hd-gas", name: "NPR-HD Gas", className: "Class 4", gvwr: "14,500 lbs", hp: "350 hp", torque: "425 lb-ft", description: "Higher-capacity gas low-cab-forward chassis for delivery and vocational bodies.", applications: ["Delivery", "Landscape", "Service"], engines: ["GMPT L8T 6.6L gasoline"], transmissions: ["8L90 Hydra-Matic 8-speed automatic"], cabs: ["Standard Cab · 3 seats", "Crew Cab · 7 seats"], wheelbases: ["109 in", "132.5 in", "150 in", "176 in"], axles: ["4x2 single rear axle"], bodies: isuzuAllBodies, baseEstimate: 61500 },
      { id: "nqr-gas", name: "NQR Gas", className: "Class 5", gvwr: "17,950 lbs", hp: "350 hp", torque: "425 lb-ft", description: "Gas Class 5 chassis for higher-payload delivery and vocational upfits.", applications: ["Heavy delivery", "Utility", "Landscape"], engines: ["GMPT L8T 6.6L gasoline"], transmissions: ["Allison 1000 RDS 6-speed automatic"], cabs: ["Standard Cab · 3 seats", "Crew Cab · 7 seats"], wheelbases: ["132.5 in", "150 in", "176 in", "200 in"], axles: ["4x2 single rear axle"], bodies: isuzuAllBodies, baseEstimate: 0 },
      { id: "nrr-gas", name: "NRR Gas", className: "Class 5", gvwr: "19,500 lbs", hp: "350 hp", torque: "425 lb-ft", description: "Highest-GVWR N-Series gas chassis with body envelopes up to 24 feet.", applications: ["Heavy delivery", "Municipal", "Utility"], engines: ["GMPT L8T 6.6L gasoline"], transmissions: ["Allison 1000 RDS 6-speed automatic"], cabs: ["Standard Cab · 3 seats", "Crew Cab · 7 seats"], wheelbases: ["132.5 in", "150 in", "176 in", "200 in", "212 in"], axles: ["4x2 single rear axle"], bodies: isuzuAllBodies, baseEstimate: 0 },
      { id: "npr-hd-diesel", name: "NPR-HD Diesel", className: "Class 4", gvwr: "14,500 lbs", hp: "215 hp", torque: "452 lb-ft", description: "Efficient diesel chassis with strong low-speed torque and compact dimensions.", applications: ["Delivery", "Refrigerated", "Landscape"], engines: ["Isuzu 4HK1-TC 5.2L turbo diesel"], transmissions: ["Aisin A465id 6-speed automatic"], cabs: ["Standard Cab · 3 seats", "Crew Cab · 7 seats"], wheelbases: ["109 in", "132.5 in", "150 in", "176 in"], axles: ["4x2 single rear axle"], bodies: isuzuAllBodies, baseEstimate: 68900 },
      { id: "npr-xd", name: "NPR-XD Diesel", className: "Class 4", gvwr: "16,000 lbs", hp: "215 hp", torque: "452 lb-ft", description: "Additional diesel payload capacity in the N-Series footprint.", applications: ["Heavy delivery", "Utility", "Refrigerated"], engines: ["Isuzu 4HK1-TC 5.2L turbo diesel"], transmissions: ["Aisin A465id 6-speed automatic"], cabs: ["Standard Cab · 3 seats", "Crew Cab · 7 seats"], wheelbases: ["109 in", "132.5 in", "150 in", "176 in"], axles: ["4x2 single rear axle"], bodies: isuzuAllBodies, baseEstimate: 72800 },
      { id: "nrr-derate-diesel", name: "NRR Derate Diesel", className: "Class 5", gvwr: "17,950 lbs", hp: "215 hp", torque: "452 lb-ft", description: "Derated NRR diesel chassis for Class 5 payload and registration requirements.", applications: ["Delivery", "Utility", "Municipal"], engines: ["Isuzu 4HK1-TC 5.2L turbo diesel"], transmissions: ["Aisin A465id 6-speed automatic"], cabs: ["Standard Cab · 3 seats", "Crew Cab · 7 seats"], wheelbases: ["109 in", "132.5 in", "150 in", "176 in", "200 in"], axles: ["4x2 single rear axle"], bodies: isuzuAllBodies, baseEstimate: 0 },
      { id: "nrr", name: "NRR Diesel", className: "Class 5", gvwr: "19,500 lbs", hp: "215 hp", torque: "452 lb-ft", description: "Highest-capacity N-Series diesel for bodies up to 24 feet.", applications: ["Heavy delivery", "Rollback", "Municipal"], engines: ["Isuzu 4HK1-TC 5.2L turbo diesel"], transmissions: ["Aisin A465id 6-speed automatic"], cabs: ["Standard Cab · 3 seats", "Crew Cab · 7 seats"], wheelbases: ["109 in", "132.5 in", "150 in", "176 in", "200 in", "212 in"], axles: ["4x2 single rear axle"], bodies: isuzuAllBodies, baseEstimate: 83900 },
      { id: "nrr-ev", name: "NRR EV", className: "Class 5 electric", gvwr: "19,500 lbs", hp: "Battery electric", torque: "Electric drive", description: "Battery-electric NRR with standard cab, selectable battery capacity, and optional ePTO.", applications: ["Urban delivery", "Electric utility", "Municipal"], engines: ["60 kWh · 41–80 mi estimated", "100 kWh · 68–130 mi estimated", "140 kWh · 95–180 mi estimated", "180 kWh · 122–235 mi estimated"], transmissions: ["Integrated electric drive"], cabs: ["Standard Cab · 3 seats"], wheelbases: ["132.5 in", "150 in", "176 in"], axles: ["4x2 single rear axle"], bodies: isuzuAllBodies, baseEstimate: 0 },
      { id: "ftr", name: "FTR", className: "Class 6", gvwr: "25,950 lbs", hp: "260 hp", torque: "660 lb-ft", description: "Cummins-powered F-Series for demanding delivery and vocational duty.", applications: ["Dump", "Delivery", "Municipal"], engines: ["Cummins B6.7 diesel · 260 hp"], transmissions: ["Allison 2000 Series 6-speed automatic"], cabs: ["Standard Cab · 3 seats"], wheelbases: ["152 in", "170 in", "188 in", "200 in", "212 in", "224 in", "236 in", "248 in"], axles: ["4x2 single rear axle"], bodies: isuzuAllBodies, baseEstimate: 109500 },
      { id: "fvr-derate", name: "FVR Derate", className: "Class 6", gvwr: "25,950 lbs", hp: "260 hp", torque: "660 lb-ft", description: "Derated FVR configuration for Class 6 operations with F-Series capability.", applications: ["Delivery", "Utility", "Municipal"], engines: ["Cummins B6.7 diesel · 260 hp"], transmissions: ["Allison 2000 Series 6-speed automatic"], cabs: ["Standard Cab · 3 seats"], wheelbases: ["152 in", "170 in", "188 in", "200 in", "212 in", "224 in", "236 in", "248 in"], axles: ["4x2 single rear axle"], bodies: isuzuAllBodies, baseEstimate: 0 },
      { id: "fvr", name: "FVR", className: "Class 7", gvwr: "33,000 lbs", hp: "260 hp", torque: "660 lb-ft", description: "Class 7 F-Series chassis for heavier bodies, payload and municipal work.", applications: ["Dump", "Utility", "Municipal"], engines: ["Cummins B6.7 diesel · 260 hp"], transmissions: ["Allison 2000 Series 6-speed automatic"], cabs: ["Standard Cab · 3 seats"], wheelbases: ["152 in", "170 in", "188 in", "200 in", "212 in", "224 in", "236 in", "248 in"], axles: ["4x2 single rear axle"], bodies: isuzuAllBodies, baseEstimate: 121500 }
    ]
  },
  {
    id: "freightliner",
    name: "Freightliner",
    eyebrow: "Medium to severe duty",
    description: "Flexible chassis for delivery, vocational, municipal and on-highway operations.",
    accent: "#1f5e8c",
    visual: "freightliner-glb",
    models: [
      { id: "m2-106", name: "M2 106 Plus", className: "Class 6–8", gvwr: "Up to 66,000 lbs", hp: "200–360 hp", torque: "520–1,150 lb-ft", description: "Versatile medium-duty platform with day, extended and crew cab configurations.", applications: ["Delivery", "Utility", "Towing"], engines: ["Detroit DD5", "Detroit DD8", "Cummins B6.7", "Cummins L9"], transmissions: ["Allison automatic", "Eaton manual / automated"], cabs: ["106 in BBC Day Cab", "132 in BBC Extended Cab", "154 in BBC Crew Cab"], wheelbases: ["152 in", "176 in", "200 in", "224 in", "252 in · engineering review"], axles: ["4x2 single", "6x4 tandem"], bodies: mediumBodies, baseEstimate: 98500 },
      { id: "m2-112", name: "M2 112 Plus", className: "Class 7–8", gvwr: "Up to 80,000 lbs", hp: "260–525 hp", torque: "660–1,850 lb-ft", description: "Higher-capacity M2 for heavier vocational and regional-haul applications.", applications: ["Heavy vocational", "Regional haul", "Municipal"], engines: ["Detroit DD13", "Cummins L9", "Cummins X12"], transmissions: ["Allison 3000/4000", "Detroit DT12", "Eaton manual"], cabs: ["Day Cab", "Extended Cab", "Crew Cab"], wheelbases: ["176 in", "200 in", "224 in", "252 in · engineering review"], axles: ["4x2 single", "6x4 tandem"], bodies: [...mediumBodies, "Tractor"], baseEstimate: 124500 },
      { id: "em2", name: "eM2", className: "Class 6–7 electric", gvwr: "26,000–33,000 lbs", hp: "190–255 hp continuous", torque: "Detroit ePowertrain", description: "Battery-electric medium-duty platform for local delivery and vocational routes.", applications: ["Urban delivery", "Box truck", "Fleet electrification"], engines: ["Detroit ePowertrain · 194 kWh", "Detroit ePowertrain · 291 kWh"], transmissions: ["Integrated electric drive"], cabs: ["106 in BBC Day Cab"], wheelbases: ["OEM configuration · engineering review"], axles: ["Single eAxle · dealer validation"], bodies: ["Dry Van Box", "Refrigerated Box", "Flatbed", "Utility Body"], baseEstimate: 0 },
      { id: "m2-112-natural-gas", name: "M2 112 Natural Gas", className: "Class 7–8 natural gas", gvwr: "Up to 66,000 lbs", hp: "250–320 hp", torque: "660–1,000 lb-ft", description: "Natural-gas M2 platform for vocational and regional operations.", applications: ["Regional haul", "Refuse", "Municipal"], engines: ["Cummins L9N natural gas"], transmissions: ["Allison 3000 series", "Allison 4000 series"], cabs: ["112 in BBC Day Cab", "138 in BBC Extended Cab", "160 in BBC Crew Cab"], wheelbases: ["OEM configuration · engineering review"], axles: ["Single or tandem · dealer validation"], bodies: [...mediumBodies, "Tractor", "Refuse"], baseEstimate: 0 },
      { id: "108sd", name: "108SD Plus", className: "Severe duty", gvwr: "Up to 69,000 lbs", hp: "200–380 hp", torque: "520–1,250 lb-ft", description: "Compact severe-duty platform engineered for upfit access and vocational work.", applications: ["Construction", "Municipal", "Utility"], engines: ["Detroit DD8", "Cummins L9"], transmissions: ["Allison 3000/4000", "Eaton manual"], cabs: ["Day Cab", "Extended Cab", "Crew Cab"], wheelbases: ["152 in", "176 in", "200 in", "224 in · engineering review"], axles: ["4x2 single", "6x4 tandem"], bodies: severeBodies, baseEstimate: 138500 },
      { id: "114sd", name: "114SD Plus", className: "Severe duty", gvwr: "Up to 92,000 lbs", hp: "260–525 hp", torque: "660–1,850 lb-ft", description: "Heavy vocational chassis with DD13 power and severe-duty frame capability.", applications: ["Dump", "Mixer", "Crane"], engines: ["Detroit DD13 Gen 5", "Cummins L9", "Cummins X12"], transmissions: ["Detroit DT12-V / DT12-VL", "Allison 3000/4000", "Eaton manual"], cabs: ["114 in BBC Day Cab", "Extended Cab", "Crew Cab"], wheelbases: ["190 in", "214 in", "238 in", "262 in · engineering review"], axles: ["4x2 single", "6x4 tandem", "8x6 tridem / lift axle"], bodies: severeBodies, baseEstimate: 158500 },
      { id: "114sd-natural-gas", name: "114SD Natural Gas", className: "Class 7–8 natural gas", gvwr: "Up to 62,000 lbs", hp: "260–400 hp", torque: "Up to 1,450 lb-ft", description: "Natural-gas severe-duty platform with clear back-of-cab upfit space.", applications: ["Refuse", "Municipal", "Vocational"], engines: ["Cummins natural-gas engine · dealer validation"], transmissions: ["Allison 3000 RDS automatic"], cabs: ["Day Cab", "Extended Cab", "Crew Cab"], wheelbases: ["OEM configuration · engineering review"], axles: ["Single or tandem · dealer validation"], bodies: severeBodies, baseEstimate: 0 },
      { id: "cascadia", name: "Cascadia", className: "Class 8 on-highway", gvwr: "Application dependent", hp: "370–525 hp", torque: "1,250–1,850 lb-ft", description: "Aerodynamic highway tractor focused on efficiency, safety and driver productivity.", applications: ["Highway", "Regional", "Fleet"], engines: ["Detroit DD13 Gen 5", "Detroit DD15 Gen 5"], transmissions: ["Detroit DT12 automated manual"], cabs: ["Day Cab", "48 in Sleeper", "60 in Raised Roof", "72 in Raised Roof"], wheelbases: ["180 in", "210 in", "230 in", "250 in · engineering review"], axles: ["4x2 single", "6x2 tag", "6x4 tandem"], bodies: ["Tractor"], baseEstimate: 168500 },
      { id: "cascadia-natural-gas", name: "Cascadia Natural Gas", className: "Class 8 on-highway", gvwr: "Application dependent", hp: "400–500 hp", torque: "1,450–1,850 lb-ft", description: "Cascadia with the Cummins X15N natural-gas powertrain for regional and on-highway fleets.", applications: ["Regional distribution", "Port drayage", "On-highway"], engines: ["Cummins X15N natural gas"], transmissions: ["Eaton Cummins Endurant 12-speed"], cabs: ["126 in BBC Day Cab", "48 in Mid-Roof XT", "60 in Sleeper", "72 in Sleeper"], wheelbases: ["OEM configuration · engineering review"], axles: ["Single or tandem · dealer validation"], bodies: ["Tractor"], baseEstimate: 0 },
      { id: "ecascadia", name: "eCascadia", className: "Class 8 electric", gvwr: "Application dependent", hp: "Detroit ePowertrain", torque: "Electric eAxle", description: "Battery-electric Class 8 tractor for regional and drayage applications.", applications: ["Regional haul", "Port drayage", "Fleet electrification"], engines: ["Detroit ePowertrain · 291 kWh", "Detroit ePowertrain · 438 kWh"], transmissions: ["Integrated electric drive"], cabs: ["Day Cab"], wheelbases: ["OEM configuration · engineering review"], axles: ["Electric tandem · dealer validation"], bodies: ["Tractor"], baseEstimate: 0 },
      { id: "econicsd", name: "EconicSD", className: "Severe duty", gvwr: "Up to 66,000 lbs", hp: "350 hp", torque: "Up to 1,050 lb-ft", description: "Low-entry severe-duty cab for refuse, municipal and urban operations.", applications: ["Refuse", "Municipal", "Urban"], engines: ["Detroit DD8"], transmissions: ["Allison 3000 automatic"], cabs: ["Low-entry day cab"], wheelbases: ["Common upfit wheelbase · engineering review"], axles: ["6x4 tandem"], bodies: ["Refuse", "Vacuum / Tank", "Utility Body"], baseEstimate: 176500 }
    ]
  },
  {
    id: "western-star",
    name: "Western Star",
    eyebrow: "X-Series heavy duty",
    description: "Purpose-built Class 8 trucks for construction, heavy haul and demanding highway work.",
    accent: "#d99a16",
    visual: "heavy-glb",
    models: [
      { id: "47x", name: "47X", className: "Class 8 vocational", gvwr: "Application dependent", hp: "260–525 hp", torque: "860–1,850 lb-ft", description: "Short 111.6-inch BBC vocational truck for visibility, maneuverability and payload.", applications: ["Dump", "Mixer", "Municipal"], engines: ["Detroit DD13 Gen 5", "Cummins L9", "Cummins X12"], transmissions: ["Detroit DT12-V / DT12-VL", "Allison automatic", "Eaton manual"], cabs: ["Day Cab", "48 in Sleeper"], wheelbases: ["176 in", "200 in", "224 in", "252 in · engineering review"], axles: ["4x2", "6x4", "8x6"], bodies: severeBodies, baseEstimate: 172500 },
      { id: "49x", name: "49X", className: "Class 8 vocational", gvwr: "Application dependent", hp: "350–605 hp", torque: "1,250–2,050 lb-ft", description: "Heavy-duty vocational platform engineered for upfit, durability and severe applications.", applications: ["Heavy haul", "Logging", "Crane"], engines: ["Detroit DD13 Gen 5", "Detroit DD15", "Detroit DD16", "Cummins X12", "Cummins X15"], transmissions: ["Detroit DT12-V / DT12-VL", "Allison 4000", "Eaton manual"], cabs: ["Day Cab", "36 in Sleeper", "48 in Sleeper", "60 in Sleeper", "72 in Sleeper"], wheelbases: ["200 in", "224 in", "252 in", "280 in · engineering review"], axles: ["6x4", "8x6", "8x8", "Tridem / planetary axle"], bodies: severeBodies, baseEstimate: 198500 },
      { id: "49x-power", name: "49X Power Hood", className: "Class 8 severe duty", gvwr: "Application dependent", hp: "425–605 hp", torque: "1,750–2,050 lb-ft", description: "Long-and-tall power hood for maximum cooling, torque and gross combined weight.", applications: ["Heavy haul", "Oil field", "Logging"], engines: ["Detroit DD15", "Detroit DD16", "Cummins X15"], transmissions: ["Detroit DT12-V / DT12-VL", "Allison 4000", "Eaton manual"], cabs: ["Day Cab", "36 in Sleeper", "48 in Sleeper", "60 in Sleeper", "72 in Sleeper"], wheelbases: ["224 in", "252 in", "280 in", "300 in · engineering review"], axles: ["6x4", "8x6", "8x8", "Tridem / planetary axle"], bodies: ["Tractor", "Crane", "Flatbed", "Vacuum / Tank"], baseEstimate: 225000 },
      { id: "57x", name: "57X", className: "Class 8 on-highway", gvwr: "Application dependent", hp: "370–600 hp", torque: "1,250–2,050 lb-ft", description: "Driver-focused Western Star highway tractor with aerodynamic X-Series design.", applications: ["Highway", "Regional", "Premium fleet"], engines: ["Detroit DD13 Gen 5", "Detroit DD15 Gen 5", "Detroit DD16"], transmissions: ["Detroit DT12 Direct", "Detroit DT12 High-Speed"], cabs: ["Day Cab", "72 in Stratosphere Sleeper"], wheelbases: ["180 in", "220 in", "250 in · engineering review"], axles: ["4x2", "6x2", "6x4"], bodies: ["Tractor"], baseEstimate: 194500 }
    ]
  }
];

// Freightliner bodies are shared modular assets. Model-specific chassis rules below
// replace the earlier compact demo list without duplicating complete trucks.
const freightlinerBrand = brands.find((maker) => maker.id === "freightliner")!;
const freightlinerSeed = new Map(freightlinerBrand.models.map((truck) => [truck.id, truck]));
const freightlinerModel = (id: string, overrides: Partial<TruckModel>): TruckModel => ({
  ...freightlinerSeed.get(id)!,
  bodies: freightlinerAllBodies,
  wheelbases: ["Dealer-defined wheelbase · engineering review"],
  ...overrides
});

freightlinerBrand.models = [
  freightlinerModel("m2-106", {
    cabs: ["106 in BBC Day Cab", "132 in BBC Extended Cab", "154 in BBC Crew Cab"],
    engines: ["Detroit DD5", "Detroit DD8", "Cummins B6.7", "Cummins L9", "Cummins B6.7 Octane gasoline · dealer confirmation required"],
    applications: ["Straight truck", "Vocational", "Regional tractor"],
    description: "Medium-duty straight truck, vocational platform or tractor with day, extended and crew cab options."
  }),
  freightlinerModel("m2-112", {
    cabs: ["112 in BBC Day Cab", "132 in BBC Extended Cab", "160 in BBC Crew Cab"],
    engines: ["Detroit DD13", "Cummins L9", "Cummins L9N natural gas"],
    applications: ["Heavy straight truck", "Regional tractor", "Vocational"],
    description: "Heavy straight-truck, regional-tractor and vocational platform with end-of-frame connection options."
  }),
  freightlinerModel("108sd", {
    cabs: ["108 in BBC Day Cab", "134 in BBC Extended Cab", "156 in BBC Crew Cab"],
    engines: ["Detroit DD8", "Cummins B6.7", "Cummins L9"],
    applications: ["Municipal", "Construction", "Utility"],
    description: "Weight-conscious severe-duty platform with transmission, front-engine and rear-engine PTO planning."
  }),
  freightlinerModel("114sd", {
    cabs: ["114 in BBC Day Cab", "140 in BBC Extended Cab", "162 in BBC Crew Cab · set-back front axle"],
    engines: ["Detroit DD13 Gen 5", "Detroit DD8", "Cummins L9", "Cummins X12"],
    applications: ["Heavy vocational", "Construction", "Fire"],
    description: "Heavy vocational platform supporting set-back or set-forward front axles, tandem and lift axles, reinforced frames and PTO systems."
  }),
  freightlinerModel("cascadia", {
    name: "Fifth Generation Cascadia",
    cabs: ["116 in BBC Day Cab", "126 in BBC Day Cab", "48 in Mid-Roof XT Sleeper", "60 in Mid-Roof XT Sleeper", "72 in Mid-Roof XT Sleeper", "60 in Raised Roof Sleeper", "72 in Raised Roof Sleeper"],
    engines: ["Detroit DD13 Gen 5", "Detroit DD15 Gen 5"],
    applications: ["On-highway", "Regional", "Long haul"],
    description: "Default current new-build Cascadia for on-highway day-cab and sleeper tractor configurations."
  }),
  freightlinerModel("econicsd", {
    bodies: ["Front-load refuse body", "Automated side-load refuse body", "Manual side-load refuse body", "Rear-load refuse body"],
    applications: ["Front-load refuse", "Side-load refuse", "Rear-load refuse"],
    description: "Purpose-built low-entry Class 8 refuse chassis; non-refuse upfits are not offered in this configurator."
  }),
  freightlinerModel("em2", {
    id: "em2-class-6",
    name: "eM2 Class 6",
    className: "Class 6 electric",
    gvwr: "26,000 lbs",
    hp: "190 hp continuous",
    torque: "Single Detroit eAxle",
    engines: ["194 kWh battery · up to 180 mi typical range"],
    cabs: ["106 in BBC Day Cab"],
    wheelbases: ["Published overall length 319–391 in · exact wheelbase requires dealer data"],
    axles: ["Single Detroit eAxle"],
    applications: ["Electric delivery", "Selected vocational"],
    description: "26,000-lb electric day-cab straight truck with a 194-kWh battery package."
  }),
  freightlinerModel("em2", {
    id: "em2-class-7",
    name: "eM2 Class 7",
    className: "Class 7 electric",
    gvwr: "33,000 lbs",
    hp: "255 hp continuous",
    torque: "Single Detroit eAxle",
    engines: ["291 kWh battery · up to 250 mi typical range"],
    cabs: ["106 in BBC Day Cab"],
    wheelbases: ["Published overall length 319–391 in · exact wheelbase requires dealer data"],
    axles: ["Single Detroit eAxle"],
    applications: ["Electric delivery", "Reefer", "Flatbed"],
    description: "33,000-lb electric day-cab straight truck with a 291-kWh battery package."
  }),
  freightlinerModel("ecascadia", {
    gvwr: "Up to 82,000 lbs GCW",
    hp: "320–470 hp",
    cabs: ["116 in BBC Day Cab"],
    engines: ["291 kWh · single drive · 155 mi", "438 kWh · single drive · 230 mi", "438 kWh · tandem drive · 220 mi"],
    axles: ["Single drive · 65,000 lb GCW", "Tandem drive · 82,000 lb GCW"],
    applications: ["Short haul", "Drayage", "Regional tractor"],
    description: "Electric day-cab tractor; the 291-kWh battery is limited to the single-drive configuration."
  }),
  freightlinerModel("m2-112-natural-gas", {
    cabs: ["112 in BBC Day Cab", "138 in BBC Extended Cab", "160 in BBC Crew Cab"],
    engines: ["Cummins L9N natural gas"],
    applications: ["CNG/RNG straight truck", "Regional tractor", "Vocational"]
  }),
  freightlinerModel("114sd-natural-gas", {
    cabs: ["114 in BBC Day Cab", "140 in BBC Extended Cab", "162 in BBC Crew Cab · set-back front axle"],
    applications: ["CNG/RNG vocational", "Refuse", "Municipal"]
  }),
  freightlinerModel("cascadia-natural-gas", {
    cabs: ["126 in BBC Day Cab", "48 in Mid-Roof XT Sleeper", "60 in Mid-Roof XT Sleeper", "72 in Mid-Roof XT Sleeper", "60 in Raised Roof Sleeper", "72 in Raised Roof Sleeper"],
    applications: ["CNG/RNG on-highway", "Regional", "Long haul"]
  })
];

function createDefaultAssetRegistry(): ModelAssetRecord[] {
  const requirements = brands.flatMap((maker) => maker.models.flatMap((truck) => {
    const exteriorReference = maker.id === "isuzu" && truck.id === "nrr-ev"
      ? { status: "reference" as const, file: "/models/isuzu-nrr-ev-cab-chassis.glb", paintMaterials: "tripo_material_339625fe-5aa7-473b-b036-1fd90cfa7738", note: "Uploaded model identified as NRR EV. Its baked white base texture supports live color tinting while preserving dark detail. Exact dimensions, wheelbase movement, axle relocation and configuration still require a segmented verified source model." }
      : { status: "missing" as const, file: "", note: "Model-specific exterior GLB required." };
    const interiorReference = maker.id === "isuzu"
      ? { status: "reference" as const, file: "/models/isuzu-cab-interior-placeholder.glb", note: "Generic placeholder interior; not an exact model-specific Isuzu cabin." }
      : { status: "missing" as const, file: "", note: "Model-specific interior GLB required." };
    const base: ModelAssetRecord[] = [
      { id: `${maker.id}:${truck.id}:exterior`, brandId: maker.id, brandName: maker.name, modelId: truck.id, modelName: truck.name, kind: "exterior", variant: "Cab and chassis", compatibility: "not-applicable", ...exteriorReference },
      { id: `${maker.id}:${truck.id}:interior`, brandId: maker.id, brandName: maker.name, modelId: truck.id, modelName: truck.name, kind: "interior", variant: "Driver cabin", compatibility: "not-applicable", ...interiorReference }
    ];
    if (maker.id === "isuzu" || maker.id === "freightliner") return base;
    return [...base, ...truck.bodies.map((bodyName): ModelAssetRecord => {
      return { id: `${maker.id}:${truck.id}:body:${bodyName}`, brandId: maker.id, brandName: maker.name, modelId: truck.id, modelName: truck.name, kind: "body", variant: bodyName, status: "missing", compatibility: "review", file: "", note: `${bodyName} GLB required; chassis compatibility also requires review.` };
    })];
  }));
  const sharedIsuzuBodies: ModelAssetRecord[] = isuzuAllBodies.map((bodyName) => {
    const bare = bodyName === "Cab & Chassis";
    const dryVan = bodyName === "Standard dry box / van body";
    const priority = priorityIsuzuBodies.has(bodyName);
    return { id:`isuzu:shared-body:${bodyName}`, brandId:"isuzu", brandName:"Isuzu", modelId:"all-isuzu", modelName:"Shared modular body library", kind:"body", variant:bodyName, status:bare ? "exact" : dryVan ? "reference" : "missing", compatibility:bare ? "verified" : "review", file:dryVan ? "/models/isuzu-dry-van-body.glb" : "", nominalLengthFt:dryVan ? 16 : undefined, bodySizingMode:dryVan ? "uniform-reference" : "locked", note:bare ? "No body asset required; bare chassis configuration." : dryVan ? "Generic 16 ft dry-van reference. Uniform length scaling is visual only until a verified stretch-zone asset is supplied." : priority ? "First-production modular body GLB required." : "Cataloged customer request; 3D asset required before exact visualization." };
  });
  const sharedFreightlinerBodies: ModelAssetRecord[] = freightlinerAllBodies.map((bodyName) => {
    const bare = bodyName === "Bare cab and chassis";
    const priority = priorityFreightlinerBodies.has(bodyName);
    return { id:`freightliner:shared-body:${bodyName}`, brandId:"freightliner", brandName:"Freightliner", modelId:"all-freightliner", modelName:"Shared modular body library", kind:"body", variant:bodyName, status:bare ? "exact" : "missing", compatibility:bare ? "verified" : "review", file:"", bodySizingMode:"locked", note:bare ? "No body asset required; bare chassis configuration." : priority ? "First-production modular body or trailer GLB required." : "Cataloged customer request; exact 3D asset and chassis engineering approval are required." };
  });
  return [...requirements, ...sharedIsuzuBodies, ...sharedFreightlinerBodies, {
    id: "freightliner:unassigned-dump:complete:Dump Body",
    brandId: "freightliner",
    brandName: "Freightliner",
    modelId: "unassigned",
    modelName: "Unassigned dump upload",
    kind: "complete",
    variant: "Dump Body",
    status: "reference",
    compatibility: "review",
    file: "/models/freightliner-dump-unassigned.glb",
    note: "Complete Freightliner dump truck GLB. Exact chassis model was not identified in the file or upload name. Assign in Admin after verification."
  }, {
    id: "western-star:unassigned-dump-white:complete:Dump Body",
    brandId: "western-star",
    brandName: "Western Star",
    modelId: "unassigned",
    modelName: "Unassigned white dump upload",
    kind: "complete",
    variant: "Dump Body",
    status: "reference",
    compatibility: "review",
    file: "/models/western-star-dump-reference-white.glb",
    note: "Healthy complete dump-truck GLB with one merged mesh and one material. Assign to 47X, 49X, or 49X Power Hood only after visually verifying the cab."
  }, {
    id: "western-star:unassigned-dump-yellow:complete:Dump Body",
    brandId: "western-star",
    brandName: "Western Star",
    modelId: "unassigned",
    modelName: "Unassigned yellow dump upload",
    kind: "complete",
    variant: "Dump Body",
    status: "reference",
    compatibility: "review",
    file: "/models/western-star-dump-reference-yellow.glb",
    note: "Healthy complete dump-truck GLB with one merged mesh and one material. Assign to 47X, 49X, or 49X Power Hood only after visually verifying the cab."
  }, {
    id: "western-star:unassigned-dump-blue:complete:Dump Body",
    brandId: "western-star",
    brandName: "Western Star",
    modelId: "unassigned",
    modelName: "Unassigned blue dump upload",
    kind: "complete",
    variant: "Dump Body",
    status: "reference",
    compatibility: "review",
    file: "/models/western-star-dump-reference-blue.glb",
    note: "Healthy complete dump-truck GLB with one merged mesh and one material. Assign to 47X, 49X, or 49X Power Hood only after visually verifying the cab."
  }, {
    id: "freightliner:damaged-yellow-dump:complete:Dump Body",
    brandId: "freightliner",
    brandName: "Freightliner",
    modelId: "unassigned",
    modelName: "Damaged yellow dump upload",
    kind: "complete",
    variant: "Dump Body",
    status: "missing",
    compatibility: "review",
    file: "",
    note: "Upload rejected: GLB header declares 57,104,416 bytes but the uploaded file contains only 42,446,848 bytes. Re-export and upload the complete GLB before assignment."
  }];
}

const colors = [
  { name: "Arctic White", hex: "#e9ecec" },
  { name: "Midnight Black", hex: "#15191d" },
  { name: "Diehl Red", hex: "#a81822" },
  { name: "Fleet Blue", hex: "#164d79" },
  { name: "Silver Metallic", hex: "#9ba3a6" },
  { name: "Safety Yellow", hex: "#e1a913" }
];

const packages = [
  { name: "Custom", body: null, options: [], price: 0, description: "Build every selection from scratch." },
  { name: "Delivery", body: "Dry Van Box", options: ["Lift gate", "Backup camera"], price: 3800, description: "Dry van body, lift gate and rear visibility." },
  { name: "Landscaper", body: "Landscape Dump", options: ["Tool storage", "LED work lights"], price: 4900, description: "Landscape dump, tool storage and jobsite lighting." },
  { name: "Contractor", body: "Utility Body", options: ["Tool storage", "LED work lights", "PTO provision"], price: 6500, description: "Utility body, organized storage and PTO preparation." },
  { name: "Municipal", body: "Vacuum / Tank", options: ["Amber beacon package", "360° camera system", "PTO provision"], price: 9200, description: "Visibility, camera and PTO equipment for public works." },
  { name: "Severe Duty", body: "Dump Body", options: ["Amber beacon package", "PTO provision", "Snow-plow prep"], price: 11800, description: "Dump, hydraulic/PTO and severe-weather preparation." }
];

const freightlinerPackages = [
  { name: "Custom", body: null, options: [], price: 0, description: "Build every selection from scratch." },
  { name: "Delivery", body: "Standard aluminum dry van", options: ["Hydraulic tuckaway liftgate", "Backup camera"], price: 0, description: "Dry van, liftgate and rear visibility request." },
  { name: "Landscaper", body: "Landscape dump", options: ["Underbody toolboxes", "Work lights"], price: 0, description: "Landscape body, tool storage and jobsite lighting." },
  { name: "Contractor", body: "Open-top utility body", options: ["Underbody toolboxes", "Work lights"], price: 0, description: "Service body, organized storage and jobsite lighting." },
  { name: "Municipal", body: "Street sweeper", options: ["Beacon lights", "Backup camera"], price: 0, description: "Municipal body, visibility and safety equipment." },
  { name: "Severe Duty", body: "Contractor dump", options: ["Beacon lights", "Frame reinforcement", "Snowplow mount"], price: 0, description: "Dump, reinforced frame and severe-weather preparation." }
];

const steps = ["Your Job", "Chassis", "Cab & Power", "Body", "Equipment", "Appearance", "Review"];
const phases = [
  { label: "Your needs", detail: "Define the work", steps: [0] },
  { label: "Choose the truck", detail: "Chassis and power", steps: [1, 2] },
  { label: "Build the upfit", detail: "Body and equipment", steps: [3, 4, 5] },
  { label: "Review", detail: "Verify and request", steps: [6] }
];

const stepGuidance = [
  "Tell us about the work. We will use it to narrow the catalog.",
  "Choose a recommended chassis. The rest of the build updates around it.",
  "Set the cab and powertrain. Invalid combinations stay unavailable.",
  "Choose the body family, then choose a size that fits the selected chassis.",
  "Start with a package, then add only the equipment you need.",
  "Choose what to paint, select a color, and confirm it in the live preview.",
  "Review the complete build, then send it to Diehl's for verification."
];

const defaultJob: JobProfile = {
  vocation: "General delivery",
  payload: "Not sure yet",
  route: "Local / urban",
  crew: "1–3 people",
  fuel: "No preference",
  quantity: "1 truck",
  delivery: "Planning / no fixed date",
  notes: ""
};

const initialLeads: Lead[] = [];
const BUILD_DRAFT_KEY = "dtw-builder-draft-v2";

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function bodyVariantFit(brandId: BrandId, model: TruckModel, cab: string, wheelbase: string, variant: BodyVariant) {
  if (brandId === "freightliner") return "review" as const;
  if (brandId !== "isuzu" || !variant.lengthFt) return "review" as const;
  const sizing = getTruckSizing(brandId, model.id, cab, wheelbase, variant.lengthFt);
  if (sizing.confidence === "oem") return sizing.bodyLengthFit === "outside-oem-envelope" ? "incompatible" as const : "review" as const;
  if (["ftr", "fvr-derate", "fvr"].includes(model.id)) return variant.lengthFt > 30 || variant.lengthFt < 14 ? "incompatible" as const : "review" as const;
  const wheelbaseIn = Number.parseFloat(wheelbase);
  const crew = cab.toLowerCase().includes("crew");
  const standardLimits: Record<number, number> = { 109: 12, 132.5: 14, 150: 18, 176: 20, 200: 22, 212: 24 };
  const crewLimits: Record<number, number> = { 150: 12, 176: 16, 200: 18, 212: 20 };
  const modelEnvelope: Record<string, [number, number]> = {
    "npr-gas":[10,crew ? 16 : 20], "npr-hd-gas":[10,crew ? 16 : 20], "nqr-gas":[12,crew ? 18 : 22], "nrr-gas":[12,crew ? 20 : 24],
    "npr-hd-diesel":[10,crew ? 16 : 20], "npr-xd":[10,crew ? 16 : 20], "nrr-derate-diesel":[10,crew ? 16 : 22], "nrr":[10,crew ? 16 : 24], "nrr-ev":[12,20]
  };
  const envelope = modelEnvelope[model.id] || [10,24];
  if (variant.lengthFt < envelope[0] || variant.lengthFt > envelope[1]) return "incompatible" as const;
  const limit = Math.min((crew ? crewLimits : standardLimits)[wheelbaseIn] || envelope[1], envelope[1]);
  return limit && variant.lengthFt > limit ? "incompatible" as const : "review" as const;
}

function bodyVariantsFor(brandId: BrandId, model: TruckModel, bodyName: string) {
  if (bodyVariantCatalog[bodyName]) return bodyVariantCatalog[bodyName];
  if (brandId === "freightliner") {
    const category = freightlinerBodyCategory(bodyName);
    if (category === "Chassis & tractor" || category === "Refuse & recycling") return [];
    const cargo = category === "Cargo & delivery";
    const flatbed = category === "Flatbed, platform & landscape";
    const dump = category === "Dump & construction" || category === "Utility & service" || category === "Towing & interchangeable";
    let lengths: number[] = [];
    if (model.id === "m2-106") lengths = cargo ? [10,12,14,16,18,20,22,24,26,28,30] : flatbed ? [12,14,16,18,20,22,24,26,28] : dump ? [9,11,12,14,16,18] : [];
    else if (["em2-class-6","em2-class-7"].includes(model.id)) lengths = cargo || flatbed ? [18,20,22,24,26] : [];
    else if (["m2-112","m2-112-natural-gas"].includes(model.id)) lengths = cargo || flatbed ? [14,16,18,20,22,24,26,28,30] : dump ? [11,12,14,16,18] : [];
    else if (model.id === "108sd") lengths = flatbed ? [12,14,16,18,20,22,24,26] : dump ? [10,12,14,16,18] : [];
    else if (["114sd","114sd-natural-gas"].includes(model.id)) lengths = flatbed ? [12,14,16,18,20,22,24,26,28] : dump ? [10,12,14,16,18,20] : [];
    if (!lengths.length) return [];
    return lengthVariants(`freightliner-${model.id}-${bodyName.toLowerCase().replace(/[^a-z0-9]+/g,"-")}`, lengths, "Customer-facing nominal visual preset", "Freightliner platform planning range; final wheelbase, CTA, axle loading and upfitter approval required");
  }
  if (brandId !== "isuzu" || bodyName === "Cab & Chassis") return [];
  if (bodyName === "Advantic composite box") {
    const lengths = ["ftr","fvr-derate","fvr"].includes(model.id) ? [24,26] : [16,18,20];
    return lengthVariants("advantic", lengths, "Published Advantic composite body length", "Isuzu Advantic body specifications");
  }
  const lengths = ["ftr","fvr-derate","fvr"].includes(model.id) ? [14,16,18,20,22,24,26,28,30] : [10,12,14,16,18,20,22,24];
  return lengthVariants(`isuzu-${bodyName.toLowerCase().replace(/[^a-z0-9]+/g,"-")}`, lengths, "Nominal upfit body length", "Isuzu published chassis body envelope; exact upfitter model still required");
}

function powertrainAxleCompatible(modelId: string, engine: string, axle: string) {
  return !(modelId === "ecascadia" && engine.startsWith("291 kWh") && axle.startsWith("Tandem"));
}

function powertrainWheelbaseCompatible(modelId: string, engine: string, wheelbase: string) {
  if (modelId !== "nrr-ev") return true;
  if (engine.startsWith("140 kWh") || engine.startsWith("180 kWh")) return wheelbase.startsWith("176");
  return true;
}

function equipmentCompatible(brandId: BrandId, modelId: string, accessory: string) {
  if (brandId === "freightliner") return freightlinerAccessoryCompatible(modelId, accessory);
  if (accessory === "12 kW continuous ePTO") return brandId === "isuzu" && modelId === "nrr-ev";
  if (accessory === "PTO provision" && brandId === "isuzu" && modelId === "nrr-ev") return false;
  return true;
}

type PaintableModelViewer = HTMLElement & {
  model?: { materials?: Array<{ name?: string; pbrMetallicRoughness?: { setBaseColorFactor?: (color: [number, number, number, number]) => void } }> };
  toDataURL?: (type?: string, quality?: number) => string;
  updateComplete?: Promise<unknown>;
};

function hexToLinearColor(hex: string): [number, number, number, number] {
  const clean = hex.replace("#", "");
  const value = Number.parseInt(clean.length === 3 ? clean.split("").map((character) => character + character).join("") : clean, 16);
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255, 1];
}

function ModelViewer({ src, hero = false, interior = false, viewerRef, color, paintMaterials }: { src: string; hero?: boolean; interior?: boolean; viewerRef?: React.MutableRefObject<HTMLElement | null>; color?: string; paintMaterials?: string }) {
  const internalRef = useRef<PaintableModelViewer | null>(null);
  const paintNames = useMemo(() => new Set((paintMaterials || "").split(",").map((name) => name.trim()).filter(Boolean)), [paintMaterials]);

  useEffect(() => {
    const element = internalRef.current;
    if (!element || !color || paintNames.size === 0) return;
    const applyPaint = () => element.model?.materials?.forEach((material) => {
      if (material.name && paintNames.has(material.name)) material.pbrMetallicRoughness?.setBaseColorFactor?.(hexToLinearColor(color));
    });
    applyPaint();
    element.addEventListener("load", applyPaint);
    return () => element.removeEventListener("load", applyPaint);
  }, [color, paintNames, src]);

  return createElement("model-viewer", {
    ref: (element: PaintableModelViewer | null) => { internalRef.current = element; if (viewerRef) viewerRef.current = element; },
    src,
    alt: interior ? "Interactive placeholder truck cab interior" : "Interactive commercial truck 3D model",
    "camera-controls": true,
    "auto-rotate": interior ? false : true,
    "auto-rotate-delay": hero ? "0" : "1200",
    "rotation-per-second": hero ? "7deg" : "9deg",
    "environment-image": "neutral",
    "shadow-intensity": interior ? "0.45" : hero ? "1.25" : "1.1",
    "shadow-softness": "0.8",
    exposure: interior ? "1.2" : hero ? "1.08" : "1.12",
    "camera-orbit": interior ? "0deg 90deg 0.05m" : hero ? "38deg 68deg auto" : "35deg 70deg auto",
    "camera-target": interior ? "auto auto auto" : undefined,
    "min-camera-orbit": interior ? "-Infinity 55deg 0.01m" : undefined,
    "max-camera-orbit": interior ? "Infinity 125deg 0.5m" : undefined,
    "field-of-view": interior ? "58deg" : hero ? "26deg" : "28deg",
    "interpolation-decay": "140",
    "interaction-prompt": hero ? "none" : "auto",
    "touch-action": "pan-y",
    loading: "eager",
    ar: interior ? false : true,
    "ar-modes": "webxr scene-viewer quick-look"
  });
}

function ModelCardThumbnail({ brandId, model, asset, color }: { brandId: BrandId; model: TruckModel; asset?: ModelAssetRecord; color: string }) {
  const available = Boolean(asset?.file && asset.status !== "missing");
  return <div className={`model-card-thumbnail ${available ? "available" : "placeholder"}`}>
    {available ? createElement("model-viewer", { key: asset!.file, src: asset!.file, alt: `${model.name} thumbnail`, loading: "lazy", reveal: "auto", "camera-orbit": "35deg 70deg auto", "field-of-view": "34deg", "environment-image": "neutral", exposure: "1.05", "shadow-intensity": ".75", "interaction-prompt": "none" }) : <PlaceholderTruckViewer brandId={brandId} body={model.bodies[0]} color={color} compact thumbnail/>}
    <span>{available ? asset?.status === "exact" ? "Exact asset" : "Reference asset" : "Concept preview"}</span>
  </div>;
}

function IsuzuVisual({ color }: { color: string }) {
  return (
    <svg className="isuzu-visual" viewBox="0 0 900 430" role="img" aria-label="Isuzu low-cab-forward truck preview">
      <defs>
        <linearGradient id="izCab" x1="0" y1="0" x2="1" y2="1"><stop stopColor={color}/><stop offset=".65" stopColor={color}/><stop offset="1" stopColor="#53616a"/></linearGradient>
        <linearGradient id="izGlass" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#d7eef5"/><stop offset=".46" stopColor="#678b9c"/><stop offset="1" stopColor="#1a3545"/></linearGradient>
        <linearGradient id="izBody" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fff"/><stop offset=".55" stopColor="#e1e6e8"/><stop offset="1" stopColor="#9ca7ad"/></linearGradient>
        <radialGradient id="izTire"><stop offset=".55" stopColor="#24292c"/><stop offset=".72" stopColor="#0b0d0e"/><stop offset="1" stopColor="#3b4144"/></radialGradient>
        <filter id="izShadow"><feDropShadow dx="0" dy="12" stdDeviation="12" floodOpacity=".28"/></filter>
      </defs>
      <ellipse cx="485" cy="360" rx="335" ry="32" fill="#152635" opacity=".16"/>
      <g filter="url(#izShadow)">
        <path d="M330 87H784v222H330z" fill="url(#izBody)" stroke="#a3adb2" strokeWidth="3"/>
        <path d="M346 108h423M346 133h423M346 158h423M346 183h423M346 208h423M346 233h423M346 258h423" stroke="#c6cdd0"/>
        <path d="M107 306V174l47-94h132l50 103v126z" fill="url(#izCab)" stroke="#6f7e85" strokeWidth="3"/>
        <path d="M159 92h55v84h-98zM225 92h50l44 84h-94z" fill="url(#izGlass)" stroke="#516b78" strokeWidth="3"/>
        <path d="M218 89v214M115 185h215" stroke="#64747b" strokeWidth="3"/>
        <path d="M104 224H72v30h35M307 149h37v18h-32" fill="#26353c"/>
        <rect x="140" y="210" width="44" height="7" rx="3" fill="#1f2c32"/>
        <rect x="248" y="210" width="38" height="7" rx="3" fill="#1f2c32"/>
        <path d="M96 302h688v30H92z" fill="#2c393f"/>
        <path d="M338 309h446v17H338z" fill="#738087"/>
        <path d="M111 277h91l15-39h52l17 39" fill="none" stroke="#314047" strokeWidth="5"/>
        <rect x="111" y="282" width="201" height="22" rx="5" fill="#aab2b6" stroke="#647178"/>
        <circle cx="116" cy="255" r="12" fill="#f1e4ab" stroke="#465963"/><rect x="104" y="271" width="26" height="8" rx="3" fill="#d78038"/>
        <text x="136" y="270" fill="#172b38" fontSize="16" fontWeight="700" fontFamily="Arial">ISUZU</text>
      </g>
      {[188, 686].map((x) => <g key={x}><circle cx={x} cy="330" r="57" fill="url(#izTire)" stroke="#090b0c" strokeWidth="3"/><circle cx={x} cy="330" r="34" fill="#c8ced1" stroke="#727d82" strokeWidth="3"/><circle cx={x} cy="330" r="13" fill="#758187"/><circle cx={x} cy="330" r="5" fill="#eef1f2"/></g>)}
    </svg>
  );
}

export default function Configurator() {
  const [view, setView] = useState<ViewMode>("builder");
  const [truckView, setTruckView] = useState<TruckView>("exterior");
  const [step, setStep] = useState(0);
  const [brandId, setBrandId] = useState<BrandId>("freightliner");
  const brand = brands.find((item) => item.id === brandId)!;
  const [modelId, setModelId] = useState("m2-106");
  const model = brand.models.find((item) => item.id === modelId) || brand.models[0];
  const [body, setBody] = useState("Bare cab and chassis");
  const [bodySearch, setBodySearch] = useState("");
  const [accessorySearch, setAccessorySearch] = useState("");
  const [bodyCategoryFilter, setBodyCategoryFilter] = useState("All categories");
  const [bodyVariantId, setBodyVariantId] = useState("");
  const [cab, setCab] = useState("106 in BBC Day Cab");
  const [wheelbase, setWheelbase] = useState("Dealer-defined wheelbase · engineering review");
  const [axle, setAxle] = useState("4x2 single");
  const [engine, setEngine] = useState("Cummins B6.7");
  const [transmission, setTransmission] = useState("Allison automatic");
  const [suspension, setSuspension] = useState("Air ride");
  const [color, setColor] = useState(colors[0]);
  const [bodyColor, setBodyColor] = useState(colors[0]);
  const [paintTarget, setPaintTarget] = useState<"cab" | "body">("cab");
  const [completionSignatures, setCompletionSignatures] = useState<Record<number, string>>({});
  const [stepValidationMessage, setStepValidationMessage] = useState("");
  const [selectedPackage, setSelectedPackage] = useState("Custom");
  const [options, setOptions] = useState<string[]>(["Backup camera", "LED work lights"]);
  const [quoteSent, setQuoteSent] = useState(false);
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [bodyMount, setBodyMount] = useState<TruckMountConfig>(DEFAULT_ISUZU_BODY_MOUNT);
  const [modelAssets, setModelAssets] = useState<ModelAssetRecord[]>(() => createDefaultAssetRegistry());
  const [realScale, setRealScale] = useState<RealScaleConfig>(DEFAULT_REAL_SCALE);
  const [attachmentPoints, setAttachmentPoints] = useState<AttachmentPointConfig>(DEFAULT_ATTACHMENT_POINTS);
  const [interiorCamera, setInteriorCamera] = useState<InteriorCameraConfig>(DEFAULT_INTERIOR_CAMERA);
  const [accessorySlots, setAccessorySlots] = useState<AccessorySlotConfig[]>(() => DEFAULT_ACCESSORY_SLOTS.map((slot) => ({ ...slot, position:[...slot.position], rotation:[...slot.rotation], compatibleAccessories:[...slot.compatibleAccessories] })));
  const [accessoryPlacements, setAccessoryPlacements] = useState<AccessoryPlacement[]>([]);
  const [assemblyMounts, setAssemblyMounts] = useState<AssemblyMountRecord[]>([]);
  const [mountLoaded, setMountLoaded] = useState(false);
  const [adminDataLoaded, setAdminDataLoaded] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [manufacturerChosen, setManufacturerChosen] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [heroTruckIndex, setHeroTruckIndex] = useState(0);
  const [viewerFullscreen, setViewerFullscreen] = useState(false);
  const [showMeasurements, setShowMeasurements] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [job, setJob] = useState<JobProfile>(defaultJob);
  const [showAllBodies, setShowAllBodies] = useState(false);
  const [showAllModels, setShowAllModels] = useState(false);
  const [printViews, setPrintViews] = useState<PrintViewSet>({});
  const [interiorPrintPreview, setInteriorPrintPreview] = useState<string>("");
  const [printPreparedAt, setPrintPreparedAt] = useState<string>("");
  const viewerRef = useRef<HTMLElement | null>(null);
  const viewerSurfaceRef = useRef<HTMLDivElement | null>(null);
  const truckRailRef = useRef<HTMLDivElement | null>(null);

  const featuredTrucks = useMemo(() => brands.flatMap((maker) => maker.models.map((truck) => ({ maker, truck }))), []);
  const heroTruck = featuredTrucks[heroTruckIndex % featuredTrucks.length];

  useEffect(() => {
    try {
      const saved = localStorage.getItem("dtw-isuzu-dry-van-mount-v1");
      if (saved) {
        const parsed = JSON.parse(saved) as TruckMountConfig;
        if (parsed.position?.length === 3 && parsed.rotation?.length === 3 && parsed.scale?.length === 3) setBodyMount(parsed);
      }
    } catch {}
    setMountLoaded(true);
  }, []);

  useEffect(() => {
    try {
      const savedAssets = JSON.parse(localStorage.getItem("dtw-3d-model-registry-v1") || "[]") as ModelAssetRecord[];
      if (Array.isArray(savedAssets) && savedAssets.length) {
        const defaults = createDefaultAssetRegistry();
        setModelAssets(defaults.map((record) => {
          const saved = savedAssets.find((candidate) => candidate.id === record.id);
          if (!saved) return record;
          if (record.id === "isuzu:nqr:exterior" && saved.file.includes("isuzu-nqr-cab-chassis")) return record;
          return {
            ...record,
            ...saved,
            compatibility: saved.compatibility || record.compatibility,
            paintMaterials: saved.paintMaterials?.trim() || record.paintMaterials
          };
        }));
      }
      const savedScale = JSON.parse(localStorage.getItem("dtw-real-scale-v1") || "null") as RealScaleConfig | null;
      if (savedScale?.chassis && savedScale?.body) setRealScale(savedScale.targetAssetId && savedScale.targetBodyAssetId ? savedScale : { ...DEFAULT_REAL_SCALE, ...savedScale, enabled:false, verified:false, targetAssetId:"", targetBodyAssetId:"" });
      const savedAttachments = JSON.parse(localStorage.getItem("dtw-attachment-points-v1") || "null") as AttachmentPointConfig | null;
      if (savedAttachments?.frontAxle && savedAttachments?.rearAxle) setAttachmentPoints(savedAttachments);
      const savedInterior = JSON.parse(localStorage.getItem("dtw-interior-camera-v1") || "null") as InteriorCameraConfig | null;
      if (savedInterior?.eyePosition && savedInterior?.modelPosition) setInteriorCamera(savedInterior);
      const savedSlots = JSON.parse(localStorage.getItem("dtw-accessory-slots-v1") || "[]") as AccessorySlotConfig[];
      if (Array.isArray(savedSlots) && savedSlots.length) setAccessorySlots(DEFAULT_ACCESSORY_SLOTS.map((defaultSlot) => {
        const savedSlot = savedSlots.find((candidate) => candidate.id === defaultSlot.id);
        return savedSlot ? { ...defaultSlot, ...savedSlot, compatibleAccessories:Array.from(new Set([...defaultSlot.compatibleAccessories, ...savedSlot.compatibleAccessories])) } : { ...defaultSlot, position:[...defaultSlot.position], rotation:[...defaultSlot.rotation], compatibleAccessories:[...defaultSlot.compatibleAccessories] };
      }));
      const savedPlacements = JSON.parse(localStorage.getItem("dtw-accessory-placements-v1") || "[]") as AccessoryPlacement[];
      if (Array.isArray(savedPlacements)) setAccessoryPlacements(savedPlacements);
      const savedAssemblyMounts = JSON.parse(localStorage.getItem("dtw-assembly-mounts-v1") || "[]") as AssemblyMountRecord[];
      if (Array.isArray(savedAssemblyMounts)) setAssemblyMounts(savedAssemblyMounts);
    } catch {}
    setAdminDataLoaded(true);
  }, []);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(BUILD_DRAFT_KEY) || "null") as BuildDraft | null;
      if (saved?.version === 2) {
        const savedBrand = brands.find((item) => item.id === saved.brandId);
        const savedModel = savedBrand?.models.find((item) => item.id === saved.modelId);
        if (savedBrand && savedModel) {
          setBrandId(savedBrand.id);
          setModelId(savedModel.id);
          setBody(savedModel.bodies.includes(saved.body) ? saved.body : savedModel.bodies[0]);
          setBodyVariantId(saved.bodyVariantId || "");
          setCab(savedModel.cabs.includes(saved.cab) ? saved.cab : savedModel.cabs[0]);
          setWheelbase(savedModel.wheelbases.includes(saved.wheelbase) ? saved.wheelbase : savedModel.wheelbases[0]);
          setAxle(savedModel.axles.includes(saved.axle) ? saved.axle : savedModel.axles[0]);
          setEngine(savedModel.engines.includes(saved.engine) ? saved.engine : savedModel.engines[0]);
          setTransmission(savedModel.transmissions.includes(saved.transmission) ? saved.transmission : savedModel.transmissions[0]);
          setSuspension(saved.suspension || "Air ride");
          setColor(colors.find((item) => item.name === saved.colorName) || colors[0]);
          setBodyColor(colors.find((item) => item.name === saved.bodyColorName) || colors[0]);
          setCompletionSignatures(Object.fromEntries(Object.entries(saved.completionSignatures || {}).map(([key, value]) => [Number(key), value])));
          setSelectedPackage(saved.selectedPackage || "Custom");
          setOptions(Array.isArray(saved.options) ? saved.options : []);
          setAccessoryPlacements(Array.isArray(saved.accessoryPlacements) ? saved.accessoryPlacements : []);
          setJob(saved.job ? { ...defaultJob, ...saved.job } : defaultJob);
          setStep(Math.min(6, Math.max(0, saved.step || 0)));
          setDraftSavedAt(saved.savedAt || null);
          setManufacturerChosen(true);
        }
      }
    } catch {}
    setDraftLoaded(true);
  }, []);

  useEffect(() => {
    if (!mountLoaded) return;
    try { localStorage.setItem("dtw-isuzu-dry-van-mount-v1", JSON.stringify(bodyMount)); } catch {}
  }, [bodyMount, mountLoaded]);

  useEffect(() => {
    if (!adminDataLoaded) return;
    try {
      localStorage.setItem("dtw-3d-model-registry-v1", JSON.stringify(modelAssets));
      localStorage.setItem("dtw-real-scale-v1", JSON.stringify(realScale));
      localStorage.setItem("dtw-attachment-points-v1", JSON.stringify(attachmentPoints));
      localStorage.setItem("dtw-interior-camera-v1", JSON.stringify(interiorCamera));
      localStorage.setItem("dtw-accessory-slots-v1", JSON.stringify(accessorySlots));
      localStorage.setItem("dtw-accessory-placements-v1", JSON.stringify(accessoryPlacements));
      localStorage.setItem("dtw-assembly-mounts-v1", JSON.stringify(assemblyMounts));
    } catch {}
  }, [modelAssets, realScale, attachmentPoints, interiorCamera, accessorySlots, accessoryPlacements, assemblyMounts, adminDataLoaded]);

  useEffect(() => {
    if (!draftLoaded || !manufacturerChosen) return;
    const savedAt = new Date().toISOString();
    const draft: BuildDraft = {
      version: 2,
      savedAt,
      step,
      brandId,
      modelId: model.id,
      body,
      bodyVariantId,
      cab,
      wheelbase,
      axle,
      engine,
      transmission,
      suspension,
      colorName: color.name,
      bodyColorName: bodyColor.name,
      completionSignatures,
      selectedPackage,
      options,
      accessoryPlacements,
      job
    };
    try {
      localStorage.setItem(BUILD_DRAFT_KEY, JSON.stringify(draft));
      setDraftSavedAt(savedAt);
    } catch {}
  }, [draftLoaded, manufacturerChosen, step, brandId, model.id, body, bodyVariantId, cab, wheelbase, axle, engine, transmission, suspension, color.name, bodyColor.name, completionSignatures, selectedPackage, options, accessoryPlacements, job]);

  useEffect(() => {
    setAccessoryPlacements((current) => current.filter((placement) => options.includes(placement.accessory)));
  }, [options]);

  useEffect(() => {
    setOptions((current) => current.filter((name) => {
      if (brandId === "freightliner" && !freightlinerAccessories.includes(name)) return false;
      return equipmentCompatible(brandId, model.id, name);
    }));
  }, [brandId, model.id]);

  useEffect(() => {
    const timer = window.setInterval(() => setHeroTruckIndex((current) => (current + 1) % featuredTrucks.length), 5200);
    return () => window.clearInterval(timer);
  }, [featuredTrucks.length]);

  useEffect(() => {
    const rail = truckRailRef.current;
    if (!rail) return;
    const timer = window.setInterval(() => {
      const atEnd = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 20;
      rail.scrollTo({ left: atEnd ? 0 : rail.scrollLeft + 260, behavior: "smooth" });
    }, 3600);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const variants = bodyVariantsFor(brandId, model, body);
    if (!variants.some((variant) => variant.id === bodyVariantId)) setBodyVariantId(variants[0]?.id || "");
  }, [body, bodyVariantId, brandId, model]);

  useEffect(() => {
    const updateFullscreenState = () => setViewerFullscreen(document.fullscreenElement === viewerSurfaceRef.current);
    document.addEventListener("fullscreenchange", updateFullscreenState);
    return () => document.removeEventListener("fullscreenchange", updateFullscreenState);
  }, []);

  const selectBrand = (id: BrandId, preferredModelId?: string) => {
    const nextBrand = brands.find((item) => item.id === id)!;
    const nextModel = nextBrand.models.find((item) => item.id === preferredModelId) || nextBrand.models[0];
    setBrandId(id);
    setTruckView("exterior");
    setModelId(nextModel.id);
    setBody(nextModel.bodies[0]);
    setCab(nextModel.cabs[0]);
    setWheelbase(nextModel.wheelbases[0]);
    setAxle(nextModel.axles[0]);
    setEngine(nextModel.engines[0]);
    setTransmission(nextModel.transmissions[0]);
    setSelectedPackage("Custom");
    setBodySearch("");
    setBodyCategoryFilter("All categories");
    setShowAllBodies(false);
    setShowAllModels(false);
    setQuoteSent(false);
  };

  const startManufacturer = (id: BrandId, preferredModelId?: string) => {
    selectBrand(id, preferredModelId);
    setStep(0);
    setCompletionSignatures({});
    setStepValidationMessage("");
    setManufacturerChosen(true);
  };

  const selectModel = (id: string) => {
    const next = brand.models.find((item) => item.id === id)!;
    setModelId(id);
    setBody(next.bodies[0]);
    setCab(next.cabs[0]);
    setWheelbase(next.wheelbases[0]);
    setAxle(next.axles[0]);
    setEngine(next.engines[0]);
    setTransmission(next.transmissions[0]);
    setBodySearch("");
    setBodyCategoryFilter("All categories");
    setShowAllBodies(false);
    setShowAllModels(false);
    setQuoteSent(false);
  };

  const selectFeaturedTruck = (nextBrand: Brand, nextModel: TruckModel) => {
    setBrandId(nextBrand.id);
    setTruckView("exterior");
    setModelId(nextModel.id);
    setBody(nextModel.bodies[0]);
    setCab(nextModel.cabs[0]);
    setWheelbase(nextModel.wheelbases[0]);
    setAxle(nextModel.axles[0]);
    setEngine(nextModel.engines[0]);
    setTransmission(nextModel.transmissions[0]);
    setStep(0);
    setQuoteSent(false);
    window.setTimeout(() => document.getElementById("builder")?.scrollIntoView({ behavior: "smooth" }), 80);
  };

  const resetBuild = () => {
    const nextBrand = brands.find((item) => item.id === "freightliner")!;
    const nextModel = nextBrand.models[0];
    setBrandId(nextBrand.id);
    setModelId(nextModel.id);
    setTruckView("exterior");
    setStep(0);
    setBody(nextModel.bodies[0]);
    setBodyVariantId("");
    setAccessorySearch("");
    setCab(nextModel.cabs[0]);
    setWheelbase(nextModel.wheelbases[0]);
    setAxle(nextModel.axles[0]);
    setEngine(nextModel.engines[0]);
    setTransmission(nextModel.transmissions[0]);
    setSuspension("Air ride");
    setColor(colors[0]);
    setBodyColor(colors[0]);
    setPaintTarget("cab");
    setCompletionSignatures({});
    setStepValidationMessage("");
    setSelectedPackage("Custom");
    setOptions([]);
    setAccessoryPlacements([]);
    setJob(defaultJob);
    setShowAllBodies(false);
    setShowAllModels(false);
    setQuoteSent(false);
    setManufacturerChosen(false);
    try { localStorage.removeItem(BUILD_DRAFT_KEY); } catch {}
    setDraftSavedAt(null);
  };

  const applyPackage = (name: string) => {
    const pkg = (brandId === "freightliner" ? freightlinerPackages : packages).find((item) => item.name === name)!;
    setSelectedPackage(name);
    if (pkg.body && model.bodies.includes(pkg.body)) setBody(pkg.body);
    setOptions((current) => Array.from(new Set([...current, ...pkg.options.filter((item) => equipmentCompatible(brandId, model.id, item))])));
  };

  const placeAccessory = (accessory: string, slotId: string) => {
    setAccessoryPlacements((current) => {
      const withoutAccessory = current.filter((placement) => placement.accessory !== accessory);
      return slotId ? [...withoutAccessory, { accessory, slotId }] : withoutAccessory;
    });
  };

  const activePackages = (brandId === "freightliner" ? freightlinerPackages : packages).filter((item) => !item.body || (model.bodies.includes(item.body) && (brandId !== "freightliner" || freightlinerBodyFit(model.id, item.body) !== "incompatible")));
  const selectedPackageData = activePackages.find((item) => item.name === selectedPackage) || activePackages[0];
  const activeBodyVariants = bodyVariantsFor(brandId, model, body);
  const bodyVariant = activeBodyVariants.find((variant) => variant.id === bodyVariantId) || activeBodyVariants[0];
  const wheelbaseIn = Number.parseFloat(wheelbase);
  const sizing = getTruckSizing(brandId, model.id, cab, wheelbase, bodyVariant?.lengthFt);
  const mountableOptions = options.filter((item) => accessorySlots.some((slot) => slot.compatibleAccessories.includes(item)));
  const searchableBodyCatalog = brandId === "isuzu" || brandId === "freightliner";
  const priorityBodies = brandId === "freightliner" ? priorityFreightlinerBodies : priorityIsuzuBodies;
  const vocationTerms: Record<string, string[]> = {
    "General delivery": ["delivery", "regional", "urban"],
    "Refrigerated delivery": ["delivery", "refrigerated", "regional"],
    "Construction / dump": ["dump", "construction", "vocational", "heavy"],
    "Landscape": ["landscape", "delivery", "vocational"],
    "Utility / service": ["utility", "service", "municipal"],
    "Towing / recovery": ["towing", "rollback", "heavy"],
    "Municipal / environmental": ["municipal", "refuse", "vocational"],
    "Custom / other": []
  };
  const modelRecommendation = (item: TruckModel) => {
    const haystack = `${item.name} ${item.description} ${item.applications.join(" ")} ${item.engines.join(" ")}`.toLowerCase();
    const matchedVocation = (vocationTerms[job.vocation] || []).find((term) => haystack.includes(term));
    const reasons: string[] = [];
    const factors: { label: string; result: "positive" | "negative" | "review"; detail: string }[] = [];
    let score = 56;
    if (matchedVocation) { score += 16; reasons.push(`Built for ${job.vocation.toLowerCase()} work.`); factors.push({ label: "Vocation", result: "positive", detail: `Published applications include ${matchedVocation}.` }); }
    else { score -= 9; reasons.push(`Its published applications do not directly cover ${job.vocation.toLowerCase()}.`); factors.push({ label: "Vocation", result: "negative", detail: `No direct ${job.vocation.toLowerCase()} application match was found.` }); }

    const requestedFuel = job.fuel.toLowerCase().replace("battery ", "");
    if (job.fuel === "No preference") { score += 4; factors.push({ label: "Fuel", result: "review", detail: "No fuel preference was entered." }); }
    else if (haystack.includes(requestedFuel)) { score += 12; reasons.push(`Supports the requested ${job.fuel.toLowerCase()} powertrain.`); factors.push({ label: "Fuel", result: "positive", detail: `${job.fuel} appears in this chassis powertrain choices.` }); }
    else { score -= 12; reasons.push(`Does not show the requested ${job.fuel.toLowerCase()} powertrain.`); factors.push({ label: "Fuel", result: "negative", detail: `${job.fuel} is not listed for this chassis.` }); }

    const payloadClassMatch =
      job.payload === "Not sure yet" ||
      (job.payload === "Under 5,000 lb" && /3|4|5/.test(item.className)) ||
      (job.payload === "5,000–10,000 lb" && /4|5|6/.test(item.className)) ||
      (job.payload === "10,000–20,000 lb" && /6|7/.test(item.className)) ||
      (job.payload === "Over 20,000 lb" && /7|8/.test(item.className));
    if (payloadClassMatch) {
      score += job.payload === "Not sure yet" ? 4 : 12;
      factors.push({ label: "Payload / class", result: job.payload === "Not sure yet" ? "review" : "positive", detail: job.payload === "Not sure yet" ? "Payload is still unknown and requires dealer sizing." : `${item.className} is a reasonable planning class for ${job.payload}.` });
    } else { score -= 13; reasons.push(`Its chassis class may fall short of the ${job.payload.toLowerCase()} request.`); factors.push({ label: "Payload / class", result: "negative", detail: `${item.className} is not the preferred planning class for ${job.payload}.` }); }

    const routeMatch = job.route === "Mixed use" || (job.route === "Local / urban" && /(urban|delivery|short|maneuver)/.test(haystack)) || (job.route === "Highway / regional" && /(regional|highway|long|haul)/.test(haystack)) || (job.route === "Jobsite / off-road" && /(vocational|construction|severe|heavy)/.test(haystack));
    if (routeMatch) { score += 7; factors.push({ label: "Operating pattern", result: "positive", detail: `The published duty profile suits ${job.route.toLowerCase()} operation.` }); }
    else { score -= 5; factors.push({ label: "Operating pattern", result: "negative", detail: `The published duty profile does not clearly support ${job.route.toLowerCase()} use.` }); }
    const crewMatch = job.crew === "1–3 people" || item.cabs.some((choice) => choice.toLowerCase().includes("crew"));
    if (crewMatch) { score += job.crew === "1–3 people" ? 2 : 6; factors.push({ label: "Crew", result: "positive", detail: job.crew === "1–3 people" ? "A standard cab can support the requested crew." : "A crew-cab choice is listed." }); }
    else { score -= 9; reasons.push("No listed cab supports the requested crew size."); factors.push({ label: "Crew", result: "negative", detail: `No listed cab clearly supports ${job.crew}.` }); }
    const finalScore = Math.max(35, Math.min(96, score));
    const band = finalScore >= 85 ? "Strong fit" : finalScore >= 70 ? "Good fit with review items" : finalScore >= 55 ? "Possible with compromises" : "Not recommended";
    if (!reasons.length) reasons.push("Matches the entered requirements, subject to dealer verification.");
    return { score: finalScore, band, reasons: reasons.slice(0, 2), factors };
  };
  const rankedModels = [...brand.models].sort((a, b) => modelRecommendation(b).score - modelRecommendation(a).score);
  const displayedModels = showAllModels ? rankedModels : rankedModels.filter((item, index) => index < 4 || item.id === model.id);
  const bodyCatalogFiltered = model.bodies.filter((item) => (bodyCategoryFilter === "All categories" || bodyCategory(brandId, item) === bodyCategoryFilter || item === "Cab & Chassis" || item === "Bare cab and chassis") && item.toLowerCase().includes(bodySearch.toLowerCase()));
  const bodyRecommendationTerms: Record<string, string[]> = {
    "General delivery": ["dry", "box", "van", "delivery", "cargo"],
    "Refrigerated delivery": ["refrigerated", "reefer", "insulated", "temperature"],
    "Construction / dump": ["dump", "flatbed", "mixer", "contractor", "equipment"],
    "Landscape": ["landscape", "stake", "flatbed", "chipper", "leaf"],
    "Utility / service": ["utility", "service", "mechanic", "crane", "aerial"],
    "Towing / recovery": ["rollback", "wrecker", "carrier", "towing"],
    "Municipal / environmental": ["refuse", "sweeper", "sewer", "vacuum", "tank", "municipal", "snow"],
    "Custom / other": []
  };
  const recommendedBodyNames = bodyCatalogFiltered.filter((item) => (bodyRecommendationTerms[job.vocation] || []).some((term) => item.toLowerCase().includes(term)));
  const visibleBodies = searchableBodyCatalog && !showAllBodies && bodyCategoryFilter === "All categories" && !bodySearch
    ? bodyCatalogFiltered.filter((item) => recommendedBodyNames.includes(item) || priorityBodies.has(item) || item === body).slice(0, 8)
    : bodyCatalogFiltered;
  const selectedVariantFit = bodyVariant ? bodyVariantFit(brandId, model, cab, wheelbase, bodyVariant) : "review";
  useEffect(() => {
    if (!bodyVariant || selectedVariantFit !== "incompatible") return;
    const firstValid = activeBodyVariants.find((variant) => bodyVariantFit(brandId, model, cab, wheelbase, variant) !== "incompatible");
    setBodyVariantId(firstValid?.id || "");
  }, [brandId, body, bodyVariant?.id, cab, model.id, selectedVariantFit, wheelbase]);
  const activeOptionCatalog = brandId === "freightliner" ? Object.fromEntries(freightlinerAccessories.map((name) => [name, optionCatalog[name] || 0])) : optionCatalog;
  const filteredAccessoryEntries = Object.entries(activeOptionCatalog).filter(([name]) => name.toLowerCase().includes(accessorySearch.trim().toLowerCase()));
  const optionTotal = options.reduce((sum, item) => sum + (activeOptionCatalog[item] || 0), 0);
  const bodyPrice = bodyCatalog[body]?.price || 0;
  const chassisAdjust = axle.includes("8x") ? 24500 : axle.includes("6x") ? 12500 : 0;
  const cabAdjust = cab.includes("Sleeper") ? 28000 : cab.includes("Crew") ? 11500 : cab.includes("Extended") ? 7500 : 0;
  const estimateAvailable = model.baseEstimate > 0;
  const estimate = estimateAvailable ? model.baseEstimate + bodyPrice + chassisAdjust + cabAdjust + optionTotal + selectedPackageData.price : 0;
  const monthly = estimateAvailable ? Math.round((estimate * .9) * (.074 / 12) / (1 - Math.pow(1 + .074 / 12, -72))) : 0;

  const fit = useMemo(() => {
    let score = 62;
    if (brandId === "freightliner" && model.id === "m2-106") score += 13;
    if (body === "Vacuum / Tank") score += 12;
    if (color.name === "Arctic White") score += 5;
    if (wheelbase.includes("200")) score += 6;
    return Math.min(98, score);
  }, [brandId, model.id, body, color.name, wheelbase]);

  const buildId = `DTW-${brandId === "isuzu" ? "ISU" : brandId === "freightliner" ? "FRT" : "WS"}-2026-${String(413 + leads.length).padStart(5, "0")}`;

  const findAsset = (makerId: string, truckId: string, kind: ModelAssetRecord["kind"], variant?: string) => modelAssets.find((asset) => asset.brandId === makerId && asset.modelId === truckId && asset.kind === kind && (variant === undefined || asset.variant === variant)) || (kind === "body" ? modelAssets.find((asset) => asset.brandId === makerId && asset.modelId === `all-${makerId}` && asset.kind === "body" && asset.variant === variant) : undefined);
  const exteriorAsset = findAsset(brandId, model.id, "exterior");
  const interiorAsset = findAsset(brandId, model.id, "interior");
  const selectedBodyAsset = findAsset(brandId, model.id, "body", body);
  const completeTruckAsset = findAsset(brandId, model.id, "complete", body);
  const completeTruckAvailable = Boolean(completeTruckAsset?.status !== "missing" && completeTruckAsset?.file);
  const activeBodyAsset = completeTruckAsset?.status !== "missing" ? completeTruckAsset : selectedBodyAsset;
  const freightlinerFit = brandId === "freightliner" ? freightlinerBodyFit(model.id, body) : null;
  const bodyCompatibility = freightlinerFit === "incompatible" ? "incompatible" : activeBodyAsset?.compatibility || "review";
  const activePaintAsset = completeTruckAvailable ? completeTruckAsset : exteriorAsset;
  const paintPreviewActive = Boolean(activePaintAsset?.paintMaterials?.trim());
  const bareBodySelected = ["cab & chassis", "bare cab and chassis"].includes(body.toLowerCase()) || body.toLowerCase().includes("straight-truck chassis");
  const bodyPaintPreviewActive = !bareBodySelected && Boolean(selectedBodyAsset?.paintMaterials?.trim() || selectedBodyAsset?.status === "missing");
  const selectedPaintColor = paintTarget === "cab" ? color : bodyColor;
  const setSelectedPaintColor = paintTarget === "cab" ? setColor : setBodyColor;
  const activeVisualStatus = completeTruckAvailable ? completeTruckAsset!.status : exteriorAsset?.status || "missing";
  const heroExteriorAsset = findAsset(heroTruck.maker.id, heroTruck.truck.id, "exterior");
  const heroBodyName = heroTruck.maker.id === "isuzu" ? "Standard dry box / van body" : "Dry Van Box";
  const heroBodyAsset = findAsset(heroTruck.maker.id, heroTruck.truck.id, "body", heroBodyName);
  const activeAssemblyMount = assemblyMounts.find((profile) => profile.chassisAssetId === exteriorAsset?.id && profile.bodyAssetId === selectedBodyAsset?.id && (profile.bodyVariantId === (bodyVariant?.id || "default") || profile.bodyVariantId === "default"))?.mount || bodyMount;

  const currentStepSignatures = [
    JSON.stringify(job),
    JSON.stringify([brandId, model.id]),
    JSON.stringify([cab, wheelbase, axle, engine, transmission, suspension]),
    JSON.stringify([body, bodyVariant?.id || ""]),
    JSON.stringify([selectedPackage, [...options].sort(), accessoryPlacements]),
    JSON.stringify([color.name, bodyColor.name]),
    JSON.stringify([brandId, model.id, body, bodyVariant?.id || "", cab, wheelbase, axle, engine, transmission, color.name, bodyColor.name, [...options].sort()])
  ];
  const stepReady = [
    Boolean(job.vocation && job.payload && job.route && job.crew && job.fuel && job.quantity && job.delivery),
    Boolean(brandId && model.id),
    Boolean(cab && wheelbase && axle && engine && transmission && suspension),
    Boolean(body && (activeBodyVariants.length === 0 || bodyVariant)),
    Boolean(selectedPackage),
    Boolean(color.name && (bareBodySelected || bodyColor.name)),
    Boolean(quoteSent)
  ];
  const isStepComplete = (stepIndex: number) => stepIndex === 6 ? quoteSent : Boolean(completionSignatures[stepIndex] && completionSignatures[stepIndex] === currentStepSignatures[stepIndex]);
  const confirmStepAndContinue = () => {
    if (!stepReady[step]) {
      setStepValidationMessage("Finish the required choices in this step before continuing.");
      return;
    }
    setCompletionSignatures((current) => ({ ...current, [step]: currentStepSignatures[step] }));
    setStepValidationMessage("");
    setStep(Math.min(6, step + 1));
  };

  useEffect(() => setStepValidationMessage(""), [step]);

  const submitQuote = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const lead: Lead = {
      id: buildId,
      customer: String(form.get("name") || "Web customer"),
      company: String(form.get("company") || "—"),
      brand: brand.name,
      model: model.name,
      body: bodyVariant ? `${body} · ${bodyVariant.label}` : body,
      value: estimate,
      fit,
      status: "New"
    };
    setLeads((current) => [lead, ...current]);
    try { localStorage.setItem("dtw-latest-build", JSON.stringify({ lead, cab, wheelbase, axle, engine, transmission, suspension, color, options, accessoryPlacements, bodyVariant, bodyMount, realScale, assetStatus: { exterior: exteriorAsset?.status, completeTruck: completeTruckAsset?.status, body: activeBodyAsset?.status, compatibility: bodyCompatibility } })); } catch {}
    setQuoteSent(true);
  };

  const changeViewAngle = (orbit: string) => viewerRef.current?.setAttribute("camera-orbit", orbit);
  const toggleViewerFullscreen = async () => {
    if (document.fullscreenElement === viewerSurfaceRef.current) return document.exitFullscreen();
    if (document.fullscreenElement) await document.exitFullscreen();
    await viewerSurfaceRef.current?.requestFullscreen?.();
  };

  const printBuild = async () => {
    if (document.fullscreenElement) await document.exitFullscreen();
    setTruckView("exterior");
    setShowMeasurements(false);
    const waitForPaint = async (milliseconds = 0) => {
      if (milliseconds) await new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    };
    await waitForPaint(80);
    const viewer = viewerRef.current as PaintableModelViewer | null;
    viewer?.removeAttribute("auto-rotate");
    viewer?.setAttribute("field-of-view", "28deg");
    const viewDefinitions: Array<{ name: PrintViewName; orbit: string; preset: PrintViewName }> = [
      { name: "front", orbit: "0deg 90deg auto", preset: "front" },
      { name: "rear", orbit: "180deg 90deg auto", preset: "rear" },
      { name: "left", orbit: "-90deg 90deg auto", preset: "left" },
      { name: "right", orbit: "90deg 90deg auto", preset: "right" },
      { name: "top", orbit: "0deg 0deg auto", preset: "top" }
    ];
    const captured: PrintViewSet = {};
    for (const definition of viewDefinitions) {
      if (viewer) {
        viewer.setAttribute("camera-orbit", definition.orbit);
        try { await viewer.updateComplete; } catch {}
      } else {
        viewerSurfaceRef.current?.querySelector(".modular-truck-viewer")?.dispatchEvent(new CustomEvent("dtw-print-view", { detail: { preset: definition.preset } }));
      }
      await waitForPaint(90);
      try {
        captured[definition.name] = viewer?.toDataURL?.("image/png", 0.94) || viewerSurfaceRef.current?.querySelector<HTMLCanvasElement>(".modular-truck-viewer canvas")?.toDataURL("image/png", 0.94) || "";
      } catch {
        captured[definition.name] = "";
      }
    }

    viewer?.setAttribute("camera-orbit", "35deg 70deg auto");
    viewerSurfaceRef.current?.querySelector(".modular-truck-viewer")?.dispatchEvent(new CustomEvent("dtw-print-view", { detail: { preset: "three-quarter" } }));
    setPrintViews(captured);

    let interiorImage = "";
    const interiorAvailable = Boolean(interiorAsset?.status !== "missing" && interiorAsset?.file);
    if (interiorAvailable) {
      setTruckView("interior");
      await waitForPaint(220);
      try { interiorImage = viewerSurfaceRef.current?.querySelector<HTMLCanvasElement>(".interior-cab-viewer canvas")?.toDataURL("image/png", 0.94) || ""; } catch {}
      setTruckView("exterior");
      await waitForPaint(80);
    }
    setInteriorPrintPreview(interiorImage);
    setPrintPreparedAt(new Date().toLocaleString([], { dateStyle: "medium", timeStyle: "short" }));
    await waitForPaint(80);
    window.print();
  };

  const visualSource = exteriorAsset?.file || "";
  const interiorActive = truckView === "interior";
  const displayedVisualSource = interiorActive ? interiorAsset?.file || "" : visualSource;
  useEffect(() => { viewerRef.current = null; }, [brandId, model.id, displayedVisualSource, completeTruckAsset?.file]);
  const exactVisual = completeTruckAsset?.status === "exact" || (exteriorAsset?.status === "exact" && (body === "Cab & Chassis" || selectedBodyAsset?.status === "exact"));
  const heroVisualSource = heroExteriorAsset?.file || "";
  const activePhaseIndex = phases.findIndex((phase) => phase.steps.includes(step));
  const activePhase = phases[Math.max(0, activePhaseIndex)];
  const completedStepCount = steps.filter((_, index) => isStepComplete(index)).length;
  const buildProgress = Math.round((completedStepCount / steps.length) * 100);

  return (
    <main className={view === "builder" ? "site-shell builder-compact" : "site-shell"} data-build-step={step} style={{ "--brand": brand.accent } as React.CSSProperties}>
      <header className="topbar configurator-topbar">
        <button className="brand-lockup" onClick={() => { setView("builder"); setManufacturerChosen(false); }} aria-label="Return to manufacturer selection"><span><strong>Diehl Truck</strong><small>Configurator</small></span></button>
        {view === "builder" ? <nav className="cockpit-nav" aria-label="Configurator steps">
          <button className={!manufacturerChosen ? "active" : ""} onClick={() => setManufacturerChosen(false)}>Manufacturer</button>
          {steps.map((label, index) => <button key={label} disabled={!manufacturerChosen} className={manufacturerChosen && step === index ? "active" : isStepComplete(index) ? "complete" : ""} onClick={() => { setManufacturerChosen(true); setStep(index); }}>{index === 0 ? "Job Info" : index === 2 ? "Config" : label}</button>)}
        </nav> : <div className="admin-header-title">3D asset and alignment workspace</div>}
        <div className="header-actions">{view === "builder" ? <><button className="button ghost small header-summary" onClick={() => setSummaryOpen(true)}>Summary</button><button className="button primary small save-build-action" onClick={() => setSummaryOpen(true)}>Save Build</button><button className="admin-icon-button" onClick={() => setView("alignment")} aria-label="Open 3D Admin">⚙</button></> : <button className="button ghost small" onClick={() => setView("builder")}>Back to builder</button>}</div>
      </header>

      {view === "builder" && !manufacturerChosen
        ? <ManufacturerLanding onChoose={startManufacturer} assets={modelAssets}/>
        : view === "builder" ? <>
        <section className="builder-workspace-shell" id="top">
        <section className="builder-intro" id="builder"><div><span className="eyebrow dark">DIEHL&apos;S GUIDED TRUCK BUILDER</span><h1>Build around the work.</h1><p>Answer a few practical questions. We&apos;ll narrow the chassis and upfit choices, then Diehl&apos;s verifies the final specification.</p></div><div className="builder-draft-tools"><div className="build-security"><span>●</span><strong>{draftSavedAt ? "Progress saved" : "Private build"}</strong><small>{draftSavedAt ? `On this device · ${new Date(draftSavedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : "Your selections save automatically"}</small></div><button className="button ghost small" onClick={resetBuild}>Start over</button></div></section>

        <section className="builder-context" aria-label="Manufacturer and current build"><div className="maker-switch"><span>Manufacturer</span><div>{brands.map((item) => <button key={item.id} onClick={() => selectBrand(item.id)} className={brandId === item.id ? "active" : ""}><b>{item.id === "western-star" ? "WS" : item.name.slice(0, 2).toUpperCase()}</b><span>{item.name}</span></button>)}</div></div><button className="context-summary" onClick={() => setSummaryOpen(true)}><span><small>Current build</small><strong>{brand.name} {model.name}</strong></span><span><small>Body</small><strong>{body}</strong></span><span><small>Estimate</small><strong>{estimateAvailable ? money(estimate) : "Dealer quote"}</strong></span><b>View summary →</b></button></section>

        <div className="phase-navigation" aria-label="Build progress" style={{ "--build-progress": `${buildProgress}%` } as React.CSSProperties}><div className="phase-progress-copy"><span>Step {step + 1} of {steps.length}</span><strong>{activePhase.label}</strong><small>{isStepComplete(step) ? "✓ Current step confirmed" : `${steps[step]} · not confirmed`}</small><div className="build-progress-meter" aria-label={`${buildProgress}% of build confirmed`}><i/><b>{buildProgress}%</b></div></div><div className="phase-track">{phases.map((phase, index) => { const complete = phase.steps.every(isStepComplete); return <button key={phase.label} onClick={() => setStep(phase.steps[0])} className={`${index === activePhaseIndex ? "active" : ""}${complete ? " complete" : " incomplete"}`}><span>{complete ? "✓" : index + 1}</span><strong>{phase.label}</strong><small>{complete ? "Complete" : phase.detail}</small></button>; })}</div><div className="phase-substeps">{activePhase.steps.map((phaseStep) => <button key={steps[phaseStep]} className={`${step === phaseStep ? "active" : ""}${isStepComplete(phaseStep) ? " complete" : ""}`} onClick={() => setStep(phaseStep)}>{isStepComplete(phaseStep) ? "✓ " : ""}{steps[phaseStep]}</button>)}</div></div>

        <section className="config-layout" data-step={step}>
          <div className="config-main">
            <div className="viewer-card">
              <div className="viewer-heading"><div><span className="live-build-label"><i/> LIVE PREVIEW</span><h3>{brand.name} {model.name}</h3><p>{body}{bodyVariant ? ` · ${bodyVariant.label}` : ""} · {wheelbase} · {axle}</p></div><span className={exactVisual ? "visual-badge exact" : activeVisualStatus === "missing" ? "visual-badge missing" : "visual-badge"}>{interiorActive ? interiorAsset?.status === "reference" ? "Reference interior · not exact" : interiorAsset?.status === "exact" ? "Exact interior" : "Interior model missing" : exactVisual ? "Exact verified model" : completeTruckAvailable ? "Complete truck reference · chassis unverified" : exteriorAsset?.status === "reference" ? "Reference model · not exact" : "3D model missing"}</span></div>
              <div className="viewer-surface" ref={viewerSurfaceRef}>
                <div className="viewer-mode-toggle" aria-label="Choose exterior or interior view"><button className={truckView === "exterior" ? "active" : ""} onClick={() => setTruckView("exterior")}>Exterior</button><button className={truckView === "interior" ? "active" : ""} onClick={() => setTruckView("interior")}>Interior</button><button className={showMeasurements ? "active" : ""} onClick={() => setShowMeasurements((current) => !current)} aria-pressed={showMeasurements}>Measurements</button></div>
                {interiorActive
                  ? interiorAsset?.status !== "missing" && displayedVisualSource
                    ? <InteriorCabViewer key={displayedVisualSource} src={displayedVisualSource} config={interiorCamera}/>
                    : <MissingModelState brandId={brandId} body={body} bodyLengthFt={bodyVariant?.lengthFt} wheelbaseIn={wheelbaseIn} color={color.hex} interior model={`${brand.name} ${model.name}`} requirement="Interior GLB"/>
                  : completeTruckAvailable
                    ? <ModelViewer key={completeTruckAsset!.file} src={completeTruckAsset!.file} color={color.hex} paintMaterials={completeTruckAsset?.paintMaterials} viewerRef={viewerRef}/>
                    : !exteriorAsset || exteriorAsset.status === "missing" || !visualSource
                    ? <MissingModelState brandId={brandId} body={body} bodyLengthFt={bodyVariant?.lengthFt} wheelbaseIn={wheelbaseIn} accessoryPlacements={accessoryPlacements} color={color.hex} model={`${brand.name} ${model.name}`} requirement="Exterior cab-and-chassis GLB"/>
                    : brandId === "isuzu" && model.id === "nrr-ev"
                      ? <ModularTruckViewer body={body} bodyAssetStatus={selectedBodyAsset?.status} mount={activeAssemblyMount} dimensions={realScale} measurementLabels={showMeasurements ? { overall: formatFeetAndInches(sizing.completedOverallLengthIn || sizing.chassisOverallLengthIn), wheelbase: formatInches(sizing.wheelbaseIn), bodyLength: bodyVariant?.lengthFt ? `${bodyVariant.label}` : "Not specified", width: formatInches(sizing.chassisOverallWidthIn), height: `${formatInches(sizing.chassisOverallHeightIn)} cab`, verified: sizing.confidence === "oem" } : undefined} assetId={exteriorAsset.id} bodyAssetId={selectedBodyAsset?.id} attachments={attachmentPoints} wheelbaseIn={wheelbaseIn} bodyLengthFt={bodyVariant?.lengthFt} nominalBodyLengthFt={selectedBodyAsset?.nominalLengthFt} bodySizingMode={selectedBodyAsset?.bodySizingMode} accessorySlots={accessorySlots} accessoryPlacements={accessoryPlacements} chassisSrc={visualSource} bodySrc={selectedBodyAsset?.file || "/models/isuzu-dry-van-body.glb"} color={color.hex} paintMaterials={exteriorAsset?.paintMaterials} bodyColor={bodyColor.hex} bodyPaintMaterials={selectedBodyAsset?.paintMaterials} showFullscreen={false}/>
                      : <ModelViewer key={displayedVisualSource} src={displayedVisualSource} color={color.hex} paintMaterials={exteriorAsset?.paintMaterials} viewerRef={viewerRef}/>}
                {!interiorActive && brandId !== "isuzu" && <div className="viewer-controls"><button onClick={() => changeViewAngle("0deg 72deg auto")}>Front</button><button onClick={() => changeViewAngle("90deg 72deg auto")}>Side</button><button onClick={() => changeViewAngle("180deg 72deg auto")}>Rear</button><button onClick={() => changeViewAngle("35deg 70deg auto")}>3/4</button></div>}
                {interiorActive && <div className="interior-look-hint"><b>Interior look-around</b><span>Drag to look left, right, up and down</span></div>}
                {!interiorActive && showMeasurements && <div className="measurement-confidence" role="status">{exactVisual && realScale.enabled ? "Verified dimensions where configured" : "Planning dimensions · final verification required"}</div>}
                {!interiorActive && accessoryPlacements.length > 0 && (completeTruckAvailable || exteriorAsset?.status !== "missing") && brandId !== "isuzu" && <div className="accessory-visual-warning">{accessoryPlacements.length} placement{accessoryPlacements.length === 1 ? "" : "s"} saved · modular accessory GLBs required for live 3D</div>}
                <button className="viewer-surface-fullscreen" onClick={toggleViewerFullscreen} aria-label={viewerFullscreen ? "Exit fullscreen viewer" : "Open fullscreen viewer"}>{viewerFullscreen ? "↙ Exit fullscreen" : "⛶ Fullscreen"}</button>
                <aside className="fullscreen-build-panel" aria-hidden={!viewerFullscreen}>
                  <div className="fullscreen-panel-head"><div><span className="eyebrow dark">LIVE CONFIGURATION</span><strong>{brand.name} {model.name}</strong><small>{buildId}</small></div><button onClick={toggleViewerFullscreen} aria-label="Exit fullscreen">×</button></div>
                  <div className="fullscreen-quick-fields">
                    <label><span>Working body</span><select value={body} onChange={(event) => setBody(event.target.value)}>{model.bodies.map((item) => { const modularAsset = findAsset(brandId, model.id, "body", item); const fullAsset = findAsset(brandId, model.id, "complete", item); const asset = fullAsset?.status !== "missing" ? fullAsset : modularAsset; const incompatible = asset?.compatibility === "incompatible" || (brandId === "freightliner" && freightlinerBodyFit(model.id, item) === "incompatible"); return <option key={item} value={item} disabled={incompatible}>{item}{incompatible ? " · incompatible" : ""}</option>; })}</select></label>
                    <label><span>Body size / capacity</span><select value={bodyVariant?.id || ""} onChange={(event) => setBodyVariantId(event.target.value)}>{activeBodyVariants.map((variant) => <option key={variant.id} value={variant.id} disabled={bodyVariantFit(brandId, model, cab, wheelbase, variant) === "incompatible"}>{variant.label}{bodyVariantFit(brandId, model, cab, wheelbase, variant) === "incompatible" ? " · does not fit" : ""}</option>)}</select></label>
                    <label><span>Cab</span><select value={cab} onChange={(event) => setCab(event.target.value)}>{model.cabs.map((item) => <option key={item}>{item}</option>)}</select></label>
                    <label><span>Wheelbase</span><select value={wheelbase} onChange={(event) => setWheelbase(event.target.value)}>{model.wheelbases.map((item) => <option key={item}>{item}</option>)}</select></label>
                    <label><span>Powertrain</span><select value={engine} onChange={(event) => setEngine(event.target.value)}>{model.engines.map((item) => <option key={item} disabled={!powertrainAxleCompatible(model.id, item, axle)}>{item}{!powertrainAxleCompatible(model.id, item, axle) ? " · incompatible with selected axle" : ""}</option>)}</select></label>
                    <label><span>Cab color</span><select value={color.name} onChange={(event) => setColor(colors.find((item) => item.name === event.target.value) || colors[0])}>{colors.map((item) => <option key={item.name}>{item.name}</option>)}</select></label>
                    <label><span>Body color</span><select value={bodyColor.name} onChange={(event) => setBodyColor(colors.find((item) => item.name === event.target.value) || colors[0])}>{colors.map((item) => <option key={item.name}>{item.name}</option>)}</select></label>
                  </div>
                  <div className="fullscreen-price"><span>Dealer planning estimate</span><strong>{estimateAvailable ? money(estimate) : "Dealer quote required"}</strong><small>{estimateAvailable ? `Approx. ${money(monthly)}/mo illustrative` : "No chassis price has been entered"}</small></div>
                  <div className="fullscreen-fit"><b>{fit}%</b><span><strong>{fit >= 90 ? "Strong inventory match" : fit >= 80 ? "Near inventory match" : "Factory-order fit"}</strong><small>Dealer review required</small></span></div>
                  <div className={`fullscreen-validation ${bodyCompatibility}`}>{bodyCompatibility === "verified" ? "✓ Compatibility verified" : bodyCompatibility === "incompatible" ? "× Body marked incompatible" : freightlinerFit === "primary" ? "Primary application · engineering validation required" : freightlinerFit === "trailer" ? "Trailer configuration · fifth-wheel validation required" : "⚠ Engineering review required"}</div>
                  <div className="fullscreen-panel-actions"><button className="button ghost" onClick={() => void printBuild()}>Print build</button><button className="button primary" onClick={() => { setStep(6); void toggleViewerFullscreen(); }}>Request review</button></div>
                </aside>
              </div>
              <div className="viewer-note"><span>{interiorActive ? "◎ First-person cabin view · drag to look around" : "↻ Drag to rotate · scroll to zoom"}</span><span>{realScale.enabled && realScale.targetAssetId === exteriorAsset?.id && realScale.targetBodyAssetId === selectedBodyAsset?.id ? "Verified measurements applied · scene units are meters" : "Scale and model accuracy remain unverified until approved in 3D Admin"}</span></div>
              {sizing.confidence === "oem" && <div className="sizing-strip" aria-label="OEM chassis sizing"><div><span>Wheelbase</span><strong>{formatInches(sizing.wheelbaseIn)}</strong></div><div><span>Cab to axle</span><strong>{formatInches(sizing.cabToAxleIn)}</strong></div><div><span>OEM body range</span><strong>{sizing.bodyMinFt === sizing.bodyMaxFt ? `${sizing.bodyMinFt} ft` : `${sizing.bodyMinFt}–${sizing.bodyMaxFt} ft`}</strong></div><div><span>Completed OAL</span><strong>{formatFeetAndInches(sizing.completedOverallLengthIn || sizing.chassisOverallLengthIn)}</strong></div><div className={sizing.bodyLengthFit === "outside-oem-envelope" ? "size-fit bad" : "size-fit good"}><span>{sizing.bodyLengthFit === "outside-oem-envelope" ? "Does not fit" : sizing.bodyLengthFit === "fits-oem-envelope" ? "Fits OEM envelope" : "Select body size"}</span><small>{sizing.source}</small></div></div>}
              <div className="viewer-build-summary viewer-build-summary-collapsed">
                <div className="viewer-summary-title"><div><span className="eyebrow dark">YOUR BUILD</span><strong>{brand.name} {model.name}</strong><small>{buildId}</small></div><div><span>Planning estimate</span><strong>{estimateAvailable ? money(estimate) : "Dealer quote required"}</strong><small>{estimateAvailable ? `Approx. ${money(monthly)}/mo illustrative` : "Chassis pricing not entered"}</small></div></div>
                <div className="viewer-summary-specs"><div><span>Body</span><strong>{body}{bodyVariant ? ` · ${bodyVariant.label}` : ""}</strong></div><div><span>Cab</span><strong>{cab}</strong></div><div><span>Wheelbase</span><strong>{wheelbase}</strong></div><div><span>Powertrain</span><strong>{engine}</strong></div></div>
                <div className="viewer-summary-bottom"><div className="compact-fit"><b>{fit}%</b><span><strong>{fit >= 90 ? "Strong inventory match" : fit >= 80 ? "Near inventory match" : "Factory-order fit"}</strong><small>Dealer inventory review required</small></span></div><div className="viewer-summary-actions"><button className="button ghost" onClick={() => void printBuild()}>Print</button><button className="button primary" onClick={() => setStep(6)}>Request review</button></div></div>
                <div className={`build-validation ${bodyCompatibility}`}><strong>{bodyCompatibility === "verified" ? "✓ Body compatibility verified" : bodyCompatibility === "incompatible" ? "× This body is not offered on the selected chassis" : freightlinerFit === "primary" ? "Primary application · final engineering still required" : freightlinerFit === "trailer" ? "Trailer-only configuration · fifth-wheel review required" : "⚠ Body compatibility requires engineering review"}</strong><span>{activeBodyAsset?.status === "missing" ? "3D body model is also missing." : activeBodyAsset?.status === "reference" ? "Displayed truck/body is a reference model, not an exact verified asset." : "Exact model asset recorded."}</span></div>
              </div>
            </div>

            <div className="configuration-card" aria-live="polite" key={`configuration-step-${step}`}>
              <div className="configuration-kicker"><span>{activePhase.label}</span><strong>{steps[step]}</strong><small>Step {step + 1} of {steps.length}</small></div>
              <div className="configuration-scroll">
              <div className={isStepComplete(step) ? "guided-step-note complete" : "guided-step-note"}><span>{isStepComplete(step) ? "✓" : step + 1}</span><p>{stepGuidance[step]}</p><small>{isStepComplete(step) ? "Confirmed" : step < 6 ? `Next: ${steps[step + 1]}` : "Final step"}</small></div>
              {step === 0 && <><SectionHead number="01" title="Tell us what the truck needs to do" copy="Plain-language answers help Diehl's recommend and verify the right chassis, body and equipment."/><JobQuestionnaire value={job} onChange={setJob}/></>}
              {step === 1 && <><SectionHead number="02" title={`Choose a ${brand.name} chassis`} copy={`Recommended around ${job.vocation.toLowerCase()}, ${job.route.toLowerCase()} use and ${job.payload.toLowerCase()} payload.`}/><div className="recommendation-note"><strong>{showAllModels ? `All ${brand.models.length} ${brand.name} chassis` : "Best starting matches"}</strong><span>Fit scores explain the planning match; Diehl&apos;s still verifies GVWR, payload, axle loading and body fit.</span><button onClick={() => setShowAllModels((current) => !current)}>{showAllModels ? "Show recommended" : `View all ${brand.models.length}`}</button></div><div className="model-grid">{displayedModels.map((item, index) => { const asset = findAsset(brand.id, item.id, "exterior"); const completePreview = modelAssets.find((candidate) => candidate.brandId === brand.id && candidate.modelId === item.id && candidate.kind === "complete" && candidate.status !== "missing" && candidate.file); const recommendation = modelRecommendation(item); return <button key={item.id} onClick={() => selectModel(item.id)} className={model.id === item.id ? "model-option selected" : "model-option"}><ModelCardThumbnail brandId={brand.id} model={item} asset={completePreview || asset} color={color.hex}/><div><span className="class-tag">{!showAllModels && index < 4 ? `${recommendation.score >= 55 ? "Recommended" : "Review"} · ${item.className}` : item.className}</span><strong>{item.name}</strong><p>{item.description}</p><span className={`model-asset-flag ${asset?.status || "missing"}`}>{asset?.status === "exact" ? "Exact vehicle representation" : asset?.status === "reference" ? "Representative preview" : "Preview coming soon"}</span><div className={`recommendation-fit ${recommendation.score < 55 ? "not-recommended" : recommendation.score < 70 ? "compromise" : ""}`}><span className="fit-score-popover" tabIndex={0} role="button" aria-label={`View ${recommendation.score}% fit details for ${item.name}`}><b>{recommendation.score}%</b><span className="fit-reasoning-popover" role="tooltip"><strong>{recommendation.band}</strong>{recommendation.factors.map((factor) => <span key={factor.label} className={factor.result}><b>{factor.result === "positive" ? "+" : factor.result === "negative" ? "−" : "•"}</b><span><em>{factor.label}</em><small>{factor.detail}</small></span></span>)}<i>Planning score only. Dealer verification required.</i></span></span><span><strong>{recommendation.band}</strong><small>{recommendation.reasons.join(" ")}</small></span></div></div><dl><div><dt>GVWR</dt><dd>{item.gvwr}</dd></div><div><dt>Power</dt><dd>{item.hp}</dd></div></dl><span className="select-label">{model.id === item.id ? "Selected ✓" : "Select chassis"}</span></button>; })}</div></>}
              {step === 2 && <><SectionHead number="03" title="Configure cab, chassis and power" copy="Only valid combinations remain selectable; final frame layout and ratings require body-builder validation."/><SelectGroup title="Cab configuration" values={model.cabs} value={cab} onChange={setCab}/><SelectGroup title="Planning wheelbase" values={model.wheelbases} value={wheelbase} onChange={setWheelbase} isDisabled={(item) => !powertrainWheelbaseCompatible(model.id, engine, item)}/><SelectGroup title="Axle configuration" values={model.axles} value={axle} onChange={setAxle} isDisabled={(item) => !powertrainAxleCompatible(model.id, engine, item)}/><SelectGroup title="Engine / battery" values={model.engines} value={engine} onChange={setEngine} isDisabled={(item) => !powertrainAxleCompatible(model.id, item, axle) || !powertrainWheelbaseCompatible(model.id, item, wheelbase)}/><SelectGroup title="Transmission" values={model.transmissions} value={transmission} onChange={setTransmission}/><SelectGroup title="Suspension" values={["Spring", "Air ride", "Vocational air ride", "Walking beam · where available"]} value={suspension} onChange={setSuspension}/><div className="power-summary"><div><span>Published power range</span><strong>{model.hp}</strong></div><div><span>Published torque range</span><strong>{model.torque}</strong></div><div><span>Selected drive</span><strong>{axle}</strong></div></div></>}
              {step === 3 && <><SectionHead number="04" title="Select the working body" copy="Start with recommended body families. Open the complete catalog only when you need a specialized upfit."/>{searchableBodyCatalog && <BodyCatalogControls brandId={brandId} search={bodySearch} onSearch={setBodySearch} category={bodyCategoryFilter} onCategory={setBodyCategoryFilter} count={visibleBodies.length} total={model.bodies.length} expanded={showAllBodies} onExpanded={setShowAllBodies}/>}<div className="body-grid">{visibleBodies.map((item) => { const modularAsset = findAsset(brandId, model.id, "body", item); const fullAsset = findAsset(brandId, model.id, "complete", item); const asset = fullAsset?.status !== "missing" ? fullAsset : modularAsset; const data = bodyCatalog[item]; const applicationFit = brandId === "freightliner" ? freightlinerBodyFit(model.id, item) : null; const incompatible = applicationFit === "incompatible" || asset?.compatibility === "incompatible"; const compatibility = incompatible ? "incompatible" : asset?.compatibility || "review"; const priority = brandId === "freightliner" ? priorityFreightlinerBodies.has(item) : priorityIsuzuBodies.has(item); return <button key={item} disabled={incompatible} onClick={() => !incompatible && setBody(item)} className={`${body === item ? "body-option selected" : "body-option"}${incompatible ? " incompatible" : ""}`}><span className="body-icon">{data?.icon || "◇"}</span><div><strong>{item}</strong><p>{data?.description || `${bodyCategory(brandId, item)} upfit request`}</p><small>{data?.price ? `Planning allowance +${money(data.price)}` : "Dealer/upfitter quote required"}</small><span className={`compatibility-flag ${compatibility}`}>{incompatible ? "Not compatible with this chassis" : applicationFit === "primary" ? "Primary application · validation required" : applicationFit === "trailer" ? "Trailer-only configuration" : applicationFit === "review" ? "Engineering review required" : asset?.compatibility === "verified" ? "✓ Compatibility verified" : "Compatible application · engineering review"}</span><span className={`model-asset-flag ${asset?.status || "missing"}`}>{asset?.status === "exact" ? "Exact modular body model" : asset?.status === "reference" ? "Reference body · not exact" : priority ? "Priority body model required" : "3D body model required"}</span></div><i>{incompatible ? "×" : body === item ? "✓" : "+"}</i></button>; })}</div>{visibleBodies.length === 0 && <div className="body-search-empty">No body types match this search.</div>}<BodyVariantSelector family={body} variants={activeBodyVariants} value={bodyVariant?.id || ""} onChange={setBodyVariantId} fit={(variant) => bodyVariantFit(brandId, model, cab, wheelbase, variant)}/></>}
              {step === 4 && <><SectionHead number="05" title="Choose equipment and placement" copy="Use a starting package, search for a specific item, then add only compatible equipment."/><h4>Vocational starting package</h4><div className="package-row">{activePackages.map((item) => <button key={item.name} onClick={() => applyPackage(item.name)} className={selectedPackage === item.name ? "package selected" : "package"}><strong>{item.name}</strong><small>{item.description}</small></button>)}</div><div className="option-search"><label><span>Search equipment and accessories</span><div><b>⌕</b><input value={accessorySearch} onChange={(event) => setAccessorySearch(event.target.value)} placeholder="Try camera, lift gate, lighting, PTO…"/>{accessorySearch && <button onClick={() => setAccessorySearch("")} aria-label="Clear equipment search">×</button>}</div></label><small>{filteredAccessoryEntries.length} of {Object.keys(activeOptionCatalog).length} items shown</small></div><div className="option-grid">{filteredAccessoryEntries.map(([name, price]) => { const compatible = equipmentCompatible(brandId, model.id, name); return <label key={name} className={compatible ? "check-option" : "check-option incompatible"}><input type="checkbox" disabled={!compatible} checked={compatible && options.includes(name)} onChange={(event) => setOptions((current) => event.target.checked ? [...current, name] : current.filter((item) => item !== name))}/><span><strong>{name}</strong><small>{compatible ? price > 0 ? `+${money(price)}` : "Dealer/upfitter quote" : "Not compatible with selected chassis"}</small></span></label>; })}</div>{filteredAccessoryEntries.length === 0 && <div className="body-search-empty">No equipment or accessories match “{accessorySearch}”.</div>}<EquipmentPlacementBuilder accessories={mountableOptions} slots={accessorySlots} placements={accessoryPlacements} onChange={placeAccessory}/></>}
              {step === 5 && <>
                <SectionHead number="06" title="Choose appearance" copy="Choose the surface first, then select a paint color and confirm it on the truck."/>
                <div className="paint-flow" aria-label="Paint selection workflow">
                  <div className="paint-flow-step"><span>1</span><div><strong>Choose what to paint</strong><small>Cab and body colors are saved separately.</small></div></div>
                  <div className="paint-targets">
                    <button className={paintTarget === "cab" ? "selected" : ""} onClick={() => setPaintTarget("cab")}><span className="target-preview cab" style={{ "--paint-color": color.hex } as React.CSSProperties}/><div><strong>Cab</strong><small>{color.name}</small></div><b>{paintTarget === "cab" ? "✓" : "→"}</b></button>
                    <button className={paintTarget === "body" ? "selected" : ""} onClick={() => setPaintTarget("body")} disabled={bareBodySelected}><span className="target-preview body" style={{ "--paint-color": bodyColor.hex } as React.CSSProperties}/><div><strong>Truck body</strong><small>{bareBodySelected ? "Choose a body first" : bodyColor.name}</small></div><b>{paintTarget === "body" ? "✓" : "→"}</b></button>
                  </div>
                  <div className="paint-flow-step"><span>2</span><div><strong>Select {paintTarget === "cab" ? "cab" : "body"} color</strong><small>Clicking a swatch updates the live model immediately.</small></div><span className={(paintTarget === "cab" ? paintPreviewActive : bodyPaintPreviewActive) ? "paint-readiness active" : "paint-readiness"}>{(paintTarget === "cab" ? paintPreviewActive : bodyPaintPreviewActive) ? "● Live preview" : "○ Request only"}</span></div>
                  <div className="color-row paint-swatches">{colors.map((item) => <button key={`${paintTarget}-${item.name}`} className={selectedPaintColor.name === item.name ? "color selected" : "color"} onClick={() => setSelectedPaintColor(item)} aria-label={`Paint ${paintTarget} ${item.name}`} aria-pressed={selectedPaintColor.name === item.name}><span style={{ background: item.hex }}/><small>{item.name}</small></button>)}</div>
                  <div className="paint-confirmation"><span style={{ background: selectedPaintColor.hex }}/><div><strong>{paintTarget === "cab" ? "Cab" : "Body"}: {selectedPaintColor.name}</strong><small>{(paintTarget === "cab" ? paintPreviewActive : bodyPaintPreviewActive) ? "Applied to the live preview and saved with this build." : "Saved as a paint request. This model still needs a mapped paint surface for live preview."}</small></div></div>
                </div>
                <p className="paint-note">For reliable live colors, source GLBs should use matte white or very light neutral gray on paintable panels. Green is not recommended because it changes the appearance of red, white and light paint choices. Glass, tires, chrome, lights and chassis materials remain separate.</p>
                <div className="appearance-request"><strong>Branding and finish</strong><p>Logo upload, wrap placement, reflective striping and specialty body finish remain requests until Diehl&apos;s and the upfitter confirm artwork and materials.</p></div>
              </>}
              {step === 6 && <QuotePanel sent={quoteSent} buildId={buildId} brand={brand} model={model} body={`${body}${bodyVariant ? ` · ${bodyVariant.label}` : ""}`} estimate={estimate} estimateAvailable={estimateAvailable} fit={fit} onSubmit={submitQuote} onPrint={() => void printBuild()}/>}
              {stepValidationMessage && <div className="step-validation-message" role="alert">{stepValidationMessage}</div>}
              </div>
              {step < 6 && <div className="panel-nav"><button className="button ghost" onClick={() => step === 0 ? setManufacturerChosen(false) : setStep(step - 1)}>← {step === 0 ? "Manufacturer" : "Back"}</button><button className="button primary" onClick={confirmStepAndContinue}>Confirm &amp; continue <span>→</span><small>{steps[step + 1]}</small></button></div>}
            </div>
          </div>

          <aside className="build-summary">
            <div className="summary-top"><span className="eyebrow dark">YOUR BUILD</span><strong>{brand.name} {model.name}</strong><small>Build reference {buildId}</small></div>
            <div className="summary-specs"><SummaryLine label="Body" value={`${body}${bodyVariant ? ` · ${bodyVariant.label}` : ""}`}/><SummaryLine label="Cab" value={cab}/><SummaryLine label="Wheelbase" value={wheelbase}/><SummaryLine label="Completed overall length" value={formatFeetAndInches(sizing.completedOverallLengthIn || sizing.chassisOverallLengthIn)}/><SummaryLine label="Cab to axle" value={formatInches(sizing.cabToAxleIn)}/><SummaryLine label="Engine" value={engine}/><SummaryLine label="Transmission" value={transmission}/><SummaryLine label="Axles" value={axle}/></div>
            <div className="estimate-block"><div><span>Dealer planning estimate</span><strong>{estimateAvailable ? money(estimate) : "Dealer quote required"}</strong></div><p id="finance">{estimateAvailable ? <>Approx. <b>{money(monthly)}/mo</b> with 10% down · 72 months · 7.4% illustrative APR</> : "No chassis price is stored for this model; the build will be priced by commercial sales."}</p></div>
            <div className="inventory-match" id="inventory"><div className="match-score"><span>{fit}%</span><i style={{ "--score": `${fit}%` } as React.CSSProperties}/></div><div><strong>{fit >= 90 ? "Strong inventory match" : fit >= 80 ? "Near inventory match" : "Factory-order fit"}</strong><p>{fit >= 90 ? "A similar truck may be available or inbound." : "Diehl's will review current stock and incoming chassis."}</p></div></div>
            <button className="button primary full" onClick={() => setStep(6)}>Request build review</button><button className="button ghost full" onClick={() => void printBuild()}>Print / save build</button>
            <p className="estimate-disclaimer">Planning estimates are not manufacturer MSRP or a dealer offer. Final specifications, body compatibility, pricing, incentives, taxes and lead time require Diehl&apos;s review.</p>
          </aside>
        </section>

        <div className={summaryOpen ? "summary-drawer-backdrop open" : "summary-drawer-backdrop"} onClick={() => setSummaryOpen(false)} aria-hidden={!summaryOpen}/>
        <aside className={summaryOpen ? "summary-drawer open" : "summary-drawer"} aria-hidden={!summaryOpen} aria-label="Build summary"><div className="summary-drawer-head"><div><span>BUILD SUMMARY</span><strong>{brand.name} {model.name}</strong><small>{buildId}</small></div><button onClick={() => setSummaryOpen(false)} aria-label="Close build summary">×</button></div><div className="summary-drawer-stage"><span>{brand.name}</span><strong>{model.name}</strong><p>{body}{bodyVariant ? ` · ${bodyVariant.label}` : ""}</p></div><div className="summary-drawer-specs"><SummaryLine label="Job" value={job.vocation}/><SummaryLine label="GVWR" value={model.gvwr}/><SummaryLine label="Cab" value={cab}/><SummaryLine label="Wheelbase" value={wheelbase}/><SummaryLine label="Completed overall length" value={formatFeetAndInches(sizing.completedOverallLengthIn || sizing.chassisOverallLengthIn)}/><SummaryLine label="Powertrain" value={engine}/><SummaryLine label="Cab color" value={color.name}/><SummaryLine label="Body color" value={bareBodySelected ? "No body selected" : bodyColor.name}/></div><div className="summary-drawer-price"><span>Planning estimate</span><strong>{estimateAvailable ? money(estimate) : "Dealer quote required"}</strong><small>Final price, availability and engineering require review.</small></div><div className="summary-drawer-actions"><button className="button ghost" onClick={() => void printBuild()}>Print specification</button><button className="button primary" onClick={() => { setStep(6); setSummaryOpen(false); }}>Review and request quote</button></div></aside>
        </section>

        <section className="print-document" aria-hidden="true">
          <header className="print-header"><div><span className="print-logo">DTW</span><span><strong>Diehl&apos;s Truck World</strong><small>Preliminary Truck Specification</small></span></div><div><span>BUILD ID</span><strong>{buildId}</strong><small>Revision 01 · Customer planning build</small></div></header>
          <div className="print-status"><strong>SUBMITTED FOR DIEHL&apos;S REVIEW</strong><span>Not a purchase order, receipt, final quote or engineering approval</span></div>
          <section className="print-hero"><div className="print-truck-frame">{printViews.front ? <img src={printViews.front} alt={`Standardized front view of ${brand.name} ${model.name}`}/> : <div><strong>Truck preview unavailable</strong><span>Open Print from the builder to capture the standardized inspection views.</span></div>}<small>Front planning view · geometry status: {exactVisual ? "exact/verified where recorded" : "reference or concept"}</small></div><div className="print-build-title"><span>{brand.name}</span><h1>{model.name}</h1><p>{body}{bodyVariant ? ` · ${bodyVariant.label}` : ""}</p><dl><div><dt>Planning estimate</dt><dd>{estimateAvailable ? money(estimate) : "Dealer quote required"}</dd></div><div><dt>Inventory fit</dt><dd>{fit}% · dealer review</dd></div><div><dt>Generated</dt><dd>{printPreparedAt || "At print time"}</dd></div></dl></div></section>
          <section className="print-section print-views-section"><h2>Configured truck inspection views</h2><div className="print-view-grid">{(["front", "rear", "left", "right", "top"] as PrintViewName[]).map((viewName) => <figure key={viewName}>{printViews[viewName] ? <img src={printViews[viewName]} alt={`${viewName} view of configured ${brand.name} ${model.name}`}/> : <div>View unavailable</div>}<figcaption>{viewName === "rear" ? "Rear" : viewName.charAt(0).toUpperCase() + viewName.slice(1)} view</figcaption></figure>)}</div><p className="print-view-note">All views are captured from the same configured truck state. Images remain planning representations until the underlying chassis and body geometry are verified.</p></section>
          {interiorAsset?.status !== "missing" && interiorAsset?.file && <section className="print-section print-interior-section"><h2>Interior configuration</h2><div className="print-interior-frame">{interiorPrintPreview ? <img src={interiorPrintPreview} alt={`Driver interior view of ${brand.name} ${model.name}`}/> : <div><strong>Interior preview not available</strong><span>The interior asset is recorded but could not be captured.</span></div>}<small>{interiorCamera.verified ? "Verified driver eye point" : "Reference driver eye point · calibration required"}</small></div></section>}
          <section className="print-section"><h2>Customer requirement</h2><div className="print-spec-grid"><SummaryLine label="Vocation" value={job.vocation}/><SummaryLine label="Operating pattern" value={job.route}/><SummaryLine label="Requested payload" value={job.payload}/><SummaryLine label="Crew" value={job.crew}/><SummaryLine label="Quantity" value={job.quantity}/><SummaryLine label="Desired delivery" value={job.delivery}/><SummaryLine label="Power preference" value={job.fuel}/><SummaryLine label="Customer notes" value={job.notes || "None entered"}/></div></section>
        <section className="print-section"><h2>Requested configuration</h2><div className="print-spec-grid"><SummaryLine label="Manufacturer / model" value={`${brand.name} ${model.name}`}/><SummaryLine label="GVWR range" value={model.gvwr}/><SummaryLine label="Cab" value={cab}/><SummaryLine label="Wheelbase" value={wheelbase}/><SummaryLine label="Cab to axle" value={formatInches(sizing.cabToAxleIn)}/><SummaryLine label="Cab to end of frame" value={formatInches(sizing.cabToEndFrameIn)}/><SummaryLine label="Completed overall length" value={formatFeetAndInches(sizing.completedOverallLengthIn || sizing.chassisOverallLengthIn)}/><SummaryLine label="OEM body envelope" value={sizing.bodyMinFt === null ? "Dealer engineering required" : sizing.bodyMinFt === sizing.bodyMaxFt ? `${sizing.bodyMinFt} ft` : `${sizing.bodyMinFt}–${sizing.bodyMaxFt} ft`}/><SummaryLine label="Axle configuration" value={axle}/><SummaryLine label="Suspension" value={suspension}/><SummaryLine label="Powertrain" value={engine}/><SummaryLine label="Transmission" value={transmission}/><SummaryLine label="Body" value={body}/><SummaryLine label="Body size / capacity" value={bodyVariant?.label || "Not specified"}/><SummaryLine label="Sizing source" value={sizing.source}/><SummaryLine label="Cab color" value={color.name}/><SummaryLine label="Body color" value={bareBodySelected ? "No body selected" : bodyColor.name}/><SummaryLine label="Equipment package" value={selectedPackage}/></div></section>
          <section className="print-section print-two-col"><div><h2>Equipment and placement</h2>{options.length ? <ul>{options.map((item) => { const placement = accessoryPlacements.find((candidate) => candidate.accessory === item); const slot = accessorySlots.find((candidate) => candidate.id === placement?.slotId); return <li key={item}><strong>{item}</strong><span>{slot?.label || "Placement / pricing to be confirmed"}</span></li>; })}</ul> : <p>No equipment selected.</p>}</div><div><h2>Items requiring review</h2><ul><li><strong>Payload and axle loading</strong><span>Final body, equipment and cargo weights required</span></li><li><strong>Body and wheelbase fit</strong><span>{bodyCompatibility === "verified" ? "Recorded as verified; reconfirm for final order" : "Engineering/upfitter review required"}</span></li><li><strong>3D accuracy</strong><span>{exactVisual ? "Exact geometry recorded where configured" : "Displayed geometry is reference/concept only"}</span></li><li><strong>Price and lead time</strong><span>Dealer and upfitter quote required</span></li></ul></div></section>
          <footer className="print-footer"><p>This document records a customer request for planning and quotation. Final specifications, payload, axle ratings, dimensions, regulatory compliance, price, availability and production timing require written approval by Diehl&apos;s Truck World and the applicable manufacturer or upfitter.</p><div><span>Customer / company</span><span>Diehl&apos;s reviewer</span><span>Date / revision</span></div></footer>
        </section>

        <section className="how" id="how-it-works"><div><span className="eyebrow">FROM IDEA TO DELIVERY</span><h2>A commercial-truck process,<br/>not a car configurator.</h2></div><div className="how-grid"><article><span>01</span><h3>Define the work</h3><p>Start with payload, body type, route and operating environment.</p></article><article><span>02</span><h3>Engineer the chassis</h3><p>Diehl&apos;s validates wheelbase, weight distribution, PTO and upfit clearances.</p></article><article><span>03</span><h3>Match or order</h3><p>Compare the build to available inventory, inbound trucks and factory slots.</p></article><article><span>04</span><h3>Quote and deliver</h3><p>Finalize body, financing, incentives, production timing and delivery.</p></article></div></section>

        <footer id="contact"><div className="footer-brand"><span className="logo-mark">DTW</span><div><strong>Diehl&apos;s Truck World</strong><p>Commercial trucks, bodies, financing and service.</p></div></div><div className="source-note"><strong>Configuration sources</strong><p>Model ranges and published specifications are based on current official information from <a href="https://www.isuzucv.com/en/all" target="_blank" rel="noreferrer">Isuzu Commercial Truck</a>, <a href="https://www.freightliner.com/trucks/" target="_blank" rel="noreferrer">Freightliner Trucks</a>, and <a href="https://www.westernstartrucks.com/trucks/" target="_blank" rel="noreferrer">Western Star Trucks</a>. Dealer validation is required.</p></div><div><strong>Commercial sales</strong><p><a href="tel:+17188988800">(718) 898-8800</a><br/>New York</p><details className="dealer-tools"><summary>Dealer tools</summary><button onClick={() => setView("sales")}>Sales workspace</button><button onClick={() => setView("alignment")}>3D model admin</button></details></div></footer>
      </> : view === "alignment"
        ? <AlignmentAdmin mount={bodyMount} onChange={setBodyMount} assemblyMounts={assemblyMounts} onAssemblyMountsChange={setAssemblyMounts} assets={modelAssets} onAssetsChange={setModelAssets} dimensions={realScale} onDimensionsChange={setRealScale} attachments={attachmentPoints} onAttachmentsChange={setAttachmentPoints} interiorCamera={interiorCamera} onInteriorCameraChange={setInteriorCamera} accessorySlots={accessorySlots} onAccessorySlotsChange={setAccessorySlots} onBack={() => setView("builder")}/>
        : <SalesWorkspace leads={leads} onBack={() => setView("builder")}/>}
    </main>
  );
}

function ManufacturerLanding({ onChoose, assets }: { onChoose: (id: BrandId, modelId?: string) => void; assets: ModelAssetRecord[] }) {
  const details: Record<BrandId, { label: string; use: string; mark: string }> = {
    isuzu: { label: "Low-cab-forward trucks", use: "Delivery, landscape, service and urban work", mark: "IZ" },
    freightliner: { label: "Medium and heavy duty", use: "Vocational, municipal, delivery and fleet work", mark: "FL" },
    "western-star": { label: "Severe-duty vocational", use: "Construction, hauling and demanding jobsites", mark: "WS" }
  };
  return <section className="manufacturer-landing" id="builder">
    <div className="manufacturer-landing-copy"><span className="eyebrow dark">START YOUR CONFIGURATION</span><h1>Choose your manufacturer</h1><p>Select a chassis brand and base model to begin your configuration. Every choice stays connected to the live 3D build.</p></div>
    <div className="manufacturer-choice-grid" aria-label="Choose a truck manufacturer">
      {brands.map((item) => { const detail = details[item.id]; const featured = item.models.slice(0, 2); return <article key={item.id} className="manufacturer-column" style={{ "--maker-accent": item.accent } as React.CSSProperties}>
        <header><span className="manufacturer-choice-mark">{detail.mark}</span><div><small>{detail.label}</small><strong>{item.name}</strong></div><b>{item.models.length} models</b></header>
        <div className="manufacturer-featured-models">{featured.map((truck) => { const asset = assets.find((candidate) => candidate.brandId === item.id && candidate.modelId === truck.id && candidate.kind === "complete" && candidate.status !== "missing" && candidate.file) || assets.find((candidate) => candidate.brandId === item.id && candidate.modelId === truck.id && candidate.kind === "exterior"); return <button key={truck.id} className="manufacturer-model-card" onClick={() => onChoose(item.id, truck.id)}>
          <ModelCardThumbnail brandId={item.id} model={truck} asset={asset} color="#ffffff"/>
          <span><strong>{truck.name}</strong><small>{truck.className} · {truck.gvwr}</small><p>{truck.description}</p></span><b>Start with this model <span>→</span></b>
        </button>; })}</div>
        <button className="manufacturer-browse-all" onClick={() => onChoose(item.id)}>Browse all {item.name} models <span>→</span></button>
      </article>; })}
    </div>
    <p className="manufacturer-landing-help">Not sure which model fits the job? Start with any truck—Diehl&apos;s will verify payload, body fit, axle loading and final specifications.</p>
  </section>;
}

function SectionHead({ number, title, copy }: { number: string; title: string; copy: string }) {
  return <div className="section-head"><span>{number}</span><div><h3>{title}</h3><p>{copy}</p></div></div>;
}

function InfoTip({ label, children }: { label: string; children: React.ReactNode }) {
  return <span className="info-tip"><button type="button" aria-label={`More information about ${label}`}>i</button><span className="info-popover" role="tooltip"><strong>{label}</strong><span>{children}</span></span></span>;
}

function JobQuestionnaire({ value, onChange }: { value: JobProfile; onChange: (value: JobProfile) => void }) {
  const update = (key: keyof JobProfile, next: string) => onChange({ ...value, [key]: next });
  const vocations = [
    ["General delivery", "▣", "Parcel, furniture and local freight"],
    ["Construction / dump", "◢", "Aggregate, debris and jobsite work"],
    ["Landscape", "♧", "Materials, equipment and green waste"],
    ["Utility / service", "◇", "Tools, parts and mobile service"],
    ["Towing / recovery", "↗", "Vehicle transport and recovery"],
    ["Municipal / environmental", "◎", "Public works and environmental duty"],
    ["Refrigerated delivery", "❄", "Temperature-controlled cargo"],
    ["Custom / other", "+", "Tell Diehl's what you need"]
  ];
  return <div className="job-questionnaire">
    <fieldset className="vocation-question"><legend>What is the truck&apos;s main job?</legend><p>Choose the closest match. You can explain anything unusual below.</p><div className="vocation-grid">{vocations.map(([name, icon, detail]) => <button type="button" key={name} className={value.vocation === name ? "selected" : ""} onClick={() => update("vocation", name)}><i>{icon}</i><span><strong>{name}</strong><small>{detail}</small></span><b>{value.vocation === name ? "✓" : ""}</b></button>)}</div></fieldset>
    <label><span>Approximate payload <InfoTip label="Payload">The weight of cargo, tools, people and mounted equipment the truck must carry. This is different from GVWR.</InfoTip></span><select value={value.payload} onChange={(event) => update("payload", event.target.value)}><option>Not sure yet</option><option>Under 5,000 lb</option><option>5,000–10,000 lb</option><option>10,000–20,000 lb</option><option>Over 20,000 lb</option></select></label>
    <label><span>Operating pattern <InfoTip label="Operating pattern">Choose where the truck will spend most of its time. Urban stops, highway miles and jobsite use affect powertrain and chassis recommendations.</InfoTip></span><select value={value.route} onChange={(event) => update("route", event.target.value)}><option>Local / urban</option><option>Highway / regional</option><option>Jobsite / off-road</option><option>Mixed use</option></select></label>
    <label><span>Crew size <InfoTip label="Crew size">Include the driver and everyone who normally rides in the cab. Larger crews may require a crew-cab configuration.</InfoTip></span><select value={value.crew} onChange={(event) => update("crew", event.target.value)}><option>1–3 people</option><option>4–7 people</option><option>8+ people</option></select></label>
    <label><span>Power preference <InfoTip label="Power preference">Choose a fuel or energy type only if your operation requires it. Route length, payload and charging or fueling access still need verification.</InfoTip></span><select value={value.fuel} onChange={(event) => update("fuel", event.target.value)}><option>No preference</option><option>Gasoline</option><option>Diesel</option><option>Battery electric</option><option>Natural gas</option></select></label>
    <label><span>Quantity</span><select value={value.quantity} onChange={(event) => update("quantity", event.target.value)}><option>1 truck</option><option>2–5 trucks</option><option>6–20 trucks</option><option>21+ trucks</option></select></label>
    <label><span>Desired delivery</span><select value={value.delivery} onChange={(event) => update("delivery", event.target.value)}><option>Planning / no fixed date</option><option>As soon as possible</option><option>Within 3 months</option><option>3–6 months</option><option>6–12 months</option><option>12+ months</option></select></label>
    <label className="job-notes"><span>Anything Diehl&apos;s should know?</span><textarea value={value.notes} placeholder="Cargo, equipment, road conditions, CDL preference, existing truck, required body features…" onChange={(event) => update("notes", event.target.value)}/></label>
    <div className="job-guidance"><span>✓</span><div><strong>Not sure is okay</strong><p>These answers guide recommendations; they do not approve payload, axle loading or body compatibility.</p></div></div>
  </div>;
}

function MissingModelState({ model, requirement, brandId, body, bodyLengthFt, wheelbaseIn, accessoryPlacements, color, interior = false, compact = false }: { model: string; requirement: string; brandId: string; body: string; bodyLengthFt?: number; wheelbaseIn?: number; accessoryPlacements?: AccessoryPlacement[]; color: string; interior?: boolean; compact?: boolean }) {
  return <div className={compact ? "missing-model compact" : "missing-model"}><PlaceholderTruckViewer brandId={brandId} body={body} bodyLengthFt={bodyLengthFt} wheelbaseIn={wheelbaseIn} accessoryPlacements={accessoryPlacements} color={color} interior={interior} compact={compact}/><div className="missing-model-label"><span>!</span><div><strong>Concept placeholder</strong><p>{model}</p><small>Actual {requirement} is missing · generic geometry only</small></div></div></div>;
}

function SelectGroup({ title, values, value, onChange, isDisabled }: { title: string; values: string[]; value: string; onChange: (value: string) => void; isDisabled?: (value: string) => boolean }) {
  const help: Record<string,string> = {
    "Cab configuration": "Cab choice controls seating and changes the usable chassis space behind the cab.",
    "Planning wheelbase": "The distance between the front and rear axle centers. It affects turning, body fit and weight distribution.",
    "Axle configuration": "Axle configuration affects capacity, traction and legal loading. Diehl's verifies final axle ratings.",
    "Engine / battery": "Powertrain availability depends on model, axle, wheelbase and duty cycle.",
    Transmission: "The transmission must match the engine, vocation and required PTO or upfit equipment.",
    Suspension: "Suspension choice changes ride, stability, loading behavior and vocational suitability."
  };
  return <div className="select-group"><h4>{title}{help[title] && <InfoTip label={title}>{help[title]}</InfoTip>}</h4><div>{values.map((item) => { const disabled = isDisabled?.(item) || false; return <button key={item} disabled={disabled} onClick={() => !disabled && onChange(item)} className={`${value === item ? "pill selected" : "pill"}${disabled ? " incompatible" : ""}`}>{item}{disabled ? <span>×</span> : value === item && <span>✓</span>}</button>; })}</div></div>;
}

function BodyCatalogControls({ brandId, search, onSearch, category, onCategory, count, total, expanded, onExpanded }: { brandId: BrandId; search: string; onSearch: (value:string) => void; category:string; onCategory:(value:string) => void; count:number; total:number; expanded:boolean; onExpanded:(value:boolean)=>void }) {
  const categories = bodyCategoriesFor(brandId);
  return <div className="body-catalog-shell"><div className="body-catalog-mode"><div><strong>{expanded ? "Complete body catalog" : "Recommended starting bodies"}</strong><span>{expanded ? `${total} chassis-compatible requests available` : "Search immediately or browse the recommended starting list"}</span></div><button onClick={() => { onExpanded(!expanded); if (expanded) { onSearch(""); onCategory("All categories"); } }}>{expanded ? "Show recommended" : `Browse all ${total}`}</button></div><div className="body-catalog-controls"><label><span>Search {catalogBodyCount(brandId)} body and equipment requests</span><input value={search} placeholder="Try rollback, food truck, aerial…" onChange={(event) => onSearch(event.target.value)}/></label>{expanded && <label><span>Category</span><select value={category} onChange={(event) => onCategory(event.target.value)}><option>All categories</option>{Object.keys(categories).map((item) => <option key={item}>{item}</option>)}</select></label>}<div><strong>{count}</strong><span>shown</span></div></div></div>;
}

function BodyVariantSelector({ family, variants, value, onChange, fit }: { family: string; variants: BodyVariant[]; value: string; onChange: (value: string) => void; fit: (variant: BodyVariant) => "review" | "incompatible" }) {
  if (!variants.length) return null;
  const selected = variants.find((variant) => variant.id === value) || variants[0];
  return <section className="body-variant-builder">
    <div className="body-variant-head"><div><span>SIZE / CAPACITY <InfoTip label="Body size and capacity">A body may fit the frame by length but still fail payload, axle-loading or mounting checks. Diehl's verifies all three.</InfoTip></span><h4>Configure the {family}</h4><p>Options reflect published manufacturer ranges where available. Final dimensions, payload and mounting require dealer engineering review.</p></div><strong>{selected?.label || "Select"}</strong></div>
    <div className="body-variant-grid">{variants.map((variant) => { const status = fit(variant); return <button key={variant.id} disabled={status === "incompatible"} className={`${variant.id === value ? "selected" : ""} ${status}`} onClick={() => onChange(variant.id)}><span><strong>{variant.label}</strong><small>{variant.detail}</small></span><i>{status === "incompatible" ? "Does not fit selected wheelbase" : variant.id === value ? "Selected ✓" : "Engineering review"}</i></button>; })}</div>
    {selected && <div className="body-variant-source"><span>Source basis</span><strong>{selected.source}</strong><small>A size-specific GLB is required before the visual can be labeled exact.</small></div>}
  </section>;
}

function EquipmentPlacementBuilder({ accessories, slots, placements, onChange }: { accessories: string[]; slots: AccessorySlotConfig[]; placements: AccessoryPlacement[]; onChange: (accessory: string, slotId: string) => void }) {
  if (!accessories.length) return <section className="equipment-placement empty"><div><span>ATTACHABLE EQUIPMENT</span><h4>Choose a mountable option above</h4><p>Tool storage, work lights, beacons, and lift gates can be assigned to compatible truck locations.</p></div></section>;
  return <section className="equipment-placement"><div className="equipment-placement-head"><div><span>ATTACHABLE EQUIPMENT</span><h4>Choose where each item goes</h4><p>Incompatible positions are unavailable. Orange 3D parts are placement markers until exact accessory GLBs and mounting clearances are verified.</p></div><strong>{placements.filter((placement) => accessories.includes(placement.accessory)).length}/{accessories.length} placed</strong></div>
    <div className="placement-list">{accessories.map((accessory) => {
      const selected = placements.find((placement) => placement.accessory === accessory)?.slotId || "";
      const compatible = slots.filter((slot) => slot.compatibleAccessories.includes(accessory));
      return <article key={accessory}><div><span className={selected ? "placement-dot placed" : "placement-dot"}>{selected ? "✓" : "+"}</span><span><strong>{accessory}</strong><small>{selected ? slots.find((slot) => slot.id === selected)?.label : "Location not selected"}</small></span></div><select value={selected} onChange={(event) => onChange(accessory,event.target.value)}><option value="">Choose mounting location…</option>{slots.map((slot) => <option key={slot.id} value={slot.id} disabled={!slot.compatibleAccessories.includes(accessory)}>{slot.label}{slot.compatibleAccessories.includes(accessory) ? slot.verified ? " · verified" : " · planning" : " · incompatible"}</option>)}</select>{compatible.length === 0 && <em>No compatible slot is configured; 3D Admin action required.</em>}</article>;
    })}</div>
  </section>;
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return <div><span>{label}</span><strong>{value}</strong></div>;
}

function QuotePanel({ sent, buildId, brand, model, body, estimate, estimateAvailable, fit, onSubmit, onPrint }: { sent: boolean; buildId: string; brand: Brand; model: TruckModel; body: string; estimate: number; estimateAvailable: boolean; fit: number; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onPrint:()=>void }) {
  if (sent) return <div className="quote-success"><span>✓</span><h3>Your build was saved for review.</h3><p>This local testing version added the configuration to the on-device Sales Workspace. Connect the production CRM or email endpoint before using live customer submissions.</p><div><small>BUILD ID</small><strong>{buildId}</strong></div><button className="button primary" onClick={onPrint}>Print preliminary specification</button></div>;
  return <>
    <SectionHead number="07" title="Review and request a quote" copy="Download the preliminary specification, then send the build for pricing, inventory and engineering review."/>
    <div className="quote-snapshot"><div><span>{brand.name}</span><strong>{model.name}</strong><small>{body}</small></div><div><span>Planning estimate</span><strong>{estimateAvailable ? money(estimate) : "Dealer quote required"}</strong><small>{fit}% inventory fit</small></div></div>
    <button type="button" className="button ghost full review-print" onClick={onPrint}>Print preliminary truck specification</button>
    <div className="local-submit-notice"><strong>Local testing mode</strong><span>This saves to the Sales Workspace on this device. It does not yet email Diehl&apos;s or create a CRM lead.</span></div>
    <form className="lead-form" onSubmit={onSubmit}><label><span>Name *</span><input name="name" required autoComplete="name"/></label><label><span>Company</span><input name="company" autoComplete="organization"/></label><label><span>Email *</span><input name="email" type="email" required autoComplete="email"/></label><label><span>Phone *</span><input name="phone" type="tel" required autoComplete="tel"/></label><label><span>ZIP code *</span><input name="zip" required inputMode="numeric" pattern="[0-9]{5}" autoComplete="postal-code"/></label><label><span>Fleet size</span><select name="fleet"><option>1 truck</option><option>2–5 trucks</option><option>6–20 trucks</option><option>21+ trucks</option></select></label><label className="interest"><input name="financing" type="checkbox"/><span>I&apos;m interested in commercial financing</span></label><label className="interest"><input name="trade" type="checkbox"/><span>I have a truck to trade</span></label><button className="button primary form-submit" type="submit">Save build for review <span>→</span></button></form>
  </>;
}

function SalesWorkspace({ leads, onBack }: { leads: Lead[]; onBack: () => void }) {
  const pipeline = leads.reduce((sum, lead) => sum + lead.value, 0);
  return <section className="sales-page"><div className="sales-head"><div><span className="eyebrow dark">DIEHL&apos;S SALES WORKSPACE</span><h1>Customer build pipeline</h1><p>Locally saved configurations, inventory matches and factory-order opportunities.</p></div><button className="button primary" onClick={onBack}>Open customer builder</button></div><div className="sales-stats"><article><span>Active builds</span><strong>{leads.length}</strong><small>Saved in this browser session</small></article><article><span>Pipeline value</span><strong>{money(pipeline)}</strong><small>Planning estimate total; unpriced builds excluded</small></article><article><span>Strong matches</span><strong>{leads.filter((lead) => lead.fit >= 85).length}</strong><small>85% inventory fit or higher</small></article><article><span>New leads</span><strong>{leads.filter((lead) => lead.status === "New").length}</strong><small>Require first response</small></article></div><div className="sales-table-card"><div className="table-head"><div><h2>Builds requiring action</h2><p>Newest locally saved requests appear first.</p></div><button className="button ghost" onClick={() => window.print()}>Export / print</button></div><div className="table-scroll"><table><thead><tr><th>Build ID</th><th>Customer</th><th>Truck</th><th>Body</th><th>Est. value</th><th>Fit</th><th>Status</th></tr></thead><tbody>{leads.length === 0 ? <tr><td colSpan={7}><div className="sales-empty"><strong>No customer builds saved yet</strong><span>Complete the Quote step to add a local test lead. Production CRM delivery is not connected.</span><button className="button primary small" onClick={onBack}>Create a build</button></div></td></tr> : leads.map((lead) => <tr key={lead.id}><td><strong>{lead.id}</strong></td><td>{lead.customer}<small>{lead.company}</small></td><td>{lead.brand}<small>{lead.model}</small></td><td>{lead.body}</td><td>{lead.value > 0 ? money(lead.value) : "Dealer quote"}</td><td><span className={lead.fit >= 85 ? "fit hot" : "fit"}>{lead.fit}%</span></td><td><span className="status">{lead.status}</span></td></tr>)}</tbody></table></div></div></section>;
}
