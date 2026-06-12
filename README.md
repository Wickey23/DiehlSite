<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/336c5088-514b-4bc7-b724-8e3edc258138

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Normalize a warranty workbook without touching raw sheets

Use the workbook normalizer when a source workbook must remain the raw source of truth and the normalized database layer must live in new sheets only.

```bash
npm run normalize:workbook -- ./source-workbook.xlsx ./source-workbook.normalized.xlsx
```

The script preserves all original sheets and adds or refreshes only these database-layer sheets:

- `DB_Customers`
- `DB_Units` (VIN is the primary key)
- `DB_InService`
- `DB_WarrantyCoverage`
- `DB_Contacts`
- `DB_ActivityLog`
- `DB_FieldMapping`
- `DB_DataQuality`
- `DB_Dashboard`

`DB_FieldMapping` is generated for every original column before the normalized sheets are populated. Each original column is either mapped to a normalized field or explicitly marked as `preserved in raw source only`, so no source column is silently dropped. Each normalized database table includes `Raw_Source_Sheet` and `Raw_Source_Row` columns for traceability back to the exact raw row.
