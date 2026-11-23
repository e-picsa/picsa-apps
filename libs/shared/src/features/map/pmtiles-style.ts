import type * as maplibregl from 'maplibre-gl';

export const GLOBAL_BASE_SOURCE_ID = 'global-base';
export const COUNTRY_DETAIL_SOURCE_ID = 'country-detail';

export const PMTILES_GLOBAL_URL = 'pmtiles://assets/mapTiles/global-base.pmtiles';
export const PMTILES_GLYPHS_URL = 'assets/mapTiles/fonts/{fontstack}/{range}.pbf';

/** Countries with bundled offline PMTiles detail extracts (`z7+`) */
export const PMTILES_GLOBAL_MAX_ZOOM = 6;
export const PMTILES_COUNTRY_MAX_ZOOM: Record<string, number> = {
  mw: 9,
  zm: 9,
  zw: 9,
};
export const PMTILES_SUPPORTED_COUNTRIES = new Set(Object.keys(PMTILES_COUNTRY_MAX_ZOOM));

export function normalizePmtilesCountryCode(countryCode?: string): string | undefined {
  const normalized = countryCode?.trim().toLowerCase();
  if (!normalized || !PMTILES_SUPPORTED_COUNTRIES.has(normalized)) {
    return undefined;
  }
  return normalized;
}

export function getCountryPmtilesUrl(countryCode: string): string {
  return `pmtiles://assets/mapTiles/${countryCode.trim().toLowerCase()}.pmtiles`;
}

/** Zoom threshold where offline PMTiles end and online vector fallback begins */
export function getOnlineFallbackMinZoom(countryCode?: string): number {
  const code = normalizePmtilesCountryCode(countryCode);
  const offlineMax = code ? PMTILES_COUNTRY_MAX_ZOOM[code] : PMTILES_GLOBAL_MAX_ZOOM;
  return offlineMax + 1;
}

const NAME_EXPRESSION: maplibregl.ExpressionSpecification = ['coalesce', ['get', 'name:latin'], ['get', 'name']];

const NOT_TUNNEL_FILTER: maplibregl.ExpressionSpecification = ['!=', ['get', 'brunnel'], 'tunnel'];
const NOT_MARITIME_DISPUTED: maplibregl.ExpressionSpecification = [
  'all',
  ['!=', ['get', 'maritime'], 1],
  ['!=', ['get', 'disputed'], 1],
];

function buildGlobalLayers(): maplibregl.LayerSpecification[] {
  return [
    {
      id: 'global-landcover-wood',
      type: 'fill',
      source: GLOBAL_BASE_SOURCE_ID,
      'source-layer': 'landcover',
      filter: ['==', ['get', 'class'], 'wood'],
      paint: { 'fill-antialias': false, 'fill-color': '#cfe8bf', 'fill-opacity': 0.55 },
    },
    {
      id: 'global-landcover-grass',
      type: 'fill',
      source: GLOBAL_BASE_SOURCE_ID,
      'source-layer': 'landcover',
      filter: ['==', ['get', 'class'], 'grass'],
      paint: { 'fill-antialias': false, 'fill-color': '#e2efd4', 'fill-opacity': 0.45 },
    },
    {
      id: 'global-landcover-sand',
      type: 'fill',
      source: GLOBAL_BASE_SOURCE_ID,
      'source-layer': 'landcover',
      filter: ['==', ['get', 'class'], 'sand'],
      paint: { 'fill-color': '#f5edc4' },
    },
    {
      id: 'global-water',
      type: 'fill',
      source: GLOBAL_BASE_SOURCE_ID,
      'source-layer': 'water',
      filter: NOT_TUNNEL_FILTER,
      paint: { 'fill-color': '#9ebdff' },
    },
    {
      id: 'global-waterway',
      type: 'line',
      source: GLOBAL_BASE_SOURCE_ID,
      'source-layer': 'waterway',
      filter: NOT_TUNNEL_FILTER,
      layout: { 'line-cap': 'round' },
      paint: { 'line-color': '#8bb8f2', 'line-width': ['interpolate', ['linear'], ['zoom'], 3, 0.5, 6, 1.2] },
    },
    {
      id: 'global-road-secondary',
      type: 'line',
      source: GLOBAL_BASE_SOURCE_ID,
      'source-layer': 'transportation',
      minzoom: 5,
      filter: ['match', ['get', 'class'], ['secondary', 'tertiary'], true, false],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#f3d98b', 'line-width': ['interpolate', ['linear'], ['zoom'], 5, 0.4, 7, 1] },
    },
    {
      id: 'global-road-primary',
      type: 'line',
      source: GLOBAL_BASE_SOURCE_ID,
      'source-layer': 'transportation',
      minzoom: 4,
      filter: ['match', ['get', 'class'], ['motorway', 'trunk', 'primary'], true, false],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#eab06e', 'line-width': ['interpolate', ['linear'], ['zoom'], 4, 0.5, 6, 1.2, 8, 2] },
    },
    {
      id: 'global-boundary-subnational',
      type: 'line',
      source: GLOBAL_BASE_SOURCE_ID,
      'source-layer': 'boundary',
      minzoom: 4,
      filter: [
        'all',
        ['==', ['typeof', ['get', 'admin_level']], 'number'],
        ['>=', ['get', 'admin_level'], 3],
        ['<=', ['get', 'admin_level'], 6],
        NOT_MARITIME_DISPUTED,
      ],
      paint: {
        'line-color': '#8e9299',
        'line-dasharray': [2, 2],
        'line-width': ['interpolate', ['linear'], ['zoom'], 4, 0.6, 7, 1.2],
      },
    },
    {
      id: 'global-boundary-country',
      type: 'line',
      source: GLOBAL_BASE_SOURCE_ID,
      'source-layer': 'boundary',
      filter: ['all', ['==', ['get', 'admin_level'], 2], NOT_MARITIME_DISPUTED],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#5c5a68',
        'line-opacity': ['interpolate', ['linear'], ['zoom'], 0, 0.5, 4, 1],
        'line-width': ['interpolate', ['linear'], ['zoom'], 2, 0.8, 6, 1.6],
      },
    },
    {
      id: 'global-boundary-disputed',
      type: 'line',
      source: GLOBAL_BASE_SOURCE_ID,
      'source-layer': 'boundary',
      filter: ['all', ['!=', ['get', 'maritime'], 1], ['==', ['get', 'disputed'], 1]],
      paint: { 'line-color': '#6b6875', 'line-dasharray': [2, 2], 'line-width': 1.2 },
    },
    {
      id: 'global-water-name',
      type: 'symbol',
      source: GLOBAL_BASE_SOURCE_ID,
      'source-layer': 'water_name',
      filter: ['match', ['geometry-type'], ['Point', 'MultiPoint'], true, false],
      layout: {
        'text-field': NAME_EXPRESSION,
        'text-font': ['Noto Sans Regular'],
        'text-max-width': 6,
        'text-size': ['interpolate', ['linear'], ['zoom'], 2, 10, 6, 13],
      },
      paint: { 'text-color': '#3f5b96', 'text-halo-color': 'rgba(255,255,255,0.85)', 'text-halo-width': 1.5 },
    },
    {
      id: 'global-place-town',
      type: 'symbol',
      source: GLOBAL_BASE_SOURCE_ID,
      'source-layer': 'place',
      minzoom: 5,
      filter: ['==', ['get', 'class'], 'town'],
      layout: {
        'text-field': NAME_EXPRESSION,
        'text-font': ['Noto Sans Regular'],
        'text-max-width': 8,
        'text-size': ['interpolate', ['linear'], ['zoom'], 5, 10, 7, 12],
      },
      paint: { 'text-color': '#1f2937', 'text-halo-color': '#ffffff', 'text-halo-width': 1.2 },
    },
    {
      id: 'global-place-state',
      type: 'symbol',
      source: GLOBAL_BASE_SOURCE_ID,
      'source-layer': 'place',
      minzoom: 5,
      maxzoom: 8,
      filter: ['==', ['get', 'class'], 'state'],
      layout: {
        'text-field': NAME_EXPRESSION,
        'text-font': ['Noto Sans Regular'],
        'text-letter-spacing': 0.15,
        'text-max-width': 9,
        'text-transform': 'uppercase',
        'text-size': ['interpolate', ['linear'], ['zoom'], 5, 10, 7, 12],
      },
      paint: { 'text-color': '#4b5563', 'text-halo-color': '#ffffff', 'text-halo-width': 1.2 },
    },
    {
      id: 'global-place-city',
      type: 'symbol',
      source: GLOBAL_BASE_SOURCE_ID,
      'source-layer': 'place',
      minzoom: 3,
      filter: ['==', ['get', 'class'], 'city'],
      layout: {
        'text-field': NAME_EXPRESSION,
        'text-font': ['Noto Sans Regular'],
        'text-max-width': 8,
        'text-size': ['interpolate', ['linear'], ['zoom'], 3, 10, 6, 13],
      },
      paint: { 'text-color': '#111827', 'text-halo-color': '#ffffff', 'text-halo-width': 1.4 },
    },
    {
      id: 'global-place-country',
      type: 'symbol',
      source: GLOBAL_BASE_SOURCE_ID,
      'source-layer': 'place',
      maxzoom: 8,
      filter: ['==', ['get', 'class'], 'country'],
      layout: {
        'text-field': NAME_EXPRESSION,
        'text-font': ['Noto Sans Regular'],
        'text-max-width': 7,
        'text-size': ['interpolate', ['linear'], ['zoom'], 1, 9, 4, 14, 7, 16],
      },
      paint: { 'text-color': '#111827', 'text-halo-color': '#ffffff', 'text-halo-width': 1.5 },
    },
  ];
}

export function buildCountryDetailLayers(): maplibregl.LayerSpecification[] {
  return [
    {
      id: 'country-landcover-wood',
      type: 'fill',
      source: COUNTRY_DETAIL_SOURCE_ID,
      'source-layer': 'landcover',
      minzoom: 7,
      filter: ['==', ['get', 'class'], 'wood'],
      paint: { 'fill-antialias': false, 'fill-color': '#cfe8bf', 'fill-opacity': 0.5 },
    },
    {
      id: 'country-landcover-grass',
      type: 'fill',
      source: COUNTRY_DETAIL_SOURCE_ID,
      'source-layer': 'landcover',
      minzoom: 7,
      filter: ['==', ['get', 'class'], 'grass'],
      paint: { 'fill-antialias': false, 'fill-color': '#e2efd4', 'fill-opacity': 0.4 },
    },
    {
      id: 'country-landcover-wetland',
      type: 'fill',
      source: COUNTRY_DETAIL_SOURCE_ID,
      'source-layer': 'landcover',
      minzoom: 7,
      filter: ['==', ['get', 'class'], 'wetland'],
      paint: { 'fill-antialias': false, 'fill-color': '#cfe5dc', 'fill-opacity': 0.6 },
    },
    {
      id: 'country-landcover-farmland',
      type: 'fill',
      source: COUNTRY_DETAIL_SOURCE_ID,
      'source-layer': 'landcover',
      minzoom: 7,
      filter: ['==', ['get', 'class'], 'farmland'],
      paint: { 'fill-antialias': false, 'fill-color': '#e7efd9', 'fill-opacity': 0.5 },
    },
    {
      id: 'country-landcover-rock',
      type: 'fill',
      source: COUNTRY_DETAIL_SOURCE_ID,
      'source-layer': 'landcover',
      minzoom: 7,
      filter: ['==', ['get', 'class'], 'rock'],
      paint: { 'fill-antialias': false, 'fill-color': '#e8e4dc', 'fill-opacity': 0.55 },
    },
    {
      id: 'country-landcover-sand',
      type: 'fill',
      source: COUNTRY_DETAIL_SOURCE_ID,
      'source-layer': 'landcover',
      minzoom: 7,
      filter: ['==', ['get', 'class'], 'sand'],
      paint: { 'fill-color': '#f5edc4' },
    },
    {
      id: 'country-park',
      type: 'fill',
      source: COUNTRY_DETAIL_SOURCE_ID,
      'source-layer': 'park',
      minzoom: 7,
      filter: ['match', ['geometry-type'], ['Polygon', 'MultiPolygon'], true, false],
      paint: { 'fill-antialias': false, 'fill-color': '#d5e8c8', 'fill-opacity': 0.45 },
    },
    {
      id: 'country-water',
      type: 'fill',
      source: COUNTRY_DETAIL_SOURCE_ID,
      'source-layer': 'water',
      minzoom: 7,
      filter: NOT_TUNNEL_FILTER,
      paint: { 'fill-color': '#9ebdff' },
    },
    {
      id: 'country-waterway-river',
      type: 'line',
      source: COUNTRY_DETAIL_SOURCE_ID,
      'source-layer': 'waterway',
      minzoom: 7,
      filter: ['all', ['==', ['get', 'class'], 'river'], NOT_TUNNEL_FILTER],
      layout: { 'line-cap': 'round' },
      paint: {
        'line-color': '#8bb8f2',
        'line-width': ['interpolate', ['exponential', 1.2], ['zoom'], 7, 0.8, 12, 2.2, 16, 4.5],
      },
    },
    {
      id: 'country-waterway-other',
      type: 'line',
      source: COUNTRY_DETAIL_SOURCE_ID,
      'source-layer': 'waterway',
      minzoom: 10,
      filter: ['all', ['!=', ['get', 'class'], 'river'], NOT_TUNNEL_FILTER],
      layout: { 'line-cap': 'round' },
      paint: {
        'line-color': '#a0c8f0',
        'line-width': ['interpolate', ['exponential', 1.2], ['zoom'], 10, 0.6, 15, 2.5],
      },
    },
    {
      id: 'country-road-minor-casing',
      type: 'line',
      source: COUNTRY_DETAIL_SOURCE_ID,
      'source-layer': 'transportation',
      minzoom: 10,
      filter: [
        'all',
        ['match', ['geometry-type'], ['LineString', 'MultiLineString'], true, false],
        ['match', ['get', 'class'], ['minor', 'unclassified'], true, false],
      ],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#d4d1cb',
        'line-width': ['interpolate', ['exponential', 1.2], ['zoom'], 10, 0.8, 13, 2.2, 16, 5],
      },
    },
    {
      id: 'country-road-minor',
      type: 'line',
      source: COUNTRY_DETAIL_SOURCE_ID,
      'source-layer': 'transportation',
      minzoom: 10,
      filter: [
        'all',
        ['match', ['geometry-type'], ['LineString', 'MultiLineString'], true, false],
        ['match', ['get', 'class'], ['minor', 'unclassified'], true, false],
      ],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#ffffff',
        'line-width': ['interpolate', ['exponential', 1.2], ['zoom'], 10, 0.4, 13, 1.4, 16, 3.6],
      },
    },
    {
      id: 'country-road-secondary-casing',
      type: 'line',
      source: COUNTRY_DETAIL_SOURCE_ID,
      'source-layer': 'transportation',
      minzoom: 7,
      filter: ['match', ['get', 'class'], ['secondary', 'tertiary'], true, false],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#e2b278',
        'line-width': ['interpolate', ['exponential', 1.2], ['zoom'], 7, 1.2, 11, 3, 16, 8],
      },
    },
    {
      id: 'country-road-secondary',
      type: 'line',
      source: COUNTRY_DETAIL_SOURCE_ID,
      'source-layer': 'transportation',
      minzoom: 7,
      filter: ['match', ['get', 'class'], ['secondary', 'tertiary'], true, false],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#fff3c4',
        'line-width': ['interpolate', ['exponential', 1.2], ['zoom'], 7, 0.6, 11, 1.8, 16, 6],
      },
    },
    {
      id: 'country-road-primary-casing',
      type: 'line',
      source: COUNTRY_DETAIL_SOURCE_ID,
      'source-layer': 'transportation',
      minzoom: 7,
      filter: ['match', ['get', 'class'], ['motorway', 'trunk', 'primary'], true, false],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#df9857',
        'line-width': ['interpolate', ['exponential', 1.2], ['zoom'], 7, 1.8, 11, 4.2, 16, 10],
      },
    },
    {
      id: 'country-road-primary',
      type: 'line',
      source: COUNTRY_DETAIL_SOURCE_ID,
      'source-layer': 'transportation',
      minzoom: 7,
      filter: ['match', ['get', 'class'], ['motorway', 'trunk', 'primary'], true, false],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#ffe19c',
        'line-width': ['interpolate', ['exponential', 1.2], ['zoom'], 7, 1, 11, 2.8, 16, 7.5],
      },
    },
    {
      id: 'country-road-rail',
      type: 'line',
      source: COUNTRY_DETAIL_SOURCE_ID,
      'source-layer': 'transportation',
      minzoom: 9,
      filter: ['==', ['get', 'class'], 'rail'],
      paint: { 'line-color': '#9ca3af', 'line-dasharray': [3, 3], 'line-width': 1.2 },
    },
    {
      id: 'country-boundary-province',
      type: 'line',
      source: COUNTRY_DETAIL_SOURCE_ID,
      'source-layer': 'boundary',
      minzoom: 7,
      filter: [
        'all',
        ['==', ['typeof', ['get', 'admin_level']], 'number'],
        ['>=', ['get', 'admin_level'], 3],
        ['<=', ['get', 'admin_level'], 4],
        NOT_MARITIME_DISPUTED,
      ],
      paint: {
        'line-color': '#757982',
        'line-dasharray': [4, 2],
        'line-width': ['interpolate', ['linear'], ['zoom'], 7, 1.2, 12, 2.2],
      },
    },
    {
      id: 'country-boundary-district',
      type: 'line',
      source: COUNTRY_DETAIL_SOURCE_ID,
      'source-layer': 'boundary',
      minzoom: 7,
      filter: [
        'all',
        ['==', ['typeof', ['get', 'admin_level']], 'number'],
        ['>=', ['get', 'admin_level'], 5],
        ['<=', ['get', 'admin_level'], 6],
        NOT_MARITIME_DISPUTED,
      ],
      paint: {
        'line-color': '#989ca3',
        'line-dasharray': [2, 2],
        'line-width': ['interpolate', ['linear'], ['zoom'], 7, 0.8, 12, 1.6],
      },
    },
    {
      id: 'country-boundary-country',
      type: 'line',
      source: COUNTRY_DETAIL_SOURCE_ID,
      'source-layer': 'boundary',
      minzoom: 7,
      filter: ['all', ['==', ['get', 'admin_level'], 2], NOT_MARITIME_DISPUTED],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#555362', 'line-width': ['interpolate', ['linear'], ['zoom'], 7, 1.8, 12, 3] },
    },
    {
      id: 'country-waterway-label',
      type: 'symbol',
      source: COUNTRY_DETAIL_SOURCE_ID,
      'source-layer': 'waterway',
      minzoom: 8,
      filter: ['match', ['geometry-type'], ['LineString', 'MultiLineString'], true, false],
      layout: {
        'symbol-placement': 'line',
        'symbol-spacing': 350,
        'text-field': NAME_EXPRESSION,
        'text-font': ['Noto Sans Regular'],
        'text-max-width': 6,
        'text-size': 12,
      },
      paint: { 'text-color': '#4c86c6', 'text-halo-color': 'rgba(255,255,255,0.85)', 'text-halo-width': 1.5 },
    },
    {
      id: 'country-water-name-point',
      type: 'symbol',
      source: COUNTRY_DETAIL_SOURCE_ID,
      'source-layer': 'water_name',
      minzoom: 7,
      filter: ['match', ['geometry-type'], ['Point', 'MultiPoint'], true, false],
      layout: {
        'text-field': NAME_EXPRESSION,
        'text-font': ['Noto Sans Regular'],
        'text-max-width': 6,
        'text-size': ['interpolate', ['linear'], ['zoom'], 7, 12, 12, 14],
      },
      paint: { 'text-color': '#3f5b96', 'text-halo-color': 'rgba(255,255,255,0.85)', 'text-halo-width': 1.5 },
    },
    {
      id: 'country-water-name-line',
      type: 'symbol',
      source: COUNTRY_DETAIL_SOURCE_ID,
      'source-layer': 'water_name',
      minzoom: 7,
      filter: ['match', ['geometry-type'], ['LineString', 'MultiLineString'], true, false],
      layout: {
        'symbol-placement': 'line',
        'symbol-spacing': 350,
        'text-field': NAME_EXPRESSION,
        'text-font': ['Noto Sans Regular'],
        'text-max-width': 6,
        'text-size': ['interpolate', ['linear'], ['zoom'], 7, 12, 12, 14],
      },
      paint: { 'text-color': '#3f5b96', 'text-halo-color': 'rgba(255,255,255,0.85)', 'text-halo-width': 1.5 },
    },
    {
      id: 'country-road-label',
      type: 'symbol',
      source: COUNTRY_DETAIL_SOURCE_ID,
      'source-layer': 'transportation_name',
      minzoom: 8,
      filter: ['match', ['geometry-type'], ['LineString', 'MultiLineString'], true, false],
      layout: {
        'symbol-placement': 'line',
        'symbol-spacing': 300,
        'text-field': ['coalesce', ['get', 'ref'], NAME_EXPRESSION],
        'text-font': ['Noto Sans Regular'],
        'text-rotation-alignment': 'map',
        'text-size': ['interpolate', ['linear'], ['zoom'], 8, 10, 14, 12],
      },
      paint: { 'text-color': '#4b5563', 'text-halo-color': '#ffffff', 'text-halo-width': 1.2 },
    },
    {
      id: 'country-place-other',
      type: 'symbol',
      source: COUNTRY_DETAIL_SOURCE_ID,
      'source-layer': 'place',
      minzoom: 9,
      filter: ['match', ['get', 'class'], ['city', 'continent', 'country', 'state', 'town', 'village'], false, true],
      layout: {
        'text-field': NAME_EXPRESSION,
        'text-font': ['Noto Sans Regular'],
        'text-max-width': 9,
        'text-size': ['interpolate', ['linear'], ['zoom'], 9, 10, 13, 12],
      },
      paint: { 'text-color': '#4b5563', 'text-halo-color': '#ffffff', 'text-halo-width': 1 },
    },
    {
      id: 'country-place-village',
      type: 'symbol',
      source: COUNTRY_DETAIL_SOURCE_ID,
      'source-layer': 'place',
      minzoom: 9,
      filter: ['==', ['get', 'class'], 'village'],
      layout: {
        'text-field': NAME_EXPRESSION,
        'text-font': ['Noto Sans Regular'],
        'text-max-width': 8,
        'text-size': ['interpolate', ['exponential', 1.2], ['zoom'], 9, 10, 13, 12],
      },
      paint: { 'text-color': '#1f2937', 'text-halo-color': '#ffffff', 'text-halo-width': 1.2 },
    },
    {
      id: 'country-place-town',
      type: 'symbol',
      source: COUNTRY_DETAIL_SOURCE_ID,
      'source-layer': 'place',
      minzoom: 7,
      filter: ['==', ['get', 'class'], 'town'],
      layout: {
        'text-field': NAME_EXPRESSION,
        'text-font': ['Noto Sans Regular'],
        'text-max-width': 8,
        'text-size': ['interpolate', ['exponential', 1.2], ['zoom'], 7, 11, 12, 14],
      },
      paint: { 'text-color': '#111827', 'text-halo-color': '#ffffff', 'text-halo-width': 1.3 },
    },
    {
      id: 'country-place-state',
      type: 'symbol',
      source: COUNTRY_DETAIL_SOURCE_ID,
      'source-layer': 'place',
      minzoom: 7,
      maxzoom: 10,
      filter: ['==', ['get', 'class'], 'state'],
      layout: {
        'text-field': NAME_EXPRESSION,
        'text-font': ['Noto Sans Regular'],
        'text-letter-spacing': 0.15,
        'text-max-width': 9,
        'text-transform': 'uppercase',
        'text-size': ['interpolate', ['linear'], ['zoom'], 7, 11, 10, 14],
      },
      paint: { 'text-color': '#374151', 'text-halo-color': '#ffffff', 'text-halo-width': 1.3 },
    },
    {
      id: 'country-place-city',
      type: 'symbol',
      source: COUNTRY_DETAIL_SOURCE_ID,
      'source-layer': 'place',
      minzoom: 7,
      filter: ['all', ['==', ['get', 'class'], 'city'], ['!=', ['get', 'capital'], 2]],
      layout: {
        'text-field': NAME_EXPRESSION,
        'text-font': ['Noto Sans Regular'],
        'text-max-width': 8,
        'text-size': ['interpolate', ['exponential', 1.2], ['zoom'], 7, 13, 12, 17],
      },
      paint: { 'text-color': '#111827', 'text-halo-color': '#ffffff', 'text-halo-width': 1.5 },
    },
    {
      id: 'country-place-capital',
      type: 'symbol',
      source: COUNTRY_DETAIL_SOURCE_ID,
      'source-layer': 'place',
      minzoom: 7,
      filter: ['all', ['==', ['get', 'class'], 'city'], ['==', ['get', 'capital'], 2]],
      layout: {
        'text-field': NAME_EXPRESSION,
        'text-font': ['Noto Sans Regular'],
        'text-max-width': 8,
        'text-size': ['interpolate', ['exponential', 1.2], ['zoom'], 7, 14, 12, 19],
      },
      paint: { 'text-color': '#111827', 'text-halo-color': '#ffffff', 'text-halo-width': 1.6 },
    },
    {
      id: 'country-place-country',
      type: 'symbol',
      source: COUNTRY_DETAIL_SOURCE_ID,
      'source-layer': 'place',
      minzoom: 7,
      maxzoom: 9,
      filter: ['==', ['get', 'class'], 'country'],
      layout: {
        'text-field': NAME_EXPRESSION,
        'text-font': ['Noto Sans Regular'],
        'text-max-width': 7,
        'text-size': ['interpolate', ['linear'], ['zoom'], 7, 15, 9, 17],
      },
      paint: { 'text-color': '#111827', 'text-halo-color': '#ffffff', 'text-halo-width': 1.6 },
    },
  ];
}

/**
 * Build the offline two-source MapLibre vector style specification:
 * - `global-base`: z0-3 world + z4-6 Southern Africa regional tiles
 * - `country-detail`: z7+ country-specific PMTiles archive (when supported)
 */
export function buildOfflineVectorStyle(countryCode?: string): maplibregl.StyleSpecification {
  const normalizedCode = normalizePmtilesCountryCode(countryCode);
  const sources: maplibregl.StyleSpecification['sources'] = {
    [GLOBAL_BASE_SOURCE_ID]: {
      type: 'vector',
      url: PMTILES_GLOBAL_URL,
      attribution: '© OpenStreetMap',
    },
  };

  const layers: maplibregl.LayerSpecification[] = [
    {
      id: 'offline-background',
      type: 'background',
      paint: { 'background-color': '#f8f4f0' },
    },
    ...buildGlobalLayers(),
  ];

  if (normalizedCode) {
    sources[COUNTRY_DETAIL_SOURCE_ID] = {
      type: 'vector',
      url: getCountryPmtilesUrl(normalizedCode),
    };
    layers.push(...buildCountryDetailLayers());
  }

  return {
    version: 8,
    name: 'picsa-offline',
    glyphs: PMTILES_GLYPHS_URL,
    sources,
    layers,
  };
}
