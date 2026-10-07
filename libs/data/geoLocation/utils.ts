import { IBoundaryData, IGeoJsonData, IGeolocationData, ITopoJson } from './types';

import * as topojson from 'topojson-client';

/** Hierarchy slots in top-down order. Names are relative positions, not OSM level numbers. */
export type GeoLocationSlot = 'admin_4' | 'admin_5' | 'admin_6';

const ALL_SLOTS: GeoLocationSlot[] = ['admin_4', 'admin_5', 'admin_6'];

/** Slots defined for a country, top-down (e.g. mw: [admin_4], zm: [admin_4, admin_5], zw: [admin_4, admin_6]) */
export function getLocationSlots(data: IGeolocationData): GeoLocationSlot[] {
  return ALL_SLOTS.filter((slot) => data[slot] !== undefined);
}

/** Locations at the deepest defined tier (e.g. districts) */
export function getDeepestLocations(data: IGeolocationData): { id: string; label: string }[] {
  const slots = getLocationSlots(data);
  return data[slots[slots.length - 1]]?.locations ?? [];
}

/** OSM-style level number of the deepest tier, for topojson geometry filtering */
export function getDeepestAdminLevel(data: IGeolocationData): 4 | 5 | 6 {
  const slot = getLocationSlots(data).pop() as GeoLocationSlot;
  return Number(slot.split('_')[1]) as 4 | 5 | 6;
}

/** Find a location by id, searching deepest tier first (district ids win over same-named provinces) */
export function findLocationById(data: IGeolocationData, id: string) {
  const slots = getLocationSlots(data);
  for (let i = slots.length - 1; i >= 0; i--) {
    const slot = slots[i];
    const location = data[slot]?.locations.find((v) => v.id === id);
    if (location) return { location, slot };
  }
  return undefined;
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
  for (const key of Object.keys(object).sort()) {
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
