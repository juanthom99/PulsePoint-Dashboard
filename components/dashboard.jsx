'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, House, Map as MapIcon, ChartNoAxesCombined, Info, Search, Users, Droplets, Footprints, Brain, Heart, Cigarette, Frown, ShieldOff, Upload, MapPin, ArrowUpRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CountyMap } from '@/components/county-map';
import { METRICS, parseCSV, formatValue } from '@/lib/data.mjs';

const primary = ['OBESITY','DIABETES','LPA','MHLTH','BPHIGH','CSMOKING','DEPRESSION','ACCESS2'];
const icons = [Users,Droplets,Footprints,Brain,Heart,Cigarette,Frown,ShieldOff];
const STATE_NAMES = {AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',CT:'Connecticut',DE:'Delaware',DC:'District of Columbia',FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming'};
const SECTION_IDS = ['overview','explore','compare','about'];
export default function Dashboard() {
  const [rows,setRows]=useState([]), [error,setError]=useState(''), [busy,setBusy]=useState(true);
  const [source,setSource]=useState(''), [year,setYear]=useState(''), [type,setType]=useState('Crude prevalence');
  const [metric,setMetric]=useState('OBESITY'), [county,setCounty]=useState('45019'), [other,setOther]=useState('37183');
  const [search,setSearch]=useState(''), [state,setState]=useState('All states');
  const [sortOrder,setSortOrder]=useState('none'), [minValue,setMinValue]=useState(''), [maxValue,setMaxValue]=useState(''), [hideMissing,setHideMissing]=useState(false), [exploreMetric,setExploreMetric]=useState('OBESITY');
  const [searchOpen,setSearchOpen]=useState(false), [activeSection,setActiveSection]=useState('overview');
  const fileInput=useRef(null);
  function accept(data,label) {
    if (!data.length) throw new Error('The data source is empty. Import county observations first.');
    setRows(data); setSource(label); setYear(String(data.reduce((latest,r)=>Math.max(latest,r.year),0)));
    setType(data.some(r=>r.data_value_type==='Crude prevalence')?'Crude prevalence':data[0].data_value_type);
    setError(''); setState('All states'); setSearch('');
  }
  useEffect(()=>{
    let active=true;
    async function load() {
      try {
        const url=process.env.NEXT_PUBLIC_SUPABASE_URL, key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
        if (Boolean(url)!==Boolean(key)) throw new Error('Set both Supabase environment variables, or leave both blank to use CSV.');
        if (url && key) {
          const {createClient}=await import('@supabase/supabase-js');
          const db=createClient(url,key); const all=[];
          for(let start=0;;start+=1000) {
            const {data,error}=await db.from('pulsepoint_observations').select('*').order('county_fips').order('measure_code').order('year').order('data_value_type').range(start,start+999);
            if(error) throw new Error('Supabase could not load data. Check the schema, public SELECT policy and publishable key.');
            all.push(...data); if(data.length<1000) break;
          }
          if(active) accept(all,'Supabase');
        } else {
          const response=await fetch('/data/places.csv');
          if(!response.ok) throw new Error('Could not find public/data/places.csv.');
          const data=parseCSV(await response.text()); if(active) accept(data,'Local CSV');
        }
      } catch(e) {if(active) setError(e.message);} finally {if(active) setBusy(false);}
    }
    load(); return ()=>{active=false;};
  },[]);
  async function upload(event) {
    const file=event.target.files?.[0]; if(!file) return;
    setBusy(true);
    try {accept(parseCSV(await file.text()),file.name);} catch(e){setError(e.message);} finally{setBusy(false);event.target.value='';}
  }
  const years=useMemo(()=>[...new Set(rows.map(r=>String(r.year)))].sort().reverse(),[rows]);
  const types=useMemo(()=>[...new Set(rows.map(r=>r.data_value_type))],[rows]);
  const counties=useMemo(()=>{
    const result=new Map();
    for(const r of rows) {
      if(String(r.year)!==year || r.data_value_type!==type) continue;
      if(!result.has(r.county_fips)) result.set(r.county_fips,{id:r.county_fips,name:r.county_name,state:r.state_abbr,metrics:{}});
      result.get(r.county_fips).metrics[r.measure_code]=r;
    }
    return [...result.values()].sort((a,b)=>a.name.localeCompare(b.name));
  },[rows,year,type]);
  const selected=counties.find(c=>c.id===county)||counties[0];
  const compare=counties.find(c=>c.id===other)||counties.find(c=>c.id!==selected?.id)||counties[0];
  const states=[...new Set(counties.map(c=>c.state))].sort();
  const filtered=useMemo(()=>{
    const min=minValue===''?null:Number(minValue), max=maxValue===''?null:Number(maxValue);
    let list=counties.filter(c=>{
      if(state!=='All states'&&c.state!==state) return false;
      if(!`${c.name} ${c.state} ${STATE_NAMES[c.state]||''}`.toLowerCase().includes(search.toLowerCase())) return false;
      const row=c.metrics[exploreMetric];
      if(hideMissing&&row?.value==null) return false;
      if(min!=null&&(row?.value==null||row.value<min)) return false;
      if(max!=null&&(row?.value==null||row.value>max)) return false;
      return true;
    });
    if(sortOrder!=='none') list=[...list].sort((a,b)=>{
      const ra=a.metrics[exploreMetric], rb=b.metrics[exploreMetric];
      if(sortOrder==='ci-widest'||sortOrder==='ci-narrowest') {
        const wa=ra?.low!=null&&ra?.high!=null?ra.high-ra.low:null;
        const wb=rb?.low!=null&&rb?.high!=null?rb.high-rb.low:null;
        if(wa==null&&wb==null) return 0;
        if(wa==null) return 1;
        if(wb==null) return -1;
        return sortOrder==='ci-widest'?wb-wa:wa-wb;
      }
      const va=ra?.value, vb=rb?.value;
      if(va==null&&vb==null) return 0;
      if(va==null) return 1;
      if(vb==null) return -1;
      return sortOrder==='highest'?vb-va:va-vb;
    });
    return list;
  },[counties,state,search,exploreMetric,sortOrder,minValue,maxValue,hideMissing]);
  const searchMatches=useMemo(()=>{
    const q=search.trim().toLowerCase();
    if(!q) return [];
    return counties.filter(c=>`${c.name} ${c.state} ${STATE_NAMES[c.state]||''}`.toLowerCase().includes(q)).slice(0,8);
  },[search,counties]);
  useEffect(()=>{
    const sections=SECTION_IDS.map(id=>document.getElementById(id)).filter(Boolean);
    if(!sections.length) return;
    const observer=new IntersectionObserver(entries=>{
      const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio);
      if(visible[0]) setActiveSection(visible[0].target.id);
    },{rootMargin:'-15% 0px -70% 0px',threshold:[0,0.25,0.5,0.75,1]});
    sections.forEach(s=>observer.observe(s));
    return ()=>observer.disconnect();
  },[busy]);
  const sample=rows.some(r=>r.is_sample);
  function CountySelect({label,value,onChange}) {return <label className="county-picker"><span>{label}</span><select value={value||''} onChange={e=>onChange(e.target.value)} disabled={!counties.length}>{counties.map(c=><option value={c.id} key={c.id}>{c.name}, {c.state}</option>)}</select></label>;}
  return <div className="app-shell">
    <aside className="sidebar"><a className="brand" href="#overview"><Activity size={36}/><span>PulsePoint</span></a><p className="brand-caption">People. Places. Health.</p>
      <nav aria-label="Main navigation">{[[House,'Overview','overview'],[MapIcon,'Explore counties','explore'],[ChartNoAxesCombined,'Compare','compare'],[Info,'About the data','about']].map(([Icon,label,id])=><a key={id} href={`#${id}`} className={activeSection===id?'active':''} aria-current={activeSection===id?'page':undefined}><Icon size={20}/>{label}</a>)}</nav>
      <div className="sidebar-note"><Activity/><p>Understanding begins<br/>with a closer look.</p></div>
    </aside>
    <main id="overview">
      <header className="topbar"><label className="search"><Search size={20}/><input aria-label="Search counties or states" placeholder="Search a county or state" value={search} onChange={e=>{setSearch(e.target.value);setSearchOpen(true);}} onFocus={()=>setSearchOpen(true)} onBlur={()=>setTimeout(()=>setSearchOpen(false),150)}/>{searchOpen&&searchMatches.length>0&&<div className="search-results">{searchMatches.map(c=><button key={c.id} onMouseDown={()=>{setCounty(c.id);setSearch('');setSearchOpen(false);}}>{c.name}, {c.state}</button>)}</div>}</label><span className={`status ${sample?'sample':''}`}>{busy?'Loading data':sample?'Sample data':'County estimates'}</span></header>
      <div className="intro"><div><p className="eyebrow">COMMUNITY HEALTH EXPLORER</p><h1>Understand the health of your community</h1><p>Explore patterns. Compare counties. Ask better questions.</p></div><Activity className="hero-pulse" aria-hidden="true"/></div>
      <div className="toolbar"><CountySelect label="Selected county" value={selected?.id} onChange={setCounty}/><label>Observation year<select value={year} onChange={e=>setYear(e.target.value)}>{years.map(y=><option key={y}>{y}</option>)}</select></label><label>Estimate type<select value={type} onChange={e=>setType(e.target.value)}>{types.map(t=><option key={t}>{t}</option>)}</select></label><button className="upload" onClick={()=>fileInput.current?.click()} disabled={busy}><Upload size={16}/>Open CSV</button><input ref={fileInput} hidden type="file" accept=".csv,text/csv" onChange={upload}/></div>
      {error&&<div role="alert" className="error">{error}</div>}
      {sample&&<p className="sample-note">Design sample: all displayed values and intervals are fictional. Open your CDC CSV to explore real estimates.</p>}
      {!busy&&!error&&!counties.length&&<p role="status">No observations match this year and estimate type. Choose another combination.</p>}
      <section className="kpis" aria-label="Selected county health indicators">{primary.map((code,i)=>{const Icon=icons[i], row=selected?.metrics[code]; return <Card key={code} className={`metric ${i%2?'violet':''}`}><CardContent><Icon size={25}/><div><p>{METRICS[code]}</p><strong>{formatValue(row?.value)}</strong><small>{row?.value!=null?'Estimated adult prevalence':'No estimate for this selection'}</small></div></CardContent></Card>;})}</section>
      <div className="main-grid"><Card className="map-panel"><CardHeader><div><CardTitle><MapIcon/>Explore community health</CardTitle><p>Choose an indicator, then select a colored county.</p></div><label>Indicator<select value={metric} onChange={e=>setMetric(e.target.value)}>{Object.entries(METRICS).map(([code,name])=><option value={code} key={code}>{name}</option>)}</select></label></CardHeader><CardContent><CountyMap counties={filtered} selected={selected?.id} onSelect={setCounty} metric={metric}/></CardContent></Card>
      <Card className="snapshot"><CardHeader><CardTitle><MapPin/>County snapshot</CardTitle></CardHeader><CardContent><h2>{selected?`${selected.name}, ${selected.state}`:'Select a county'}</h2><p className="muted">{year} observation · {type}</p><div className="snapshot-meta"><div><small>County FIPS</small><strong>{selected?.id||'—'}</strong></div><a className="button" href="#compare">Compare county <ArrowUpRight size={16}/></a></div><hr/>{Object.entries(METRICS).map(([code,name])=><div className="stat-row" key={code}><span>{name}</span><strong>{formatValue(selected?.metrics[code]?.value)}</strong></div>)}</CardContent></Card></div>
      <Card id="explore" className="explorer"><CardHeader><div><CardTitle><Search/>Explore counties</CardTitle><p>{filtered.length.toLocaleString()} counties match your filters. Select a name to update the dashboard.</p></div></CardHeader><CardContent><div className="explorer-filters"><label>Indicator<select value={exploreMetric} onChange={e=>setExploreMetric(e.target.value)}>{Object.entries(METRICS).map(([code,name])=><option value={code} key={code}>{name}</option>)}</select></label><label>State<select value={state} onChange={e=>setState(e.target.value)}><option>All states</option>{states.map(s=><option key={s}>{s}</option>)}</select></label><label>Sort by<select value={sortOrder} onChange={e=>setSortOrder(e.target.value)}><option value="none">Unsorted</option><option value="highest">Highest value first</option><option value="lowest">Lowest value first</option><option value="ci-widest">Widest confidence interval first</option><option value="ci-narrowest">Narrowest confidence interval first</option></select></label><label>Min %<input type="number" min="0" max="100" placeholder="0" value={minValue} onChange={e=>setMinValue(e.target.value)}/></label><label>Max %<input type="number" min="0" max="100" placeholder="100" value={maxValue} onChange={e=>setMaxValue(e.target.value)}/></label><label className="checkbox-label"><input type="checkbox" checked={hideMissing} onChange={e=>setHideMissing(e.target.checked)}/>Hide missing data</label></div><div className="table-scroll"><table><thead><tr><th>County</th><th>State</th><th>{METRICS[exploreMetric]}</th><th>95% confidence interval</th></tr></thead><tbody>{filtered.slice(0,100).map(c=><tr key={c.id}><td><button className="text-button" onClick={()=>{setCounty(c.id);document.getElementById('overview').scrollIntoView();}}>{c.name}</button></td><td>{c.state}</td><td>{formatValue(c.metrics[exploreMetric]?.value)}</td><td>{c.metrics[exploreMetric]?.low!=null&&c.metrics[exploreMetric]?.high!=null?`${c.metrics[exploreMetric].low}–${c.metrics[exploreMetric].high}%`:'Unavailable'}</td></tr>)}</tbody></table></div>{filtered.length===0&&<p>No matching counties. Try different filters.</p>}{filtered.length>100&&<p className="muted">Showing the first 100 matches. Narrow your filters to find more counties.</p>}</CardContent></Card>
      <Card id="compare" className="comparison"><CardHeader><div><CardTitle><ChartNoAxesCombined/>Compare communities</CardTitle><p>Matching observation year and estimate type. Bars share a 0–100% scale.</p></div></CardHeader><CardContent><div className="compare-selects"><CountySelect label="County A · Cyan" value={selected?.id} onChange={setCounty}/><CountySelect label="County B · Violet" value={compare?.id} onChange={setOther}/></div>{primary.map(code=><div className="comparison-row" key={code}><span>{METRICS[code]}</span>{[selected,compare].map((c,i)=>{const r=c?.metrics[code];return <div className={`bar-cell ${i?'violet':''}`} key={i}><strong>{formatValue(r?.value)}</strong><div className="bar-track" role="img" aria-label={`${c?.name||'County'} ${METRICS[code]} ${formatValue(r?.value)}`}><div style={{width:`${r?.value??0}%`}}/></div><small>{r?.low!=null&&r?.high!=null?`95% CI: ${r.low}–${r.high}%`:'Interval unavailable'}</small></div>;})}</div>)}</CardContent></Card>
      <Card id="about" className="about"><CardHeader><CardTitle><Info/>About the data</CardTitle></CardHeader><CardContent><p>{sample?'The bundled sample contains invented values for six counties and is only for demonstrating the interface.':'The dashboard displays the observations provided in your file or Supabase table.'} Source loaded: {source||'none'}.</p><p>CDC PLACES provides modeled estimates, not individual medical records. Observation years can differ from release years. Crude prevalence reflects the population as observed; age adjusted prevalence supports comparisons accounting for age differences. Keep the same estimate type when comparing counties. Missing data is never treated as zero.</p><p>Confidence intervals communicate estimation uncertainty. Similar or overlapping estimates should not be treated as proof of a meaningful difference. No overall health score or national average is calculated.</p><p>Kentucky and Pennsylvania are missing from this release for measures based on 2023 BRFSS data (including obesity, diabetes, high blood pressure, physical inactivity, smoking, depression, mental distress and health insurance), per CDC's own release notes. Individual low-population counties elsewhere may also show no data where the underlying survey didn't collect enough responses for a reliable estimate. These gaps come from the source data, not from this dashboard.</p><a href="https://data.cdc.gov/500-Cities-Places/PLACES-Local-Data-for-Better-Health-County-Data-20/swc5-untb" target="_blank" rel="noreferrer">CDC PLACES county dataset ↗</a><p className="muted">Map boundaries: us-atlas, derived from U.S. Census cartographic boundaries. Boundary vintages may differ from your dataset; the table includes every imported county even when a map boundary is absent.</p></CardContent></Card>
      <footer>PulsePoint · Community health, made clearer <span>{sample?'Illustrative sample data':'Source years shown with estimates'}</span></footer>
    </main>
  </div>;
}
