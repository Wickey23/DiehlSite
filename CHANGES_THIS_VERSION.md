# Changes in this version

This ZIP is based on the latest project supplied by the user.

## Stitch cockpit frontend rebuild

- Replaced the generic customer header with the supplied Stitch-style configurator navigation for Manufacturer, Job Info, Chassis, Config, Body, Equipment, Appearance, Review, and Summary.
- Rebuilt the first screen as a model-first manufacturer catalog with two visible chassis previews per brand and direct model selection.
- Reorganized the desktop builder into a fixed three-panel workspace: controls on the left, persistent live 3D truck in the center, and current build summary on the right.
- Kept the wide-screen truck preview visible while cab, chassis, body, equipment, and color choices change.
- Added responsive two-panel and mobile layouts while retaining the same state and controls.
- Standardized the visual system to the Stitch references: Diehl red actions, neutral technical surfaces, compact borders, fixed navigation, and substantially larger specification text.
- Preserved all underlying functionality: GLB/model registry, automatic rotation, paint-material mapping, body fit and sizing, equipment placement, saved drafts, print specification, quote handoff, and the complete 3D Admin.
- Verified both the Next.js production build and the Sites/Vinext production artifact build.

## Complete guided-builder overhaul

- Removed the oversized marketing carousel from the configuration path so customers enter the builder immediately.
- Reorganized seven decisions into four plain-language phases: Your Needs, Choose the Truck, Build the Upfit, and Review.
- Moved configuration controls to the left and made the larger 3D vehicle workspace sticky on the right.
- Added a persistent current-build strip and a slide-out summary with specifications, estimate, print, and review actions.
- Moved Sales Workspace and 3D Admin out of the customer header and into low-profile dealer tools.
- Replaced the first job dropdown with large vocation cards and made chassis/body recommendations respond to the selected job, power preference, and payload range.
- Shows four recommended chassis first, with the full manufacturer catalog available on demand.
- Standardized larger typography, form controls, focus rings, touch targets, and mobile single-column behavior.
- Added a persistent Back/Continue action bar and simplified customer-facing model-accuracy language.

## Modern live experience and contextual help

- Added restrained motion, dimensional hover states, animated selection feedback, and a richer live truck stage.
- Added a confirmed-build progress meter that updates only when a valid step is confirmed.
- Added a visible live-preview status and smoother phase transitions with reduced-motion support.
- Added accessible information popovers for payload, duty cycle, crew size, fuel choice, cab, wheelbase, axles, powertrain, transmission, suspension, and body sizing.
- Popovers work with hover or keyboard focus on desktop and remain readable as tap-focused overlays on mobile.

## Customer builder and print specification

- Rebuilt the builder around the planned seven-step, job-first customer flow.
- Changed the desktop workspace to a 61/39 layout with one sticky truck preview and normal page scrolling.
- Replaced the default 100-plus body dump with recommended bodies and an optional complete catalog.
- Added job, payload, route, crew, fuel, fleet quantity, delivery, and notes fields to the saved draft.
- Standardized printing on a fixed exterior 3/4 camera and captured the configured truck into the document.
- Replaced browser-page printing with a formatted Preliminary Truck Specification containing requirements, chassis, body, equipment, review items, and disclaimers.
- Preserved the removal of the incorrect Freightliner tanker GLB; M2 106 Plus remains in a model-needed state.

## Completed

- Verified this re-uploaded ZIP is complete and established it as the new source baseline.
- Added automatic customer build-draft persistence across browser refreshes, including truck, body, size, chassis, powertrain, color, package, accessories, placements, and current step.
- Added a visible saved-draft timestamp and a full **Start over** control.
- Extended first-person interior mode to Freightliner and Western Star. Missing interiors now show an honest interactive concept placeholder instead of hiding the feature.
- Removed fictional starter customer records from Sales Workspace.
- Corrected the quote handoff language: this localhost package saves leads on-device and no longer claims that a CRM or email submission occurred.
- Added three healthy complete Western Star dump-truck uploads as unassigned reference assets with live Model Library thumbnails and Admin assignment to 47X, 49X, or 49X Power Hood.
- Rejected and flagged the new Freightliner yellow dump upload because its GLB header declares 57,104,416 bytes while the uploaded file contains only 42,446,848 bytes.

- Preserved the uploaded Isuzu chassis as an **Isuzu NRR EV** reference asset.
- Verified the current Freightliner product coverage against Freightliner's official truck list. The app contains all 11 named current products and presents eM2 Class 6 and Class 7 as separate build configurations, for 12 selectable configurations total.
- Added NRR EV battery and wheelbase rules:
  - 60 kWh and 100 kWh may use 132.5, 150, or 176-inch wheelbases.
  - 140 kWh and 180 kWh require the 176-inch wheelbase.
  - The EV offers a 12 kW continuous ePTO request instead of the diesel-style PTO provision.
- Added parametric concept bodies for unmodeled upfits. Body length changes extend rearward while preserving cab width, cab height, and cab proportions.
- Added concept geometry families for cargo boxes, dumps, flatbeds, stake bodies, utility bodies, rollbacks, tanks, mixers, cranes/aerials, hooklifts, refuse bodies, mobile business bodies, passenger bodies, and tractors.
- Kept exact/reference/concept labeling visible so a procedural preview cannot be mistaken for a verified manufacturer or upfitter model.
- Fixed the production SSR build by importing only the required React Three Drei modules instead of the full barrel package.

## Important 3D limitation

The current uploaded NRR EV and heavy-truck GLBs are single merged meshes. A merged mesh cannot independently move the rear axle, stretch only the frame rails, or preserve every wheelbase-specific component location. Exact automatic wheelbase changes require a segmented GLB with named nodes for at least:

- cab
- front axle/wheels
- frame stretch section
- rear axle/wheels
- body mount reference
- optional fuel/battery/aftertreatment components

Until those segmented assets are supplied and approved in 3D Admin, body-size changes are shown as planning previews and wheelbase changes remain engineering selections rather than exact chassis geometry.
# Customer-facing configurator completion

- Added a live Measurements toggle in the exterior viewer and fullscreen-ready viewer surface.
- Measurements update from the selected wheelbase and body-size variant.
- Unverified geometry is clearly labeled as planning/reference information.
- Preserved customer draft recovery, model-status safeguards, modular body sizing, attachment points, first-person interiors, and the local Sales Workspace handoff.
# Revised Stitch implementation

- Connected the revised Equipment & Accessories and Review concepts to the real build state instead of the fictional sample data in the mockups.
- Added honest chassis fit bands: strong fit, good fit with review items, possible with compromises, and not recommended.
- Added hover/focus fit-score explanations with positive factors, deductions, and dealer-review language.
- Added a visible 3D Admin entry in the fixed header.
- Rebuilt the admin as a compact full-screen workspace with task-specific internal scrolling.
- Added individual GLB uploads with binary completeness validation and live review previews.
- Added ZIP mass import, GLB extraction, filename-based destination suggestions, confidence scores, a per-file correction queue, and apply-only-after-review behavior.
- Added clear storage states so browser/session uploads are never represented as GitHub-published or permanent assets.
