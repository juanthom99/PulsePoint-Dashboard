'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity, ArrowRightLeft, BarChart3, Brain, Check, ChevronRight, Cigarette,
  Droplets, FileUp, Footprints, Frown, Heart, Info, MapPin,
  Search, ShieldOff, Sparkles, Users, X,
} from 'lucide-react';
import { CountyMap } from '@/components/county-map';
import { METRICS, parseCSV, formatValue } from '@/lib/data.mjs';
import { clampFloatingPanel } from '@/lib/map-utils.mjs';

const PRIMARY = ['OBESITY', 'DIABETES', 'LPA', 'MHLTH', 'BPHIGH', 'CSMOKING', 'DEPRESSION', 'ACCESS2'];
const ICONS = { OBESITY: Users, DIABETES: Droplets, LPA: Footprints, MHLTH: Brain, BPHIGH: Heart, CSMOKING: Cigarette, DEPRESSION: Frown, ACCESS2: ShieldOff };
const STATE_NAMES = {AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',CT:'Connecticut',DE:'Delaware',DC:'District of Columbia',FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming'};

function confidence(row) {
  return row?.low != null && row?.high != null ? `${row.low}–${row.high}%` : 'Interval unavailable';
}

function Drawer({ open, title, eyebrow, onClose, children, wide = false }) {
  if (!open) return null;
  return (
    <div className="drawer-layer">
      <button className="drawer-scrim" aria-label="Close panel" onClick={onClose} />
      <aside className={`drawer ${wide ? 'drawer-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className="drawer-header">
          <div><p className="drawer-eyebrow">{eyebrow}</p><h2>{title}</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Close panel" autoFocus><X /></button>
        </header>
        <div className="drawer-body">{children}</div>
      </aside>
    </div>
  );
}

function CountyPicker({ label, value, counties, onChange }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value || ''} onChange={(event) => onChange(event.target.value)} disabled={!counties.length}>
        {counties.map((county) => <option value={county.id} key={county.id}>{county.name}, {county.state}</option>)}
      </select>
    </label>
  );
}

function MetricRows({ county, compact = false }) {
  return (
    <div className={compact ? 'metric-mini-grid' : 'detail-metrics'}>
      {PRIMARY.map((code) => {
        const Icon = ICONS[code];
        const row = county?.metrics[code];
        return (
          <div className={compact ? 'metric-mini' : 'detail-metric'} key={code}>
            <Icon aria-hidden="true" />
            <div><span>{METRICS[code]}</span><strong>{formatValue(row?.value)}</strong>{!compact && <small>{confidence(row)}</small>}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function Dashboard() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  const [source, setSource] = useState('');
  const [year, setYear] = useState('');
  const [type, setType] = useState('Crude prevalence');
  const [metric, setMetric] = useState('OBESITY');
  const [county, setCounty] = useState('45019');
  const [other, setOther] = useState('37183');
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [state, setState] = useState('All states');
  const [sortField, setSortField] = useState('county');
  const [sortDirection, setSortDirection] = useState('asc');
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');
  const [hideMissing, setHideMissing] = useState(false);
  const [drawer, setDrawer] = useState('');
  const [hoverCard, setHoverCard] = useState(null);
  const hoverId = useRef('');
  const fileInput = useRef(null);

  function accept(data, label) {
    if (!data.length) throw new Error('The data source is empty. Import county observations first.');
    setRows(data);
    setSource(label);
    setYear(String(data.reduce((latest, row) => Math.max(latest, row.year), 0)));
    setType(data.some((row) => row.data_value_type === 'Crude prevalence') ? 'Crude prevalence' : data[0].data_value_type);
    setError('');
    setState('All states');
    setQuery('');
  }

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
        if (Boolean(url) !== Boolean(key)) throw new Error('Set both Supabase environment variables, or leave both blank to use CSV.');
        if (url && key) {
          const { createClient } = await import('@supabase/supabase-js');
          const db = createClient(url, key);
          const all = [];
          for (let start = 0; ; start += 1000) {
            const { data, error: dbError } = await db.from('pulsepoint_observations').select('*').order('county_fips').order('measure_code').order('year').order('data_value_type').range(start, start + 999);
            if (dbError) throw new Error('Supabase could not load data. Check the schema, public SELECT policy and publishable key.');
            all.push(...data);
            if (data.length < 1000) break;
          }
          if (active) accept(all, 'Supabase');
        } else {
          const response = await fetch('/data/places.csv');
          if (!response.ok) throw new Error('Could not find public/data/places.csv.');
          const data = parseCSV(await response.text());
          if (active) accept(data, 'Local CSV');
        }
      } catch (loadError) {
        if (active) setError(loadError.message);
      } finally {
        if (active) setBusy(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    function closeOnEscape(event) {
      if (event.key === 'Escape') {
        setDrawer('');
        setHoverCard(null);
      }
    }
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);

  async function upload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try { accept(parseCSV(await file.text()), file.name); }
    catch (uploadError) { setError(uploadError.message); }
    finally { setBusy(false); event.target.value = ''; }
  }

  const years = useMemo(() => [...new Set(rows.map((row) => String(row.year)))].sort().reverse(), [rows]);
  const types = useMemo(() => [...new Set(rows.map((row) => row.data_value_type))], [rows]);
  const counties = useMemo(() => {
    const result = new Map();
    for (const row of rows) {
      if (String(row.year) !== year || row.data_value_type !== type) continue;
      if (!result.has(row.county_fips)) result.set(row.county_fips, { id: row.county_fips, name: row.county_name, state: row.state_abbr, metrics: {} });
      result.get(row.county_fips).metrics[row.measure_code] = row;
    }
    return [...result.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [rows, year, type]);

  const selected = counties.find((item) => item.id === county) || counties[0];
  const compared = counties.find((item) => item.id === other) || counties.find((item) => item.id !== selected?.id) || counties[0];
  const states = [...new Set(counties.map((item) => item.state))].sort();
  const filtered = useMemo(() => {
    const min = minValue === '' ? null : Number(minValue);
    const max = maxValue === '' ? null : Number(maxValue);
    let list = counties.filter((item) => {
      if (state !== 'All states' && item.state !== state) return false;
      if (query && !`${item.name} ${item.state} ${STATE_NAMES[item.state] || ''} ${item.id}`.toLowerCase().includes(query.toLowerCase())) return false;
      const row = item.metrics[metric];
      if (hideMissing && row?.value == null) return false;
      if (min != null && (row?.value == null || row.value < min)) return false;
      if (max != null && (row?.value == null || row.value > max)) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      const first = a.metrics[metric];
      const second = b.metrics[metric];
      let comparison = 0;
      if (sortField === 'county') comparison = a.name.localeCompare(b.name) || a.state.localeCompare(b.state);
      else if (sortField === 'state') comparison = a.state.localeCompare(b.state) || a.name.localeCompare(b.name);
      else if (sortField === 'fips') comparison = a.id.localeCompare(b.id);
      else if (sortField === 'ci-width') {
        const aWidth = first?.low != null && first?.high != null ? first.high - first.low : null;
        const bWidth = second?.low != null && second?.high != null ? second.high - second.low : null;
        if (aWidth == null && bWidth == null) comparison = 0;
        else if (aWidth == null) return 1;
        else if (bWidth == null) return -1;
        else comparison = aWidth - bWidth;
      } else {
        if (first?.value == null && second?.value == null) comparison = 0;
        else if (first?.value == null) return 1;
        else if (second?.value == null) return -1;
        else comparison = first.value - second.value;
      }
      return sortDirection === 'desc' ? -comparison : comparison;
    });
    return list;
  }, [counties, state, query, metric, hideMissing, minValue, maxValue, sortField, sortDirection]);

  const searchMatches = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    return counties.filter((item) => `${item.name} ${item.state} ${STATE_NAMES[item.state] || ''} ${item.id}`.toLowerCase().includes(normalized)).slice(0, 8);
  }, [query, counties]);

  const range = filtered.map((item) => item.metrics[metric]?.value).filter((value) => value != null);
  const low = range.length ? Math.min(...range) : null;
  const high = range.length ? Math.max(...range) : null;
  const sample = rows.some((row) => row.is_sample);
  const hoveredCounty = hoverCard ? counties.find((item) => item.id === hoverCard.id) : null;

  const selectCounty = useCallback((id, nextDrawer = 'details') => {
    setCounty(id);
    setDrawer(nextDrawer);
    setHoverCard(null);
    hoverId.current = '';
  }, []);

  const handleHover = useCallback((id, event) => {
    if (!id || !event) {
      if (!hoverId.current) return;
      hoverId.current = '';
      setHoverCard(null);
      return;
    }
    if (hoverId.current === id) return;
    hoverId.current = id;
    const position = clampFloatingPanel(event.clientX, event.clientY, window.innerWidth, window.innerHeight);
    setHoverCard({ id, ...position });
  }, []);

  const navItems = [
    [ArrowRightLeft, 'Compare', 'compare'],
    [Info, 'About data', 'data'],
  ];

  return (
    <main className="experience-shell">
      <header className="floating-header">
        <button className="brand-lockup" onClick={() => setDrawer('')} aria-label="PulsePoint home">
          <span className="brand-mark"><Activity /></span>
          <span><strong>PulsePoint</strong><small>People. Places. Health.</small></span>
        </button>
        <div className="global-search">
          <Search aria-hidden="true" />
          <input
            aria-label="Search county, state, or FIPS"
            placeholder="Find a county, state, or FIPS"
            value={query}
            onChange={(event) => { setQuery(event.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
          />
          {query && <button className="clear-search" aria-label="Clear search" onClick={() => setQuery('')}><X /></button>}
          {searchOpen && searchMatches.length > 0 && (
            <div className="search-results">
              {searchMatches.map((item) => (
                <button key={item.id} onMouseDown={() => { selectCounty(item.id); setQuery(''); setSearchOpen(false); }}>
                  <MapPin /><span><strong>{item.name}, {item.state}</strong><small>County FIPS {item.id}</small></span><ChevronRight />
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          className={`source-pill ${sample ? 'sample' : ''}`}
          onClick={() => setDrawer('explore')}
          aria-label={`Show the ${filtered.length.toLocaleString()} counties highlighted on the map`}
          aria-expanded={drawer === 'explore'}
          disabled={busy}
        >
          <span className="source-dot" />
          <span className="source-label">
            {busy ? 'Loading' : <><strong>{filtered.length.toLocaleString()}</strong><span className="source-word">{sample ? ' sample counties' : ' counties'}</span></>}
          </span>
          <ChevronRight />
        </button>
      </header>

      <section className="map-experience" aria-label="County health explorer">
        <div className="hero-copy">
          <p className="eyebrow"><Sparkles /> Community health atlas</p>
          <h1>Health, mapped<br />closer to home.</h1>
          <p>Move across the map to reveal the eight signals shaping every county.</p>
        </div>

        {error ? (
          <div className="center-message error-message" role="alert"><ShieldOff /><h2>We could not load the map</h2><p>{error}</p><button onClick={() => fileInput.current?.click()}>Choose a CSV</button></div>
        ) : busy ? (
          <div className="center-message loading-message" role="status"><Activity /><p>Mapping community health…</p></div>
        ) : (
          <CountyMap counties={filtered} selected={selected?.id} onSelect={selectCounty} onHover={handleHover} metric={metric} />
        )}

        <div className="metric-dock" aria-label="Choose health indicator">
          {PRIMARY.map((code) => {
            const Icon = ICONS[code];
            return <button key={code} className={metric === code ? 'active' : ''} onClick={() => setMetric(code)} aria-pressed={metric === code} title={METRICS[code]}><Icon /><span>{METRICS[code]}</span></button>;
          })}
        </div>

        <div className="map-legend">
          <div><span>Lower</span><i /><span>Higher</span></div>
          <p>{formatValue(low)} <strong>{METRICS[metric]}</strong> {formatValue(high)}</p>
        </div>

        <p className="map-instruction"><span className="mouse-dot" /> Hover to preview <span /> Click to explore</p>
      </section>

      <nav className="floating-nav" aria-label="Explorer tools">
        {navItems.map(([Icon, label, id]) => <button key={id} className={drawer === id ? 'active' : ''} onClick={() => setDrawer(drawer === id ? '' : id)}><Icon /><span>{label}</span></button>)}
      </nav>

      {hoveredCounty && (
        <article className="hover-card" style={{ left: hoverCard.left, top: hoverCard.top }}>
          <header><div><p>{hoveredCounty.state} · FIPS {hoveredCounty.id}</p><h2>{hoveredCounty.name}</h2></div><span className="live-dot" /></header>
          <div className="hover-feature"><span>{METRICS[metric]}</span><strong>{formatValue(hoveredCounty.metrics[metric]?.value)}</strong><small>95% confidence interval · {confidence(hoveredCounty.metrics[metric])}</small></div>
          <MetricRows county={hoveredCounty} compact />
          <p className="hover-hint">Click county to pin full details <ChevronRight /></p>
        </article>
      )}

      <Drawer open={drawer === 'details'} title={selected ? `${selected.name}, ${selected.state}` : 'County details'} eyebrow={selected ? `County FIPS ${selected.id}` : 'County snapshot'} onClose={() => setDrawer('')}>
        {selected && <>
          <div className="featured-reading"><span>{METRICS[metric]}</span><strong>{formatValue(selected.metrics[metric]?.value)}</strong><small>95% confidence interval · {confidence(selected.metrics[metric])}</small></div>
          <MetricRows county={selected} />
          <button className="primary-button" onClick={() => { setOther(compared?.id); setDrawer('compare'); }}><ArrowRightLeft /> Compare this county</button>
        </>}
      </Drawer>

      <Drawer open={drawer === 'explore'} title="Explore counties" eyebrow={`${filtered.length.toLocaleString()} matches`} onClose={() => setDrawer('')} wide>
        <div className="filter-grid">
          <label className="field field-wide"><span>Search</span><div className="input-with-icon"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="County, state, or FIPS" /></div></label>
          <label className="field field-wide"><span>Health indicator</span><select value={metric} onChange={(event) => setMetric(event.target.value)}>{Object.entries(METRICS).map(([code, name]) => <option value={code} key={code}>{name}</option>)}</select></label>
          <label className="field"><span>State</span><select value={state} onChange={(event) => setState(event.target.value)}><option>All states</option>{states.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="field"><span>Sort by</span><select value={sortField} onChange={(event) => setSortField(event.target.value)}><option value="county">County name</option><option value="state">State</option><option value="fips">County FIPS</option><option value="value">Indicator value</option><option value="ci-width">Confidence interval width</option></select></label>
          <label className="field"><span>Sort direction</span><select value={sortDirection} onChange={(event) => setSortDirection(event.target.value)}><option value="asc">Ascending / lowest first</option><option value="desc">Descending / highest first</option></select></label>
          <label className="field"><span>Minimum %</span><input type="number" min="0" max="100" value={minValue} onChange={(event) => setMinValue(event.target.value)} placeholder="0" /></label>
          <label className="field"><span>Maximum %</span><input type="number" min="0" max="100" value={maxValue} onChange={(event) => setMaxValue(event.target.value)} placeholder="100" /></label>
          <label className="check-field"><input type="checkbox" checked={hideMissing} onChange={(event) => setHideMissing(event.target.checked)} /><span className="fake-check">{hideMissing && <Check />}</span>Hide missing data</label>
        </div>
        <div className="explorer-context"><span>Results show</span><strong>{METRICS[metric]}</strong></div>
        <div className="county-results">
          {filtered.slice(0, 150).map((item) => <button key={item.id} onClick={() => selectCounty(item.id)}><span><strong>{item.name}</strong><small>{item.state} · {item.id}</small></span><span className="result-value">{formatValue(item.metrics[metric]?.value)}</span><ChevronRight /></button>)}
          {!filtered.length && <p className="empty-state">No counties match these filters.</p>}
          {filtered.length > 150 && <p className="result-note">Showing the first 150 counties. Refine the filters to narrow the list.</p>}
        </div>
      </Drawer>

      <Drawer open={drawer === 'compare'} title="Compare communities" eyebrow={`${year} · ${type}`} onClose={() => setDrawer('')} wide>
        <div className="compare-pickers"><CountyPicker label="County A · Cyan" value={selected?.id} counties={counties} onChange={setCounty} /><CountyPicker label="County B · Violet" value={compared?.id} counties={counties} onChange={setOther} /></div>
        <div className="comparison-chart">
          {PRIMARY.map((code) => (
            <div className="comparison-row" key={code}>
              <span>{METRICS[code]}</span>
              {[selected, compared].map((item, index) => {
                const row = item?.metrics[code];
                return <div className={`compare-value ${index ? 'violet' : ''}`} key={index}><strong>{formatValue(row?.value)}</strong><div className="bar-track"><i style={{ width: `${row?.value ?? 0}%` }} /></div><small>{confidence(row)}</small></div>;
              })}
            </div>
          ))}
        </div>
      </Drawer>

      <Drawer open={drawer === 'data'} title="About the data" eyebrow={source ? `Source · ${source}` : 'Data & methodology'} onClose={() => setDrawer('')}>
        <div className="data-controls">
          <label className="field"><span>Observation year</span><select value={year} onChange={(event) => setYear(event.target.value)}>{years.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="field"><span>Estimate type</span><select value={type} onChange={(event) => setType(event.target.value)}>{types.map((item) => <option key={item}>{item}</option>)}</select></label>
          <button className="upload-button" onClick={() => fileInput.current?.click()} disabled={busy}><FileUp /> Open CDC CSV</button>
        </div>
        {sample && <p className="data-callout">The bundled sample uses fictional values for interface demonstration.</p>}
        <div className="prose"><h3>What you are seeing</h3><p>CDC PLACES provides modeled county estimates rather than individual medical records. Confidence intervals communicate the uncertainty around every estimate; similar or overlapping intervals should not be treated as proof of a meaningful difference.</p><h3>Known gaps</h3><p>Missing values remain unavailable rather than being treated as zero. Kentucky, Pennsylvania, and some low-population counties may have gaps in this release because the source survey did not provide a reliable estimate.</p><h3>Boundaries</h3><p>Map boundaries come from us-atlas and are derived from U.S. Census cartographic boundaries. Boundary vintages can differ from the health dataset.</p><a href="https://data.cdc.gov/500-Cities-Places/PLACES-Local-Data-for-Better-Health-County-Data-20/swc5-untb" target="_blank" rel="noreferrer">Visit the CDC PLACES dataset <ChevronRight /></a></div>
      </Drawer>

      <input ref={fileInput} hidden type="file" accept=".csv,text/csv" onChange={upload} />
      {!busy && !error && !counties.length && <div className="center-message" role="status"><BarChart3 /><p>No observations match this year and estimate type.</p></div>}
    </main>
  );
}
