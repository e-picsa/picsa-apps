import type { ICountryCode } from '@picsa/data';
import type { IGeoJsonData } from '@picsa/data/geoLocation';
import {
  getDeepestAdminLevel,
  getDeepestLocations,
  getGeoLocationData,
  topoJsonToGeoJson,
} from '@picsa/data/geoLocation';
import type { IStationMeta } from '@picsa/models';

export interface IStationRecommendation {
  station: IStationMeta;
  distanceKm: number;
  /** Whether station matches the selected administrative location */
  isInsideLocation: boolean;
  /** Backwards-compatible alias for isInsideLocation */
  isInsideDistrict: boolean;
  isRecommended: boolean;
  score: number;
}

export interface IProximityFeature {
  type: string;
  properties?: {
    id?: number | string;
    name?: string;
    center?: [number, number];
    center_source?: 'admin_centre' | 'label' | 'centroid' | 'point_on_surface' | string;
    [key: string]: unknown;
  };
  geometry?: {
    type: string;
    coordinates: unknown;
  };
}

export interface ILocationCenterResult {
  center: { lat: number; lng: number };
  feature?: IProximityFeature;
}

/** Backwards-compatible alias */
export type IDistrictCenterResult = ILocationCenterResult;

/** In-memory cache for parsed GeoJSON by country code and admin level to prevent CPU lockup on rapid navigation */
const geoJsonCache = new Map<string, IGeoJsonData>();

export function clearGeoJsonCache() {
  geoJsonCache.clear();
}

/**
 * Calculate Great-Circle distance between two coordinates in kilometers using Haversine formula
 */
export function calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Normalize location names for comparison by stripping common administrative suffixes and punctuation
 */
export function normalizeLocationName(name?: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/\b(district|province|city|met)\b/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Compute the bounding box [minLng, minLat, maxLng, maxLat] of a GeoJSON Feature
 */
export function computeFeatureBbox(
  feature: IProximityFeature | undefined,
): { minLng: number; minLat: number; maxLng: number; maxLat: number } | undefined {
  if (!feature || !feature.geometry) return undefined;
  const geom = feature.geometry;
  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  function traverse(coords: unknown) {
    if (!Array.isArray(coords)) return;
    if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
      const [lng, lat] = coords as [number, number];
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    } else {
      for (const item of coords) {
        traverse(item);
      }
    }
  }

  traverse(geom.coordinates);

  if (minLng === Infinity || minLat === Infinity) {
    return undefined;
  }

  return { minLng, minLat, maxLng, maxLat };
}

/**
 * Compute center { lat, lng } from a feature bounding box
 */
export function computeFeatureBboxCenter(feature: IProximityFeature): { lat: number; lng: number } | undefined {
  const bbox = computeFeatureBbox(feature);
  if (!bbox) return undefined;
  return {
    lat: (bbox.minLat + bbox.maxLat) / 2,
    lng: (bbox.minLng + bbox.maxLng) / 2,
  };
}

/**
 * Compute a bounding box [[minLng, minLat], [maxLng, maxLat]] covering the location feature
 * (or fallback centroid) and a target station location.
 */
export function getCombinedLocationAndStationBounds(
  feature: IProximityFeature | undefined,
  station?: { latitude: number; longitude: number } | null,
  fallbackCenter?: { lat: number; lng: number } | null,
): [[number, number], [number, number]] | undefined {
  const bbox = computeFeatureBbox(feature);
  let minLng = bbox ? bbox.minLng : (fallbackCenter?.lng ?? Infinity);
  let maxLng = bbox ? bbox.maxLng : (fallbackCenter?.lng ?? -Infinity);
  let minLat = bbox ? bbox.minLat : (fallbackCenter?.lat ?? Infinity);
  let maxLat = bbox ? bbox.maxLat : (fallbackCenter?.lat ?? -Infinity);

  if (station && typeof station.longitude === 'number' && typeof station.latitude === 'number') {
    if (station.longitude < minLng) minLng = station.longitude;
    if (station.longitude > maxLng) maxLng = station.longitude;
    if (station.latitude < minLat) minLat = station.latitude;
    if (station.latitude > maxLat) maxLat = station.latitude;
  }

  if (minLng === Infinity || minLat === Infinity || minLng === -Infinity || minLat === -Infinity) {
    return undefined;
  }

  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}

export const getCombinedDistrictAndStationBounds = getCombinedLocationAndStationBounds;

/**
 * Retrieve reference coordinates and GeoJSON boundary for a location at the country's deepest tier.
 * 1. Checks precomputed `center: [lng, lat]` property in the TopoJSON feature.
 * 2. Falls back to calculating the centroid from the polygon bounding box.
 * 3. Falls back to precomputed location coordinates if available.
 */
export async function getLocationCenterAndBoundary(
  countryCode: ICountryCode,
  locationId: string,
): Promise<ILocationCenterResult | undefined> {
  const geoData = getGeoLocationData(countryCode);
  const deepest = getDeepestLocations(geoData);
  const locationItem = deepest.find((d) => d.id === locationId);
  if (!locationItem) return undefined;

  try {
    const adminLevel = getDeepestAdminLevel(geoData);
    const cacheKey = `${countryCode}:${adminLevel}`;
    let geojson = geoJsonCache.get(cacheKey);
    if (!geojson) {
      const topojson = await geoData.topoJson();
      geojson = topoJsonToGeoJson(topojson, adminLevel);
      geoJsonCache.set(cacheKey, geojson);
    }

    const candidates = [locationItem.label, locationItem.topoName, locationItem.id].filter(
      (v): v is string => typeof v === 'string' && Boolean(v),
    );

    const feature = geojson.features.find((f: { properties?: { name?: string } }) => {
      const featName = f.properties?.name;
      return candidates.some((candidate) => normalizeLocationName(featName) === normalizeLocationName(candidate));
    }) as IProximityFeature | undefined;

    if (feature) {
      // 1. Direct precomputed center from TopoJSON properties: [lng, lat]
      const centerCoords = feature.properties?.center;
      if (Array.isArray(centerCoords) && centerCoords.length >= 2) {
        const [lng, lat] = centerCoords;
        if (typeof lat === 'number' && typeof lng === 'number' && !Number.isNaN(lat) && !Number.isNaN(lng)) {
          return {
            center: { lat, lng },
            feature,
          };
        }
      }

      // 2. Fallback: compute bounding box center from geometry
      const bboxCenter = computeFeatureBboxCenter(feature);
      if (bboxCenter) {
        return { center: bboxCenter, feature };
      }
    }
  } catch (err) {
    console.warn(`[LocationProximity] Could not compute location center from TopoJSON for ${locationId}:`, err);
  }

  // 3. Fallback: Check if location item itself has precomputed coordinates
  const locationCoords = (locationItem as { coordinates?: { latitude: number; longitude: number } }).coordinates;
  if (locationCoords?.latitude && locationCoords?.longitude) {
    return {
      center: {
        lat: locationCoords.latitude,
        lng: locationCoords.longitude,
      },
    };
  }

  return undefined;
}

export const getDistrictCenterAndBoundary = getLocationCenterAndBoundary;

/**
 * Check whether a station is mapped to a specific administrative location (by label or id)
 */
export function isStationInLocation(station: IStationMeta, locationLabel?: string, locationId?: string): boolean {
  if (!locationLabel || !station.location || station.location.length === 0) return false;
  const normLocationLabel = normalizeLocationName(locationLabel);
  const normLocationId = locationId ? normalizeLocationName(locationId) : '';
  return station.location.some((loc) => {
    const norm = normalizeLocationName(loc);
    return norm === normLocationLabel || (normLocationId !== '' && norm === normLocationId);
  });
}

export const isStationInDistrict = isStationInLocation;

/**
 * Rank stations for an administrative location based on proximity and data viability
 */
export function getStationRecommendations(
  stations: IStationMeta[],
  locationCoords: { lat: number; lng: number },
  locationLabel: string,
  locationId: string,
): IStationRecommendation[] {
  const scored = stations
    .filter((s) => s.latitude !== null && s.longitude !== null && !s.draft)
    .map((station) => {
      const isInsideLocation = isStationInLocation(station, locationLabel, locationId);

      const distanceKm = calculateHaversineDistanceKm(
        locationCoords.lat,
        locationCoords.lng,
        station.latitude,
        station.longitude,
      );

      // Lightweight scoring:
      // - Inside location gives a strong 50km advantage
      // - Stations with >30 complete rain years get a slight 10km advantage over sparse stations
      const completeYears = station.capabilities?.completeRainYears ?? station.capabilities?.totalYears ?? 0;
      const dataBonus = completeYears >= 30 ? -10 : 0;
      const locationBonus = isInsideLocation ? -50 : 0;

      const score = distanceKm + locationBonus + dataBonus;

      return {
        station,
        distanceKm,
        isInsideLocation,
        isInsideDistrict: isInsideLocation,
        isRecommended: false,
        score,
      };
    });

  // Sort by score ascending (lowest score is highest priority)
  scored.sort((a, b) => a.score - b.score);

  if (scored.length > 0) {
    scored[0].isRecommended = true;
  }

  return scored;
}

/**
 * Format raw station names (or IDs) to a human-readable display label,
 * replacing underscores and technical suffixes (e.g. `_agr`, `_agric`, `_airport`).
 */
export function formatStationLabel(name?: string): string {
  if (!name) return '';
  return name
    .replace(/_agr\b/gi, ' Agriculture')
    .replace(/_agric\b/gi, ' Agriculture')
    .replace(/_airport\b/gi, ' Airport')
    .replace(/_/g, ' ')
    .trim();
}
