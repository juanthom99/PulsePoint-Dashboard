# PulsePoint

A working Next.js implementation of the PulsePoint mockup: dark navy panels, cyan and violet indicators, interactive county map, search, filters and county comparisons.

## Start on your computer

Use Node.js 20.9 or newer. Open a terminal in this folder and run:

```bash
npm install
npm run dev
```

Open http://localhost:3000. The included CSV contains fictional demo values, explicitly labeled in the interface. No keys are required to run the CSV version.

## Adding this to an existing project

This archive is a complete project. The easiest option is to use its contents as the project root. If you already have a Next.js project, back it up first, then merge app/, components/, lib/, public/data/, scripts/ and supabase/. Merge the dependencies and scripts from package.json, and the ignore rules from .gitignore. Do not overwrite an existing package.json, .env.local or unrelated source files blindly. If your project uses src/app, put app, components and lib inside src and keep @/* pointed at src/*. Adjust scripts/prepare-csv.mjs to import ../src/lib/data.mjs. Keep public/ in the root.

## Use your actual CDC CSV

Download the long format County Data CSV from:
https://data.cdc.gov/500-Cities-Places/PLACES-Local-Data-for-Better-Health-County-Data-20/swc5-untb

Choose the County Data export, not the GIS Friendly wide format. Save it as data/cdc.csv, then run:

```bash
npm run prepare:csv -- data/cdc.csv
```

This replaces the fictional public/data/places.csv with normalized observations for eight selected measures. Restart or refresh the dashboard. The original source file stays unchanged. The cleaned CSV keeps FIPS codes as text, observation year, estimate type, null values and confidence limits. Do not combine releases: duplicate county, measure, year and type records are rejected. Some measures can have different observation years, so change the year selector if a value is unavailable.

For an immediate preview, the Open CSV button reads a CSV in your browser. This does not upload it to Supabase or save it in the project. To persist data for deployment, use the preparation command or Supabase instructions below.

Supported original CDC columns: LocationID, LocationName, StateAbbr, MeasureId, Year, Data_Value_Type, Data_Value, Low_Confidence_Limit, High_Confidence_Limit. API style lowercase columns also work. The sample shows the normalized column format. Preserve is_sample=true on fictional data. A user supplied file without that flag is treated as source data, not independently verified by the app.

## Connect Supabase for the assignment

The CSV version alone does not satisfy the assignment's Supabase requirement. To connect it:

1. Run supabase/schema.sql once in your Supabase SQL Editor. It creates a standalone pulsepoint_observations table with a composite key and public SELECT access only. It does not change any previously created tables.
2. Prepare your real CDC file as above.
3. In the Supabase Table Editor, select pulsepoint_observations and import public/data/places.csv. The columns match exactly. Import into an empty table; repeated imports of the same rows conflict with the primary key. For later updates use a controlled database import or upsert process.
4. Copy .env.example to .env.local and fill in your Supabase URL and publishable key beginning sb_publishable_. The variable names must match the example exactly.
5. Restart npm run dev. The dashboard now reads all pages of observations from Supabase. About the data shows the active source. If configuration or permissions are wrong, an error appears instead of silently substituting demo data.

The publishable key is intended to be visible in the browser. Database grants and Row Level Security prevent public writes. Never put a secret key, service_role key or database password into browser code or any NEXT_PUBLIC_ variable. This application does not require an admin key. .env.local is ignored by Git. Only blank placeholders belong in .env.example.

## Deploy to Vercel

Push this project to your GitHub repository and import that repository in Vercel. Vercel detects Next.js. If using Supabase, add both variables from .env.example to the appropriate Vercel environments before deploying. Deploy again after changing environment variables. No Vercel configuration file is required.

## What works

* Search and state filters update the county table and map.
* Clicking a colored county updates its snapshot and comparison.
* County selectors provide a keyboard accessible alternative to the map.
* Observation year and estimate type are applied consistently to both counties.
* Indicator selection recolors the map and updates the table.
* Missing observations are labeled unavailable and never treated as zero.
* Comparison bars share a 0 to 100 percent scale; confidence intervals appear when available.
* Responsive layouts adapt to narrow screens, and reduced motion preferences are respected.

## Data limitations

The included CSV has 24 fictional observations across six counties. It is not a real CDC extract. All sample values, years and intervals are invented solely to demonstrate layout and behavior. No population numbers or overall health scores are fabricated by the app.

CDC PLACES values are modeled estimates. The observation year is not necessarily the release year. Some measures refer to a specific adult age range; consult the CDC definition for each measure, especially lack of insurance. Comparisons do not establish causation or statistical significance. The app does not calculate a national average.

The map uses us-atlas county boundaries derived from an older Census boundary vintage. Newly reorganized counties may not match; every imported county remains available through the selector and table. Unmatched or missing data is gray. The geographic asset is bundled locally through npm and does not need a map API key.

## Files to edit

* components/dashboard.jsx: layout, data loading and controls
* components/county-map.jsx: map drawing and interaction
* app/globals.css: visual design and responsive layout
* lib/data.mjs: CSV parsing and normalization
* public/data/places.csv: deployed CSV data
* supabase/schema.sql: database structure and read permissions

The included Card components follow the shadcn/ui primitive pattern and are styled with Tailwind CSS. components.json is included for adding more shadcn components.

## Checks

```bash
npm test
npm run build
```

Parser tests use independent fixtures, so replacing the dashboard CSV does not change the tests.
