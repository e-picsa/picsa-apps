import * as topojson from 'topojson-client';

import type { ICountryCode } from '../deployments';
import { getGeoLocationData } from './data';
import {
  IBoundaryData,
  IDeepestLocation,
  IGeoJsonData,
  IGeoJsonFeature,
  IGeoLayer,
  IGeoLocationItem,
  ITopoJson,
  ITopoJsonFeatureProperties,
} from './types';

const geoJsonFeatureCache = new Map<string, IGeoJsonData<ITopoJsonFeatureProperties>>();
const downscaledByLayersCache = new WeakMap<IGeoLayer[], Map<string, IDeepestLocation>>();

/** Clear cached parsed TopoJSON features (useful in tests or after mock overrides) */
export function clearGeoJsonFeatureCache() {
  geoJsonFeatureCache.clear();
}

function buildDownscaledLocations(layers: IGeoLayer[]): IDeepestLocation[] {
  const deepestLayer = layers[layers.length - 1];
  if (!deepestLayer) return [];
  const hasParent = layers.length > 1;
  const parentLayer = hasParent ? layers[layers.length - 2] : undefined;
  const parentLabels: Record<string, string> = {};
  if (parentLayer) {
    for (const parent of parentLayer.locations) {
      parentLabels[parent.id] = parent.label;
    }
  }
  return deepestLayer.locations.map((loc) => {
    const parentId = hasParent ? (loc.parentId ?? '') : '';
    return {
      id: loc.id,
      label: loc.label,
      parentId,
      parentLabel: parentId ? (parentLabels[parentId] ?? '') : '',
      ...(loc.topoName !== undefined ? { topoName: loc.topoName } : {}),
      ...(loc.coordinates !== undefined ? { coordinates: loc.coordinates } : {}),
    };
  });
}

/** Locations at the deepest defined layer for a country, with parent tier references resolved */
export function getDownscaledLocations(country_code: ICountryCode): IDeepestLocation[] {
  const { layers } = getGeoLocationData(country_code);
  return buildDownscaledLocations(layers);
}

/**
 * Look up a downscaled (deepest-layer) location by id for a country.
 * Falls back to a humanised label with empty parent metadata if not present in static geo data.
 */
export function getDownscaledLocation(country_code: ICountryCode, location_id: string): IDeepestLocation {
  const { layers } = getGeoLocationData(country_code);
  let byId = downscaledByLayersCache.get(layers);
  if (!byId) {
    byId = new Map(buildDownscaledLocations(layers).map((loc) => [loc.id, loc]));
    downscaledByLayersCache.set(layers, byId);
  }
  const match = byId.get(location_id);
  if (match) return match;
  return {
    id: location_id,
    label: formatLocationIdAsLabel(location_id),
    parentId: '',
    parentLabel: '',
  };
}

/**
 * Check all required hierarchy segments are selected for the country's layer structure.
 * Assumes 1 or 2 layers stored at tuple indexes 4 and 5 (MW EPAs remain 2-layer);
 * extending to 3+ layers in the future will require checking additional tuple indexes.
 */
export function isLocationComplete(country_code: ICountryCode, location: (string | undefined)[] | undefined): boolean {
  if (!location) return false;
  const { layers } = getGeoLocationData(country_code);
  if (layers.length > 1) {
    return Boolean(location[4] && location[5]);
  }
  return Boolean(location[4]);
}

/**
 * Display label for a stored location array, resolving the deepest selected layer first.
 * Assumes 1 or 2 layers stored at indexes 4 and 5; extend if 3+ layers are introduced later.
 */
export function getLocationLabel(
  country_code: ICountryCode,
  location: (string | undefined)[] | undefined,
): string | undefined {
  if (!location) return undefined;
  const { layers } = getGeoLocationData(country_code);
  const topId = location[4];
  const childId = location[5];
  if (layers.length > 1 && childId) {
    const deepestLayer = layers[layers.length - 1];
    const match = deepestLayer?.locations.find((l) => l.id === childId);
    if (match) return match.label;
  }
  if (topId) {
    return layers[0]?.locations.find((l) => l.id === topId)?.label;
  }
  return undefined;
}

/** Normalize location names for comparison by stripping administrative suffixes and punctuation */
export function normalizeLocationName(name?: string | null): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/\b(district|province|city|met)\b/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Retrieve the matching GeoJSON feature from a country's TopoJSON for a location.
 * Defaults to the deepest ('downscaled') layer; pass 'parent' for the top layer (e.g. province).
 * If the target layer has no boundary geometries (`topoAdminLevel === undefined`), automatically
 * falls back up the parent chain using `parentId`.
 */
export async function getLocationTopoFeature(
  country_code: ICountryCode,
  location_id: string,
  role: 'downscaled' | 'parent' = 'downscaled',
): Promise<IGeoJsonFeature<ITopoJsonFeatureProperties> | undefined> {
  const geoData = getGeoLocationData(country_code);
  const { layers } = geoData;
  if (layers.length === 0) return undefined;

  let layerIndex = role === 'parent' ? 0 : layers.length - 1;
  const initialItem = layers[layerIndex]?.locations.find((l) => l.id === location_id);
  if (!initialItem) return undefined;
  let item: IGeoLocationItem = initialItem;

  while (layerIndex > 0 && layers[layerIndex].topoAdminLevel === undefined) {
    const parentId = item.parentId;
    if (!parentId) return undefined;
    layerIndex--;
    const parentItem = layers[layerIndex]?.locations.find((l) => l.id === parentId);
    if (!parentItem) return undefined;
    item = parentItem;
  }

  const adminLevel = layers[layerIndex].topoAdminLevel;
  if (adminLevel === undefined) return undefined;

  const cacheKey = `${country_code}:${adminLevel}`;
  let geojson = geoJsonFeatureCache.get(cacheKey);
  if (!geojson) {
    const topo = await geoData.topoJson();
    geojson = topoJsonToGeoJson<ITopoJsonFeatureProperties>(topo, adminLevel);
    geoJsonFeatureCache.set(cacheKey, geojson);
  }

  const candidates = [item.label, item.topoName, item.id].filter(
    (v): v is string => typeof v === 'string' && Boolean(v),
  );
  return geojson.features.find((f) => {
    const featName = f.properties?.name;
    return candidates.some((candidate) => normalizeLocationName(featName) === normalizeLocationName(candidate));
  });
}

/** Convert a raw location id (e.g. `mt_darwin`) to a display label (`Mt Darwin`) */
export function formatLocationIdAsLabel(location_id: string) {
  return location_id
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function topoJsonToGeoJson<T = any>(t: ITopoJson, adminLevel?: string | number): IGeoJsonData<T> {
  // convert the first named object in the topology
  const [objectName] = Object.keys(t.objects);
  const topologyObject = t.objects[objectName];

  if (adminLevel && topologyObject.type === 'GeometryCollection') {
    const levelStr = String(adminLevel);
    // filter geometries at the TopoJSON level before converting to GeoJSON
    const filteredGeometries = topologyObject.geometries.filter(
      (g) => g.properties && String(g.properties.admin_level) === levelStr,
    );
    const filteredObject = { ...topologyObject, geometries: filteredGeometries };
    return topojson.feature(t, filteredObject as any) as unknown as IGeoJsonData<T>;
  }

  return topojson.feature(t, topologyObject as any) as unknown as IGeoJsonData<T>;
}

/**
 * Take input geoJson feature collection data and extract coordinates into a a more simple
 * coordinate lookup table
 * @param propertyKeyField name of field within feature properties to use to index output
 * @param precision number or decimal places used to round coordinate values and omit duplicates
 *
 * NOTE - For more complex geometries it is likely better to use TopoJson instead, particularly
 * in cases such as shared borders
 **/
export function geoJsonToBoundaries<T>(data: IGeoJsonData<T>, propertyKeyField: keyof T, precision = 2) {
  const boundaries: IBoundaryData = {};

  for (const feature of data.features) {
    const key = feature.properties[propertyKeyField] as string;
    if (!key) {
      const allKeys = Object.keys(feature.properties as any).join(',');
      const errMsg = `[${propertyKeyField as any}] not found\nAvailable keys: [${allKeys}]`;
      throw new Error(errMsg);
    }
    if (boundaries[key]) {
      throw new Error(`duplicate key found for: ${key}`);
    }

    const coordinates: [number, number][] = [];
    let x1 = -1;
    let y1 = -1;
    const allCoordinates = flattenCoordinates(feature.geometry.coordinates);
    for (const [x, y] of allCoordinates) {
      // round x and y values to number of decimal places provided by precision
      const sf = 10 ** precision;
      const xRounded = Math.round(x * sf) / sf;
      const yRounded = Math.round(y * sf) / sf;
      // include coordinates only if different from previous (after rounding)
      if (x1 !== xRounded && y1 !== yRounded) {
        coordinates.push([xRounded, yRounded]);
        x1 = xRounded;
        y1 = yRounded;
      }
    }

    boundaries[key as any] = coordinates;
  }
  return sortObjectByKey(boundaries);
}

/** Take summary boundary data and convert back to GeoJson */
export function boundariesToGeoJson(data: IBoundaryData, propertyKeyField: string) {
  const geoJson: IGeoJsonData = {
    type: 'FeatureCollection',
    crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } },
    features: [],
  };
  for (const [key, coordinates] of Object.entries(data)) {
    geoJson.features.push({
      type: 'Feature',
      properties: { [propertyKeyField]: key },
      geometry: { type: 'MultiPolygon', coordinates: [[coordinates as any]] },
    });
  }
  return geoJson;
}

function sortObjectByKey(object: Record<string, any>) {
  const sorted: Record<string, any> = {};
  for (const key of Object.keys(object).sort((a, b) => a.localeCompare(b))) {
    sorted[key] = object[key];
  }
  return sorted;
}

/**
 * Geojson includes coordinates that can be nested various levels deep,
 * e.g. [[x1,y1],[x2,y2]], [[[x1,y1],[x2,y2]],[[x3,x4]]], etc.
 * Take any arbitrary level of nesting and extract to single coordinate array
 */
function flattenCoordinates(data: any[] = []): number[][] {
  if (Array.isArray(data)) {
    const [el] = data;
    if (Array.isArray(el)) {
      const [inner] = el;
      if (Array.isArray(inner)) {
        const flattened = [].concat(...(data as any));
        return flattenCoordinates(flattened);
      }
    }
  }
  return data;
}
