Put the original CDC PLACES CSV here (either format works — it's now auto-detected):

- Wide / "GIS-Friendly Format" (one row per county, columns like OBESITY_CrudePrev)
  — this is what you get from the direct data.cdc.gov CSV download link.
- Long format (one row per county+measure, with LocationID/MeasureId/Data_Value columns)
  — CDC's older/alternate export style.

Run `npm run prepare:csv -- data/cdc.csv` from the project root (point it at
whichever file you downloaded — the filename doesn't matter, the content does).

The generated public/data/places.csv is the file read by the dashboard and
accepted by the Supabase table. The original CSV stays out of Git to avoid
committing a very large source file.
