'use client';
import { useMemo, useState } from 'react';
import { feature } from 'topojson-client';
import { geoPath } from 'd3-geo';
import atlas from 'us-atlas/counties-albers-10m.json';
import { formatValue } from '@/lib/data.mjs';
const shapes = feature(atlas, atlas.objects.counties).features;
const path = geoPath();
const outlines = shapes.map(shape=>({id:String(shape.id).padStart(5,'0'),d:path(shape)}));
export function CountyMap({ counties, selected, onSelect, metric }) {
  const [hover, setHover] = useState('');
  const values = useMemo(()=>new Map(counties.map(c=>[c.id,c])),[counties]);
  const range = counties.map(c=>c.metrics[metric]?.value).filter(v=>v!=null);
  const min = range.length ? Math.min(...range) : 0, max = range.length ? Math.max(...range) : 0;
  const color = v => v==null ? '#142239' : `hsl(${260-((v-min)/(max-min||1))*72} 76% 58%)`;
  const active = values.get(hover || selected);
  return <div className="map-wrap">
    <svg className="county-map" viewBox="0 0 975 610" role="group" aria-label="County health map. Use the county selector for keyboard navigation.">
      {outlines.map(s=>{const c=values.get(s.id), v=c?.metrics[metric]?.value; return <path key={s.id} d={s.d} fill={color(v)} stroke={s.id===selected?'#fff':'#223652'} strokeWidth={s.id===selected?1.8:0.35} className={c?'map-county available':'map-county'} onClick={()=>c&&onSelect(s.id)} onMouseEnter={()=>setHover(s.id)} onMouseLeave={()=>setHover('')}><title>{c?`${c.name}, ${c.state}: ${formatValue(v)}`:'No data in this file'}</title></path>;})}
    </svg>
    <div className="map-caption"><span className="active-label">{active ? `${active.name}, ${active.state} · ${formatValue(active.metrics[metric]?.value)}` : 'Select a colored county'}</span><div className="legend"><span className="legend-label">Lower</span><span className="legend-value">{formatValue(min)}</span><i/><span className="legend-value">{formatValue(max)}</span><span className="legend-label">Higher</span><span className="legend-divider"/><span className="missing-swatch"/><span className="legend-label">No data</span></div></div>
  </div>;
}
