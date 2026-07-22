# Diehl's Truck World — Build Your Truck

Production-style multi-brand commercial truck configurator for Isuzu, Freightliner, and Western Star.

## Features

- Real manufacturer model families and published specification ranges
- Uploaded GLB models for Freightliner and heavy-duty / Western Star reference viewing
- Current U.S. Isuzu gas, diesel, EV, and F-Series chassis catalog
- Current 12-configuration Freightliner diesel, electric, and natural-gas lineup, including separate eM2 Class 6/Class 7 rules
- First-person Isuzu interior look-around with admin eye-point calibration
- Per-chassis/body alignment profiles, real-scale asset targeting, and wheelbase attachment mapping
- Searchable 104-category Isuzu upfit request catalog with shared modular body assets
- Searchable Freightliner catalog with 210 source entries, shared modular bodies/trailers, cab dimensions, nominal size presets, accessories, and model/body compatibility rules
- Customer-selectable accessory mounting locations with compatibility filtering
- Parametric concept-body previews for missing GLBs, with rearward-only length growth that preserves cab proportions
- NRR EV battery/wheelbase and ePTO compatibility rules
- Body, chassis, engine, transmission, axle, suspension, package, color and equipment selection
- Planning estimate, finance illustration and inventory-fit logic
- Quote lead capture with customer build IDs
- Sales pipeline workspace

## Local development

On Windows, double-click `START_LOCAL_TEST.bat`. It installs the required
packages when needed, starts the site, and opens the browser automatically.

Or run it manually:

```bash
npm install
npm run local
```

Open `http://localhost:3000`.

See `LOCAL_TESTING.md` for complete setup and troubleshooting instructions.

## Production build

```bash
npm run build
npm start
```

Truck specifications and planning prices require dealer validation before ordering.

## Deploying with Vercel

1. Push this repository to GitHub.
2. In Vercel, choose **Add New → Project** and import the GitHub repository.
3. Keep the detected framework as **Next.js** and deploy. The included
   `vercel.json` uses the native Next.js production build.

Vercel deployment metadata, local environment files, generated output, and the
ChatGPT Sites project configuration are intentionally excluded from Git.

See `CHANGES_THIS_VERSION.md` for the completed changes and the current segmented-GLB requirement for exact wheelbase animation.

## Adding GLB assets

Use `MODEL_ASSET_DROP/` as the handoff structure. The 3D Admin model library is
the source of truth for assigning each uploaded GLB, its exact material names,
real dimensions, compatibility status, and body-sizing behavior.
