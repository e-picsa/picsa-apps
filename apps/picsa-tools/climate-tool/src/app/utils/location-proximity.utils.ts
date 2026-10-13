import { ICountryCode } from '@picsa/data';
import {
  getDeepestAdminLevel,
  getDeepestLocations,
  getGeoLocationData,
  IGeoJsonData,
  topoJsonToGeoJson,
} from '@picsa/data/geoLocation';
import { IStationMeta } from '@picsa/models';

export interface IFeatureGeometry {
  type: string;
  coordinates: unknown;
}

export interface IProximityFeature {
  type?: string;
  properties?: Record<string, unknown> & { name?: string };
  geometry?: IFeatureGeometry;
}

export interface IDistrictCenterResult {
  center: { lat: number; lng: number };
  feature?: IProximityFeature;
}

export interface IStationRecommendation {
  station: IStationMeta;
  distanceKm: number;
  isInsideDistrict: boolean;
  isRecommended: boolean;
  score: number;
}

/**
 * Calculate the great-circle distance between two points in kilometers
 * using the Haversine formula.
 */
export function calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const earthRadiusKm = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(earthRadiusKm * c);
}

/**
 * Normalize names for fuzzy district/station matching
 */
export function normalizeLocationName(name?: string | null): string {
  return (name || '')
    .toLowerCase()
    .replace(/\b(district|province|city|met|station)\b/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Extract [lng, lat] coordinate pairs from GeoJSON geometry
 */
function extractCoordinates(coords: unknown): [number, number][] {
  if (!Array.isArray(coords)) return [];
  if (coords.length >= 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
    return [[coords[0], coords[1]]];
  }
  return coords.flatMap((inner) => extractCoordinates(inner));
}

/**
 * Calculate the bounding box center of a GeoJSON feature
 */
export function computeFeatureBboxCenter(feature?: IProximityFeature | null): { lat: number; lng: number } | undefined {
  if (!feature?.geometry?.coordinates) return undefined;
  const points = extractCoordinates(feature.geometry.coordinates);
  if (points.length === 0) return undefined;

  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  for (const [lng, lat] of points) {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }

  return {
    lat: Number(((minLat + maxLat) / 2).toFixed(4)),
    lng: Number(((minLng + maxLng) / 2).toFixed(4)),
  };
}

/**
 * Retrieve district reference coordinates and GeoJSON boundary.
 * Checks for direct coordinates first (upstream issue #28 forward compatibility),
 * and falls back to calculating the centroid from the bundled TopoJSON feature.
 */
export async function getDistrictCenterAndBoundary(
  countryCode: ICountryCode,
  districtId: string,
): Promise<IDistrictCenterResult | undefined> {
  const geoData = getGeoLocationData(countryCode);
  const deepest = getDeepestLocations(geoData);
  const district = deepest.find((d) => d.id === districtId);
  if (!district) return undefined;

  // 1. Forward-compatibility: Check if district item has precomputed coordinates
  const districtCoords = (district as { coordinates?: { latitude: number; longitude: number } }).coordinates;
  if (districtCoords?.latitude && districtCoords?.longitude) {
    return {
      center: {
        lat: districtCoords.latitude,
        lng: districtCoords.longitude,
      },
    };
  }

  // 2. Fallback: Parse TopoJSON boundary and calculate bbox center
  try {
    const topojson = await geoData.topoJson();
    const adminLevel = getDeepestAdminLevel(geoData);
    const geojson: IGeoJsonData = topoJsonToGeoJson(topojson, adminLevel);

    const candidates = [district.label, (district as { topoName?: string }).topoName, district.id].filter(
      (v): v is string => typeof v === 'string' && Boolean(v),
    );

    const feature = geojson.features.find((f: { properties?: { name?: string } }) => {
      const featName = f.properties?.name;
      return candidates.some((candidate) => normalizeLocationName(featName) === normalizeLocationName(candidate));
    }) as IProximityFeature | undefined;

    if (feature) {
      const center = computeFeatureBboxCenter(feature);
      if (center) {
        return { center, feature };
      }
    }
  } catch (err) {
    console.warn(`[LocationProximity] Could not compute district center for ${districtId}:`, err);
  }

  return undefined;
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
  const normDistrictLabel = normalizeLocationName(districtLabel);
  const normDistrictId = normalizeLocationName(districtId);

  const scored = stations
    .filter((s) => s.latitude !== null && s.longitude !== null && !s.draft)
    .map((station) => {
      const isInsideDistrict = (station.location || []).some((loc) => {
        const norm = normalizeLocationName(loc);
        return norm === normDistrictLabel || norm === normDistrictId;
      });

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
