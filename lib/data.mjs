import Papa from 'papaparse';

export const METRICS = {
  OBESITY: 'Obesity', DIABETES: 'Diabetes', LPA: 'Physical inactivity',
  MHLTH: 'Frequent mental distress', BPHIGH: 'High blood pressure',
  CSMOKING: 'Current smoking', DEPRESSION: 'Depression', ACCESS2: 'Lack of health insurance'
};
const clean = value => String(value ?? '').trim();
const number = value => clean(value) === '' ? null : Number.isFinite(Number(value)) ? Number(value) : null;

// Parses the CDC PLACES "GIS-Friendly Format" export: one row per county,
// with each measure as its own pair of columns, e.g. OBESITY_CrudePrev and
// OBESITY_Crude95CI ("( 9.7, 14.8)"). This is the format produced by the
// direct data.cdc.gov CSV download link (dataset i46a-9kgh and similar).
function parseWideCSV(parsed, { year = 2023, isSample = false } = {}) {
  const rows = [];
  const keys = new Set();
  let duplicates = 0;
  const ciRe = /(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/;
  for (const original of parsed.data) {
    const r = Object.fromEntries(Object.entries(original).map(([k, v]) => [k.toLowerCase(), v]));
    const rawFips = clean(r.countyfips);
    if (!/^\d{1,5}$/.test(rawFips)) continue;
    const county_fips = rawFips.padStart(5, '0');
    const county_name = clean(r.countyname);
    const state_abbr = clean(r.stateabbr);
    if (!county_name || !state_abbr) continue;

    for (const code of Object.keys(METRICS)) {
      const valueCol = `${code.toLowerCase()}_crudeprev`;
      const ciCol = `${code.toLowerCase()}_crude95ci`;
      const value = number(r[valueCol]);
      if (value === null || value < 0 || value > 100) continue;
      let low = null, high = null;
      const ciMatch = ciRe.exec(clean(r[ciCol]));
      if (ciMatch) { low = Number(ciMatch[1]); high = Number(ciMatch[2]); }
      const row = {
        county_fips, county_name, state_abbr, measure_code: code, year,
        data_value_type: 'Crude prevalence', value, low, high, is_sample: isSample,
      };
      const key = [row.county_fips, code, year, row.data_value_type].join('|');
      if (keys.has(key)) { duplicates++; continue; }
      keys.add(key); rows.push(row);
    }
  }
  if (!rows.length) throw new Error('No supported county records found in the GIS-friendly CSV.');
  if (duplicates) throw new Error('Duplicate county/measure/year records found while parsing the wide-format CSV.');
  return rows;
}

export function parseCSV(text) {
  const parsed = Papa.parse(text, {header:true, skipEmptyLines:'greedy', transformHeader:h=>h.replace(/^\uFEFF/,'').trim()});
  if (parsed.errors.length) throw new Error(`CSV could not be read: ${parsed.errors[0].message}`);

  // Auto-detect the GIS-friendly wide format (one row per county, measures
  // as their own columns) vs. the long format (one row per county+measure).
  const fields = (parsed.meta.fields || []).map(f => f.toLowerCase());
  const isWideFormat = Object.keys(METRICS).some(code => fields.includes(`${code.toLowerCase()}_crudeprev`));
  if (isWideFormat) return parseWideCSV(parsed);

  const rows = [];
  const keys = new Set();
  let duplicates = 0;
  for (const original of parsed.data) {
    const r = Object.fromEntries(Object.entries(original).map(([k,v])=>[k.toLowerCase().replace(/_/g,''),v]));
    const code = clean(r.measureid || r.measurecode).toUpperCase();
    if (!METRICS[code]) continue;
    const type = clean(r.datavaluetype || 'Crude prevalence');
    if (!['crude prevalence','age-adjusted prevalence'].includes(type.toLowerCase())) continue;
    const rawFips = clean(r.locationid || r.countyfips);
    if (!/^\d{1,5}$/.test(rawFips)) continue;
    const year = Number(r.year);
    if (!Number.isInteger(year) || year < 2000 || year > 2100) continue;
    const value = number(r.datavalue ?? r.value);
    if (value !== null && (value < 0 || value > 100)) continue;
    const row = {
      county_fips:rawFips.padStart(5,'0'), county_name:clean(r.locationname || r.countyname),
      state_abbr:clean(r.stateabbr), measure_code:code, year,
      data_value_type:type.toLowerCase()==='crude prevalence'?'Crude prevalence':'Age-adjusted prevalence',
      value, low:number(r.lowconfidencelimit ?? r.low), high:number(r.highconfidencelimit ?? r.high),
      is_sample:clean(r.issample).toLowerCase()==='true'
    };
    if (!row.county_name || !row.state_abbr) continue;
    const key = [row.county_fips,code,year,row.data_value_type].join('|');
    if (keys.has(key)) { duplicates++; continue; }
    keys.add(key); rows.push(row);
  }
  if (!rows.length) throw new Error('No supported county records found. Use the CDC PLACES County Data long format CSV, with LocationID, MeasureId, Year, Data_Value and Data_Value_Type columns.');
  if (duplicates) throw new Error('Duplicate county, measure, year and estimate type records found. Use a single CDC release, without demographic breakdowns.');
  return rows;
}
export const formatValue = value => value == null ? 'Unavailable' : `${Number(value).toFixed(1)}%`;
