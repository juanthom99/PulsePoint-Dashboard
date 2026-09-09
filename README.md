# PulsePoint

PulsePoint is an interactive community health atlas for exploring chronic disease and health behavior patterns across counties in the United States. Move across the map for an eight-indicator preview, pin a county for its full snapshot, filter the visible geography, or compare two communities side by side.

## Purpose

Public health data is often locked away in large government datasets that are hard for most people to actually use. PulsePoint exists to make that data approachable: a resident curious about their own county, a student studying public health, or someone deciding where to focus attention or resources can look at the numbers without needing to process a raw CSV file themselves.

The eight indicators covered are obesity, diabetes, high blood pressure, physical inactivity, current smoking, depression, frequent mental distress, and lack of health insurance.

## Data source

All figures come from the CDC's PLACES dataset (Population Level Analysis and Community Estimates). PLACES does not survey every resident directly. Instead, it combines results from the Behavioral Risk Factor Surveillance System, an annual phone survey, with census demographic data, then applies a statistical model to produce a modeled estimate for each county, including many counties too small to have collected a large number of individual survey responses on their own.

Because of that, every number here is an estimate with an associated confidence interval, not a census or a medical record.

## Limitations

A few honest limitations are worth stating plainly rather than hiding.

**Kentucky and Pennsylvania are missing** from several indicators in this release. This is not an error in the app. Per CDC's own release notes, these two states did not have usable BRFSS data for measures based on the 2023 survey year, so no estimate exists to display.

**Some individual counties are also missing values**, usually because their population was too small for the underlying survey to produce a reliable estimate. CDC suppresses these rather than publish an unreliable number, and PulsePoint follows the same approach: missing data is shown as unavailable, never treated as zero or filled in with a guess.

**Confidence intervals vary widely by county size.** Large counties tend to show tight intervals because more survey respondents contribute to their estimate. Small or rural counties can show intervals spanning ten or more percentage points. When comparing two counties, an overlapping interval means the difference between them may not be statistically meaningful, even if the point estimates look different.

**There is intentionally no overall health score or ranking.** Combining eight separate indicators into a single number requires deciding how much weight to give each one, and that decision has no objectively correct answer. A single score would also hide the uncertainty described above and could unfairly penalize places with missing data. PulsePoint shows each indicator on its own rather than collapsing them into a composite score or a best or worst ranking.

## Tech stack

Built with Next.js and Shadcn style components, with county data stored in Supabase and the site deployed on Vercel.

## Running locally

```
npm install
npm run dev
```

To load your own copy of the CDC data instead of the bundled sample, download the PLACES County Data CSV from data.cdc.gov and run:

```
npm run prepare:csv -- path/to/your/download.csv
```

This regenerates `public/data/places.csv`, which the dashboard reads directly, or which can be imported into a Supabase table using the schema in `supabase/schema.sql`.
