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

export interface IDistrictCenterResult {
  center: { lat: number; lng: number };
  feature?: IProximityFeature;
}

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
 * Normalize location names for fuzzy comparison
 */
export function normalizeLocationName(name?: string | null): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/\b(district|province|city|met)\b/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

export interface IGeoBbox {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

/**
 * Compute the bounding box of a GeoJSON Feature (Polygon or MultiPolygon)
 */
export function computeFeatureBbox(feature?: IProximityFeature | null): IGeoBbox | undefined {
  if (!feature || !feature.geometry || !feature.geometry.coordinates) return undefined;

  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  const extractCoords = (coords: unknown) => {
    if (!Array.isArray(coords)) return;
    if (coords.length >= 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
      const [lng, lat] = coords as [number, number];
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    } else {
      for (const child of coords) {
        extractCoords(child);
      }
    }
  };

  extractCoords(feature.geometry.coordinates);

  if (minLng === Infinity || minLat === Infinity || minLng === -Infinity || minLat === -Infinity) {
    return undefined;
  }

  return { minLng, minLat, maxLng, maxLat };
}

/**
 * Compute bounding-box centroid of a GeoJSON Feature (Polygon or MultiPolygon)
 */
export function computeFeatureBboxCenter(feature?: IProximityFeature | null): { lat: number; lng: number } | undefined {
  const bbox = computeFeatureBbox(feature);
  if (!bbox) return undefined;
  return {
    lat: Math.round(((bbox.minLat + bbox.maxLat) / 2) * 100000) / 100000,
    lng: Math.round(((bbox.minLng + bbox.maxLng) / 2) * 100000) / 100000,
  };
}

/**
 * Compute a bounding box [[minLng, minLat], [maxLng, maxLat]] covering the district feature
 * (or fallback centroid) and a target station location.
 */
export function getCombinedDistrictAndStationBounds(
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

/**
 * Retrieve district reference coordinates and GeoJSON boundary.
 * 1. Checks precomputed `center: [lng, lat]` property in the TopoJSON feature.
 * 2. Falls back to calculating the centroid from the polygon bounding box.
 * 3. Falls back to precomputed district coordinates if available.
 */
export async function getDistrictCenterAndBoundary(
  countryCode: ICountryCode,
  districtId: string,
): Promise<IDistrictCenterResult | undefined> {
  const geoData = getGeoLocationData(countryCode);
  const deepest = getDeepestLocations(geoData);
  const district = deepest.find((d) => d.id === districtId);
  if (!district) return undefined;

  try {
    const adminLevel = getDeepestAdminLevel(geoData);
    const cacheKey = `${countryCode}:${adminLevel}`;
    let geojson = geoJsonCache.get(cacheKey);
    if (!geojson) {
      const topojson = await geoData.topoJson();
      geojson = topoJsonToGeoJson(topojson, adminLevel);
      geoJsonCache.set(cacheKey, geojson);
    }

    const candidates = [district.label, (district as { topoName?: string }).topoName, district.id].filter(
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
    console.warn(`[LocationProximity] Could not compute district center from TopoJSON for ${districtId}:`, err);
  }

  // 3. Fallback: Check if district item itself has precomputed coordinates
  const districtCoords = (district as { coordinates?: { latitude: number; longitude: number } }).coordinates;
  if (districtCoords?.latitude && districtCoords?.longitude) {
    return {
      center: {
        lat: districtCoords.latitude,
        lng: districtCoords.longitude,
      },
    };
  }

  return undefined;
}

/**
 * Check whether a station is mapped to a specific district
 */
export function isStationInDistrict(station: IStationMeta, districtLabel?: string, districtId?: string): boolean {
  if (!districtLabel || !station.location || station.location.length === 0) return false;
  const normDistrictLabel = normalizeLocationName(districtLabel);
  const normDistrictId = districtId ? normalizeLocationName(districtId) : '';
  return station.location.some((loc) => {
    const norm = normalizeLocationName(loc);
    return norm === normDistrictLabel || (normDistrictId !== '' && norm === normDistrictId);
  });
}

/**
 * Rank stations for a district based on proximity and data viability
 */
export function getStationRecommendations(
  stations: IStationMeta[],
  districtCoords: { lat: number; lng: number },
  districtLabel: string,
  districtId: string,
): IStationRecommendation[] {
  const scored = stations
    .filter((s) => s.latitude !== null && s.longitude !== null && !s.draft)
    .map((station) => {
      const isInsideDistrict = isStationInDistrict(station, districtLabel, districtId);

      const distanceKm = calculateHaversineDistanceKm(
        districtCoords.lat,
        districtCoords.lng,
        station.latitude,
        station.longitude,
      );

      // Lightweight scoring:
      // - Inside district gives a strong 50km advantage
      // - Stations with >30 complete rain years get a slight 10km advantage over sparse stations
      const completeYears = station.capabilities?.completeRainYears ?? station.capabilities?.totalYears ?? 0;
      const dataBonus = completeYears >= 30 ? -10 : 0;
      const districtBonus = isInsideDistrict ? -50 : 0;

      const score = distanceKm + districtBonus + dataBonus;

      return {
        station,
        distanceKm,
        isInsideDistrict,
        isRecommended: false,
        score,
      };
    });

  // Sort by score ascending (lower score is better)
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
