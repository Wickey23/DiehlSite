export type FreightlinerFit = "primary" | "compatible" | "review" | "incompatible" | "trailer";

const lines = (value: string) => value.trim().split("\n").map((item) => item.trim()).filter(Boolean);

export const freightlinerBodyCategories: Record<string, string[]> = {
  "Chassis & tractor": lines(`
Bare cab and chassis
4x2 straight-truck chassis
6x4 tandem straight-truck chassis
Lift-axle straight-truck chassis
4x2 day-cab tractor
6x4 day-cab tractor
6x4 sleeper tractor
End-of-frame trailer-connector truck
Fixed fifth wheel
Sliding fifth wheel
Day-cab roof fairing
Mid-roof sleeper fairing
Raised-roof sleeper fairing
Dry-freight trailer
Refrigerated trailer
Flatbed trailer
Curtain-side trailer
Tank trailer
Container chassis
Lowboy equipment trailer`),
  "Cargo & delivery": lines(`
Standard aluminum dry van
FRP dry van
Composite dry van
High-cube delivery box
Parcel and home-delivery body
Moving and furniture van
Walk-through delivery body
Curtain-side body
Insulated non-refrigerated box
Refrigerated box
Frozen-food box
Multi-temperature reefer
Side-load beverage body
Refrigerated beverage or keg body
Bottled-gas delivery body
Linen and laundry delivery body
Secure armored transport body
Auto-parts delivery body
Bakery delivery body
Mobile storage body`),
  "Flatbed, platform & landscape": lines(`
Standard steel flatbed
Aluminum flatbed
Stake body with removable racks
Landscape rack body
Contractor platform body
Drop-side platform
Dovetail landscape body
Beavertail equipment body
Landscape dump
Chipper or arborist dump
Leaf-collection body
Flexible removable-side body
Equipment hauler
Heavy-machinery transport deck
Steel and pipe transport body
Lumber-delivery body
Sod-delivery body
Scaffolding body
Brick and block delivery platform`),
  "Dump & construction": lines(`
Light-duty dump
Contractor dump
Masonry dump
Drop-side dump
Three-way dump
Municipal dump
Tandem dump
Tri-axle dump
Transfer dump
Side dump
End dump
Grain body
Asphalt hot box
Asphalt distributor
Concrete mixer
Volumetric concrete mixer
Concrete pump
Vacuum-excavation body
Hydro-excavation body
Drill or auger body
Paving-support body
Construction water tank
Dust-control sprayer
Equipment hauler
Bridge-maintenance body`),
  "Utility & service": lines(`
Open-top utility body
Enclosed utility body
Electrician service body
Plumbing service body
HVAC service body
Mobile service and workshop body
Mechanics body
Mechanics body with hydraulic crane
Flatbed with knuckle-boom crane
Rear-mount crane body
Lube and maintenance body
Welding body
Tire-service body
Glass-rack or glazier body
Line-service body
Oilfield service body
Winch and bed truck
Wireline body
Pump and pressure service body
Generator and compressor body
Railroad-maintenance body
Pest-control body
Mobile battery-service body
Roadside-service body
Sign-installation body
Traffic-control body`),
  "Towing & interchangeable": lines(`
Steel rollback or car carrier
Aluminum rollback or car carrier
Rollback with wheel lift
Conventional wrecker
Integrated heavy wrecker
Rotator recovery truck
Repo or snatch truck
Multi-car transporter
Hooklift
Cable roll-off
Hooklift dumpster
Hooklift flatbed
Hooklift landscape container
Hooklift chipper container
Hooklift salt-spreader container
Hooklift water-tank container
Swap-body carrier
Container carrier`),
  "Refuse & recycling": lines(`
Rear-load refuse body
Automated side-load refuse body
Manual side-load refuse body
Front-load refuse body
Satellite garbage truck
Recycling collection body
Organic and food-waste collection body
Compactor body
Open-top waste body
Brush-collection body
Debris-collection body
Cart-delivery and collection body`),
  "Municipal & environmental": lines(`
Street sweeper
Vacuum sweeper
Sewer jetter
Catch-basin cleaner
Combination sewer cleaner
Septic or vacuum tank
Leaf-vacuum body
Potable-water tank
Dust-control water tank
Snowplow
V-plow
Wing plow
Salt or sand spreader
Combination dump, plow and spreader
Road-maintenance patch body
Guardrail-maintenance body
Traffic-signal service body
Storm-response body`),
  "Tank, bulk & fuel": lines(`
Fuel-delivery tank
Fuel and lubrication tank
Food-grade tank
Milk tank
Propane bobtail body
Chemical tank
Dry-bulk pneumatic tank
Vacuum tank
Bulk-feed body
Water-hauling tank
Fire-water tanker
Aviation-fuel body`),
  "Aerial, fire & emergency": lines(`
Bucket or aerial body
Sign-service aerial
Tree-trimming aerial
Transmission-line aerial
Ambulance
Fire-rescue body
Fire pumper
Fire tanker or tender
Aerial fire apparatus
Hazmat-response body
Mobile-command vehicle
Emergency-communications body
Police or SWAT support body
Airport rescue-support body
Disaster-response body
Mobile decontamination body`),
  "Mobile business & specialty": lines(`
Food truck
Mobile kitchen or catering body
Mobile retail store
Mobile office
Mobile workshop
Mobile medical or dental clinic
Bloodmobile
Bookmobile
Broadcast and production truck
Mobile laboratory
Mobile classroom or training truck
Shuttle bus
Paratransit body
Crew-transport body
RV or expedition body
Animal-transport body
Mobile restroom or shower
Mobile billboard or LED-display truck
Event and stage truck
Racing and motorsports transporter
Mobile bank
Mobile pet-grooming body
Mobile testing or inspection lab
Mobile data center`)
};

// Source list contains 210 numbered entries; "Equipment hauler" appears in two
// categories, so the customer selector intentionally presents one unique request.
export const freightlinerCatalogEntryCount = 210;
export const freightlinerAllBodies = Array.from(new Set(Object.values(freightlinerBodyCategories).flat()));

export const priorityFreightlinerBodies = new Set(lines(`
Bare cab and chassis
Fixed fifth wheel
Standard aluminum dry van
Refrigerated box
Stake body with removable racks
Standard steel flatbed
Landscape dump
Contractor dump
Tandem dump
Open-top utility body
Mobile service and workshop body
Steel rollback or car carrier
Rollback with wheel lift
Hooklift
Hooklift dumpster
Hooklift flatbed
Mechanics body with hydraulic crane
Concrete mixer
Rear-load refuse body
Automated side-load refuse body
Front-load refuse body
Bucket or aerial body
Fire pumper
Dry-freight trailer
Refrigerated trailer
Flatbed trailer`));

export const freightlinerAccessories = lines(`
Standard bumper
Chrome bumper
Severe-duty bumper
Bridge-formula bumper
Front-frame extension
Chrome grille package
Black grille package
Hood-mounted mirrors
Heated power mirrors
MirrorCam system
Sun visor
Roof air deflector
Full-height roof fairing
Cab side extenders
Chassis side fairings
Chassis skirts
Bug screen
Winter front
Air horns
Beacon lights
Emergency light bar
Work lights
Scene lighting
Marker lights
Additional steps
Deck plates
Custom paint
Vinyl wraps
Company logos
Reflective striping
Single rear axle
Tandem rear axle
Tridem axle group
Fixed lift axle
Steerable lift axle
Set-back front axle
Set-forward front axle
All-wheel-drive front axle
Air suspension
Taper-leaf suspension
Severe-duty suspension
Frame reinforcement
Inner frame liner
Front tow hooks
Rear tow hooks
Fixed fifth wheel
Sliding fifth wheel
Fifth-wheel ramps
Tractor deck plate
End-of-frame trailer connectors
Pintle hitch
Receiver hitch
Safety chains
Mudflaps
Quarter fenders
Full rear fenders
Single diesel tank
Dual diesel tanks
DEF tank
Vertical exhaust
Horizontal exhaust
Aftertreatment system
CNG saddle tanks
CNG back-of-cab cabinet
Natural-gas fill panel
194-kWh eM2 battery package
291-kWh eM2 battery package
291-kWh eCascadia battery package
438-kWh eCascadia battery package
Single Detroit eAxle
Tandem Detroit eAxle
Charge port
High-voltage protective covers
Electric PTO equipment
Roll-up rear door
Double-swing barn doors
Side-access door
Curbside door
Streetside door
Walk ramp
Hydraulic tuckaway liftgate
Rail-style liftgate
Cantilever liftgate
Dock bumper
ICC underride guard
Underbody toolboxes
Topside toolboxes
Headache rack
Ladder rack
Removable stake racks
Landscape mesh sides
Dump tarp
Tailgate spreader
Reefer condenser
Reefer fuel tank
Refrigeration battery pack
Crane
Stabilizer outriggers
Rollback wheel lift
Winch and cable
Hooklift subframe
Hooklift containers
Snowplow mount
Snowplow blade
Salt spreader
Backup camera
Reverse proximity sensors
Safety cones
Wheel chocks
Equipment racks`);

export function freightlinerBodyCategory(bodyName: string) {
  return Object.entries(freightlinerBodyCategories).find(([, bodies]) => bodies.includes(bodyName))?.[0] || "Custom upfit";
}

const categoryFit: Record<string, Record<string, FreightlinerFit>> = {
  cargo: { "m2-106":"primary", "em2-class-6":"primary", "em2-class-7":"primary", "m2-112":"primary", "m2-112-natural-gas":"primary", "108sd":"compatible", "114sd":"review", "114sd-natural-gas":"review", econicsd:"incompatible", cascadia:"trailer", "cascadia-natural-gas":"trailer", ecascadia:"trailer" },
  reefer: { "m2-106":"primary", "em2-class-6":"compatible", "em2-class-7":"compatible", "m2-112":"primary", "m2-112-natural-gas":"primary", "108sd":"compatible", "114sd":"review", "114sd-natural-gas":"review", econicsd:"incompatible", cascadia:"trailer", "cascadia-natural-gas":"trailer", ecascadia:"trailer" },
  flatbed: { "m2-106":"primary", "em2-class-6":"compatible", "em2-class-7":"compatible", "m2-112":"primary", "m2-112-natural-gas":"primary", "108sd":"primary", "114sd":"primary", "114sd-natural-gas":"primary", econicsd:"incompatible", cascadia:"trailer", "cascadia-natural-gas":"trailer", ecascadia:"trailer" },
  landscape: { "m2-106":"primary", "em2-class-6":"review", "em2-class-7":"review", "m2-112":"compatible", "m2-112-natural-gas":"compatible", "108sd":"primary", "114sd":"compatible", "114sd-natural-gas":"compatible", econicsd:"incompatible", cascadia:"incompatible", "cascadia-natural-gas":"incompatible", ecascadia:"incompatible" },
  heavyDump: { "m2-106":"review", "em2-class-6":"incompatible", "em2-class-7":"incompatible", "m2-112":"compatible", "m2-112-natural-gas":"compatible", "108sd":"primary", "114sd":"primary", "114sd-natural-gas":"primary", econicsd:"incompatible", cascadia:"incompatible", "cascadia-natural-gas":"incompatible", ecascadia:"incompatible" },
  mixer: { "m2-106":"incompatible", "em2-class-6":"incompatible", "em2-class-7":"incompatible", "m2-112":"review", "m2-112-natural-gas":"review", "108sd":"compatible", "114sd":"primary", "114sd-natural-gas":"primary", econicsd:"incompatible", cascadia:"incompatible", "cascadia-natural-gas":"incompatible", ecascadia:"incompatible" },
  utility: { "m2-106":"primary", "em2-class-6":"compatible", "em2-class-7":"compatible", "m2-112":"primary", "m2-112-natural-gas":"primary", "108sd":"primary", "114sd":"primary", "114sd-natural-gas":"primary", econicsd:"incompatible", cascadia:"incompatible", "cascadia-natural-gas":"incompatible", ecascadia:"incompatible" },
  refuse: { "m2-106":"compatible", "em2-class-6":"review", "em2-class-7":"review", "m2-112":"compatible", "m2-112-natural-gas":"compatible", "108sd":"primary", "114sd":"primary", "114sd-natural-gas":"primary", econicsd:"primary", cascadia:"incompatible", "cascadia-natural-gas":"incompatible", ecascadia:"incompatible" },
  tractor: { "m2-106":"review", "em2-class-6":"incompatible", "em2-class-7":"incompatible", "m2-112":"primary", "m2-112-natural-gas":"primary", "108sd":"incompatible", "114sd":"review", "114sd-natural-gas":"review", econicsd:"incompatible", cascadia:"primary", "cascadia-natural-gas":"primary", ecascadia:"primary" }
};

function compatibilityGroup(body: string) {
  const category = freightlinerBodyCategory(body);
  if (body.includes("trailer") || body.includes("tractor") || body.includes("fifth wheel") || body === "Container chassis") return "tractor";
  if (body.includes("Refrigerated") || body.includes("reefer") || body.includes("beverage")) return "reefer";
  if (body.includes("mixer") || body.includes("Concrete")) return "mixer";
  if (category === "Refuse & recycling") return "refuse";
  if (category === "Cargo & delivery") return "cargo";
  if (category === "Flatbed, platform & landscape") return body.toLowerCase().includes("dump") ? "landscape" : "flatbed";
  if (category === "Dump & construction") return "heavyDump";
  if (category === "Utility & service" || category === "Aerial, fire & emergency") return "utility";
  if (category === "Chassis & tractor") return body.includes("straight-truck") || body === "Bare cab and chassis" ? "utility" : "tractor";
  return "unknown";
}

export function freightlinerBodyFit(modelId: string, body: string): FreightlinerFit {
  if (body === "Bare cab and chassis") return "compatible";
  if (body.includes("trailer") && ["cascadia", "cascadia-natural-gas", "ecascadia"].includes(modelId)) return "trailer";
  if (modelId === "econicsd") return ["Front-load refuse body", "Automated side-load refuse body", "Manual side-load refuse body", "Rear-load refuse body"].includes(body) ? "primary" : "incompatible";
  const group = compatibilityGroup(body);
  return categoryFit[group]?.[modelId] || "review";
}

export function freightlinerAccessoryCompatible(modelId: string, accessory: string) {
  const electric = ["em2-class-6", "em2-class-7", "ecascadia"].includes(modelId);
  const naturalGas = modelId.includes("natural-gas");
  if (accessory.includes("eM2")) return modelId.startsWith("em2-");
  if (accessory.includes("eCascadia")) return modelId === "ecascadia";
  if (["Single Detroit eAxle", "Tandem Detroit eAxle", "Charge port", "High-voltage protective covers", "Electric PTO equipment"].includes(accessory)) return electric;
  if (["CNG saddle tanks", "CNG back-of-cab cabinet", "Natural-gas fill panel"].includes(accessory)) return naturalGas;
  if (["Single diesel tank", "Dual diesel tanks", "DEF tank", "Aftertreatment system"].includes(accessory)) return !electric && !naturalGas;
  if (accessory.includes("sleeper fairing")) return ["cascadia", "cascadia-natural-gas"].includes(modelId);
  if (accessory === "Front-frame extension") return !["cascadia", "cascadia-natural-gas", "ecascadia", "econicsd"].includes(modelId);
  return true;
}
