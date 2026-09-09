'use client';

import { memo, useMemo } from 'react';
import { feature, mesh } from 'topojson-client';
import { geoPath } from 'd3-geo';
import atlas from 'us-atlas/counties-albers-10m.json';
import { metricColor } from '@/lib/map-utils.mjs';

const path = geoPath();
const countyShapes = feature(atlas, atlas.objects.counties).features;
const outlines = countyShapes.map((shape) => ({
  id: String(shape.id).padStart(5, '0'),
  d: path(shape),
}));
const stateBorders = path(mesh(atlas, atlas.objects.states, (first, second) => first !== second));
const nationOutline = path(feature(atlas, atlas.objects.nation));

function CountyMapComponent({ counties, selected, onSelect, onHover, metric }) {
  const values = useMemo(() => new Map(counties.map((county) => [county.id, county])), [counties]);
  const [min, max] = useMemo(() => {
    const range = counties.map((county) => county.metrics[metric]?.value).filter((value) => value != null);
    return [range.length ? Math.min(...range) : 0, range.length ? Math.max(...range) : 0];
  }, [counties, metric]);

  const renderedCounties = useMemo(() => outlines.map((outline) => {
    const county = values.get(outline.id);
    const value = county?.metrics[metric]?.value;
    return (
      <path
        key={outline.id}
        d={outline.d}
        fill={metricColor(value, min, max)}
        className={`map-county ${county ? 'available' : ''} ${outline.id === selected ? 'selected' : ''}`}
        data-county-id={county ? outline.id : undefined}
      />
    );
  }), [values, metric, min, max, selected]);

  function countyIdFromEvent(event) {
    return event.target instanceof SVGPathElement ? event.target.dataset.countyId : '';
  }

  return (
    <div className="map-stage" onPointerLeave={() => onHover?.('', null)}>
      <div className="map-aura" aria-hidden="true" />
      <svg
        className="county-map"
        viewBox="0 0 975 610"
        role="img"
        aria-label="Interactive United States county health map. Search and explorer controls provide keyboard access."
        onPointerMove={(event) => {
          const id = countyIdFromEvent(event);
          if (id) onHover?.(id, event);
        }}
        onPointerLeave={() => onHover?.('', null)}
        onClick={(event) => {
          const id = countyIdFromEvent(event);
          if (id) onSelect(id);
        }}
      >
        <g className="map-surface">
          {renderedCounties}
          <path className="state-borders" d={stateBorders} aria-hidden="true" />
          <path className="nation-outline" d={nationOutline} aria-hidden="true" />
        </g>
      </svg>
    </div>
  );
}

export const CountyMap = memo(CountyMapComponent);
