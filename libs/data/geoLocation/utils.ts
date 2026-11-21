import * as topojson from 'topojson-client';

import type { ICountryCode } from '../deployments';
import { getGeoLocationData } from './data';
import {
  GeoToolKey,
  IBoundaryData,
  IGeoJsonData,
  IGeoJsonFeature,
  IGeoLayer,
  IGeoLocationItem,
  IGeoLocationNode,
  ILocationSelection,
  IResolvedToolLocations,
  ITopoJson,
  ITopoJsonFeatureProperties,
} from './types';

const geoJsonFeatureCache = new Map<string, IGeoJsonData<ITopoJsonFeatureProperties>>();

/** Clear cached parsed TopoJSON features (useful in tests or after mock overrides) */
export function clearGeoJsonFeatureCache() {
  geoJsonFeatureCache.clear();
}

function getParentLayer(layers: IGeoLayer[], index: number): IGeoLayer | undefined {
  if (index <= 0) return undefined;
  const parentKey = layers[index].parentLayer;
  return parentKey ? layers.find((l) => l.key === parentKey) : layers[index - 1];
}

function buildLayerNodes(layers: IGeoLayer[], index: number): IGeoLocationNode[] {
  const layer = layers[index];
  if (!layer) return [];
  const parentLayer = getParentLayer(layers, index);
  const parentLabels = new Map(parentLayer?.locations.map((p) => [p.id, p.label]) ?? []);
  return layer.locations.map((loc) => {
    const parentId = parentLayer ? (loc.parentId ?? '') : '';
    return {
      id: loc.id,
      label: loc.label,
      layerKey: layer.key,
      parentId,
      parentLabel: parentId ? (parentLabels.get(parentId) ?? '') : '',
      ...(loc.topoName !== undefined ? { topoName: loc.topoName } : {}),
      ...(loc.coordinates !== undefined ? { coordinates: loc.coordinates } : {}),
    };
  });
}

function validateSelectionChain(layers: IGeoLayer[], selection?: ILocationSelection): IGeoLocationNode[] {
  if (!selection) return [];
  const chain: IGeoLocationNode[] = [];
  for (let i = 0; i < layers.length; i++) {
    const id = selection[layers[i].key];
    if (!id) break;
    const node = buildLayerNodes(layers, i).find((n) => n.id === id);
    if (!node) break;
    if (i > 0) {
      const parentLayer = getParentLayer(layers, i);
      const selectedParent = parentLayer ? chain.find((n) => n.layerKey === parentLayer.key) : undefined;
      if (selectedParent && node.parentId !== selectedParent.id) break;
    }
    chain.push(node);
  }
  return chain;
}

/** Return ordered layers visible for a tool (capped at `toolLayers[tool]`, or all layers when omitted) */
export function getToolLayers(country_code: ICountryCode, tool?: GeoToolKey): IGeoLayer[] {
  const { layers, toolLayers } = getGeoLocationData(country_code);
  if (!tool) return layers;
  const targetKey = toolLayers?.[tool];
  if (!targetKey) return layers;
  const idx = layers.findIndex((l) => l.key === targetKey);
  return idx >= 0 ? layers.slice(0, idx + 1) : layers;
}

/** Return all normalized locations at the target layer configured for a tool */
export function getLocationsForTool(country_code: ICountryCode, tool: GeoToolKey): IGeoLocationNode[] {
  const layers = getToolLayers(country_code, tool);
  return buildLayerNodes(layers, layers.length - 1);
}

/** Strict lookup for a location at a tool's target layer (returns undefined when absent) */
export function findLocationForTool(
  country_code: ICountryCode,
  tool: GeoToolKey,
  location_id: string,
): IGeoLocationNode | undefined {
  if (!location_id) return undefined;
  return getLocationsForTool(country_code, tool).find((loc) => loc.id === location_id);
}

/**
 * Deterministically resolve a user's location selection to the target layer for a tool.
 * - Exact match at the tool's layer -> `[node]`
 * - Selection deeper than the tool's layer (e.g. EPA -> district forecast) -> walks up `parentId` to `[ancestor]`
 * - Selection coarser than the tool's layer (e.g. province -> districts) -> returns matching child nodes
 * - Unselected or invalid selection -> `[]`
 */
export function resolveLocationForTool(
  country_code: ICountryCode,
  selection: ILocationSelection | undefined,
  tool: GeoToolKey,
): IResolvedToolLocations {
  const { layers } = getGeoLocationData(country_code);
  const toolLayers = getToolLayers(country_code, tool);
  const targetIndex = toolLayers.length - 1;
  const targetLayerKey = toolLayers[targetIndex]?.key ?? '';
  if (targetIndex < 0) return { layerKey: targetLayerKey, locations: [] };

  const chain = validateSelectionChain(layers, selection);
  if (chain.length === 0) return { layerKey: targetLayerKey, locations: [] };

  const exact = chain.find((n) => n.layerKey === targetLayerKey);
  if (exact) return { layerKey: targetLayerKey, locations: [exact] };

  let current = chain[chain.length - 1];
  let currentIndex = layers.findIndex((l) => l.key === current.layerKey);

  // Deeper selection: walk up parentId until reaching targetIndex
  if (currentIndex > targetIndex) {
    while (currentIndex > targetIndex) {
      const parentLayer = getParentLayer(layers, currentIndex);
      if (!parentLayer || !current.parentId) return { layerKey: targetLayerKey, locations: [] };
      currentIndex = layers.findIndex((l) => l.key === parentLayer.key);
      const parent = buildLayerNodes(layers, currentIndex).find((n) => n.id === current.parentId);
      if (!parent) return { layerKey: targetLayerKey, locations: [] };
      current = parent;
    }
    return { layerKey: targetLayerKey, locations: [current] };
  }

  // Coarser selection: walk down parentId collecting matching descendants at targetIndex
  let parentIds = new Set([current.id]);
  let nodes: IGeoLocationNode[] = [];
  for (let i = currentIndex + 1; i <= targetIndex; i++) {
    nodes = buildLayerNodes(layers, i).filter((n) => parentIds.has(n.parentId));
    parentIds = new Set(nodes.map((n) => n.id));
  }
  return { layerKey: targetLayerKey, locations: nodes };
}

/** Check every required layer (up to `tool`'s target layer, or deepest when omitted) has a valid selection */
export function isSelectionComplete(
  country_code: ICountryCode,
  selection: ILocationSelection | undefined,
  tool?: GeoToolKey,
): boolean {
  const toolLayers = getToolLayers(country_code, tool);
  if (toolLayers.length === 0) return false;
  const chain = validateSelectionChain(toolLayers, selection);
  return chain.length === toolLayers.length;
}

/** Display label for the deepest valid selected tier in a location selection */
export function getSelectionLabel(
  country_code: ICountryCode,
  selection: ILocationSelection | undefined,
): string | undefined {
  const { layers } = getGeoLocationData(country_code);
  const chain = validateSelectionChain(layers, selection);
  return chain[chain.length - 1]?.label;
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
 * Defaults to the deepest layer; pass 'parent' for the top layer or an explicit `layerKey`.
 * Layers without boundary geometries (`topoAdminLevel === undefined`) walk up `parentId`.
 */
export async function getLocationTopoFeature(
  country_code: ICountryCode,
  location_id: string,
  roleOrLayerKey: 'downscaled' | 'parent' | string = 'downscaled',
): Promise<IGeoJsonFeature<ITopoJsonFeatureProperties> | undefined> {
  const geoData = getGeoLocationData(country_code);
  const { layers } = geoData;
  if (layers.length === 0) return undefined;

  let layerIndex =
    roleOrLayerKey === 'parent'
      ? 0
      : roleOrLayerKey === 'downscaled'
        ? layers.length - 1
        : layers.findIndex((l) => l.key === roleOrLayerKey);
  if (layerIndex < 0) return undefined;

  const initialItem = layers[layerIndex]?.locations.find((l) => l.id === location_id);
  if (!initialItem) return undefined;
  let item: IGeoLocationItem = initialItem;

  while (layerIndex > 0 && layers[layerIndex].topoAdminLevel === undefined) {
    const parentLayer = getParentLayer(layers, layerIndex);
    if (!item.parentId || !parentLayer) return undefined;
    layerIndex = layers.findIndex((l) => l.key === parentLayer.key);
    const parentItem = layers[layerIndex]?.locations.find((l) => l.id === item.parentId);
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
  const [objectName] = Object.keys(t.objects);
  const topologyObject = t.objects[objectName];

  if (adminLevel && topologyObject.type === 'GeometryCollection') {
    const levelStr = String(adminLevel);
    const filteredGeometries = topologyObject.geometries.filter(
      (g) => g.properties && String(g.properties.admin_level) === levelStr,
    );
    const filteredObject = { ...topologyObject, geometries: filteredGeometries };
    return topojson.feature(t, filteredObject as any) as unknown as IGeoJsonData<T>;
  }

  return topojson.feature(t, topologyObject as any) as unknown as IGeoJsonData<T>;
}

/**
 * Take input geoJson feature collection data and extract coordinates into a simple
 * coordinate lookup table.
 */
export function geoJsonToBoundaries<T>(data: IGeoJsonData<T>, propertyKeyField: keyof T, precision = 2) {
  const boundaries: IBoundaryData = {};

  for (const feature of data.features) {
    const key = feature.properties[propertyKeyField] as string;
    if (!key) {
      const allKeys = Object.keys(feature.properties as any).join(',');
      throw new Error(`[${propertyKeyField as any}] not found\nAvailable keys: [${allKeys}]`);
    }
    if (boundaries[key]) {
      throw new Error(`duplicate key found for: ${key}`);
    }

    const coordinates: [number, number][] = [];
    let x1 = -1;
    let y1 = -1;
    const allCoordinates = flattenCoordinates(feature.geometry.coordinates);
    for (const [x, y] of allCoordinates) {
      const sf = 10 ** precision;
      const xRounded = Math.round(x * sf) / sf;
      const yRounded = Math.round(y * sf) / sf;
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
