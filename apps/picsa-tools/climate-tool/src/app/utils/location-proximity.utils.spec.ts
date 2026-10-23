import type { ICountryCode } from '@picsa/data';
import { getDeepestLocations, getGeoLocationData } from '@picsa/data/geoLocation';
import type { IStationMeta } from '@picsa/models';
import type { CountryCodeLegacy } from '@picsa/server-types';

import { CLIMATE_STATIONS_META } from '../data/stations';
import {
  calculateHaversineDistanceKm,
  computeFeatureBbox,
  computeFeatureBboxCenter,
  getCombinedDistrictAndStationBounds,
  getDistrictCenterAndBoundary,
  getLocationCenterAndBoundary,
  getStationRecommendations,
  isStationInDistrict,
  normalizeLocationName,
} from './location-proximity.utils';

describe('Location Proximity Utils', () => {
  describe('calculateHaversineDistanceKm', () => {
    it('calculates approximately correct distance between two points', () => {
      // Choma Met (-16.83, 26.98) to Livingstone (-17.85, 25.86) is ~160-170 km
      const dist = calculateHaversineDistanceKm(-16.83, 26.98, -17.85, 25.86);
      expect(dist).toBeGreaterThan(150);
      expect(dist).toBeLessThan(180);
    });

    it('returns 0 for identical points', () => {
      expect(calculateHaversineDistanceKm(-15.4, 28.3, -15.4, 28.3)).toBe(0);
    });
  });

  describe('normalizeLocationName', () => {
    it('removes stopwords, spaces, and punctuation', () => {
      expect(normalizeLocationName('Choma District')).toBe('choma');
      expect(normalizeLocationName('Chipepo Met')).toBe('chipepo');
      expect(normalizeLocationName('Makoholi Exp. Station (Met)')).toBe('makoholiexpstation');
      expect(normalizeLocationName(null)).toBe('');
    });
  });

  describe('computeFeatureBbox', () => {
    it('calculates min/max bounds from Polygon coordinates', () => {
      const feature = {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [20, 10],
              [30, 10],
              [30, 20],
              [20, 20],
              [20, 10],
            ],
          ],
        },
      };

      const bbox = computeFeatureBbox(feature);
      expect(bbox).toEqual({
        minLng: 20,
        minLat: 10,
        maxLng: 30,
        maxLat: 20,
      });
    });

    it('returns undefined for invalid geometry', () => {
      expect(computeFeatureBbox(undefined)).toBeUndefined();
      expect(computeFeatureBbox({ type: 'Feature' })).toBeUndefined();
    });
  });

  describe('computeFeatureBboxCenter', () => {
    it('returns centroid of the bounding box', () => {
      const feature = {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [20, 10],
              [30, 10],
              [30, 20],
              [20, 20],
              [20, 10],
            ],
          ],
        },
      };

      const center = computeFeatureBboxCenter(feature);
      expect(center).toEqual({ lat: 15, lng: 25 });
    });
  });

  describe('getCombinedDistrictAndStationBounds', () => {
    const feature = {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [26.5, -17.0],
            [27.5, -17.0],
            [27.5, -16.0],
            [26.5, -16.0],
            [26.5, -17.0],
          ],
        ],
      },
    };

    it('includes both feature bounds and station coordinates', () => {
      const station = { latitude: -15.5, longitude: 28.0 }; // Northeast of district
      const bounds = getCombinedDistrictAndStationBounds(feature, station);
      expect(bounds).toEqual([
        [26.5, -17.0],
        [28.0, -15.5],
      ]);
    });

    it('falls back to center if feature is missing', () => {
      const bounds = getCombinedDistrictAndStationBounds(
        undefined,
        { latitude: -16.8, longitude: 27.0 },
        { lat: -16.0, lng: 26.5 },
      );
      expect(bounds).toEqual([
        [26.5, -16.8],
        [27.0, -16.0],
      ]);
    });
  });

  describe('getDistrictCenterAndBoundary', () => {
    const activeCountries: ICountryCode[] = ['mw', 'zm', 'zw'];

    for (const country of activeCountries) {
      it(`resolves center and boundary feature for every district in "${country}" (including topoName aliases)`, async () => {
        const geoData = getGeoLocationData(country);
        const deepest = getDeepestLocations(geoData);

        expect(deepest.length).toBeGreaterThan(0);

        for (const district of deepest) {
          const result = await getDistrictCenterAndBoundary(country, district.id);
          expect(result).toBeDefined();
          expect(typeof result?.center.lat).toBe('number');
          expect(typeof result?.center.lng).toBe('number');
          expect(result?.feature).toBeDefined();
        }
      });
    }

    it('returns undefined for non-existent district', async () => {
      const result = await getDistrictCenterAndBoundary('zm', 'non_existent_district_12345');
      expect(result).toBeUndefined();
    });

    it('resolves parent location boundary when preferredAdminLevel: 4 is passed', async () => {
      const zwProvince = await getLocationCenterAndBoundary('zw', 'manicaland', 4);
      expect(zwProvince).toBeDefined();
      expect(zwProvince?.feature).toBeDefined();
      expect(typeof zwProvince?.center.lat).toBe('number');

      const zmProvince = await getLocationCenterAndBoundary('zm', 'central', 4);
      expect(zmProvince).toBeDefined();
      expect(zmProvince?.feature).toBeDefined();
      expect(typeof zmProvince?.center.lat).toBe('number');
    });
  });

  describe('getStationRecommendations', () => {
    const mockStations: IStationMeta[] = [
      {
        id: 'station_in_district',
        name: 'Choma Central',
        latitude: -16.83,
        longitude: 26.98,
        countryCode: 'zm',
        location: ['Choma District'],
        capabilities: {
          schemaVersion: 1,
          lastUpdated: '2024-01-01',
          contentHash: 'abc',
          years: [1970, 2020],
          totalYears: 50,
          completeRainYears: 35,
        },
      },
      {
        id: 'station_far_away',
        name: 'Far Away Station',
        latitude: -14.0,
        longitude: 28.0,
        countryCode: 'zm',
        location: ['Other District'],
        capabilities: {
          schemaVersion: 1,
          lastUpdated: '2024-01-01',
          contentHash: 'abc',
          years: [1970, 2020],
          totalYears: 50,
          completeRainYears: 40,
        },
      },
      {
        id: 'station_close_border',
        name: 'Close Border Station',
        latitude: -16.85,
        longitude: 27.05,
        countryCode: 'zm',
        location: ['Neighbor District'],
        capabilities: {
          schemaVersion: 1,
          lastUpdated: '2024-01-01',
          contentHash: 'abc',
          years: [1970, 2020],
          totalYears: 50,
          completeRainYears: 20,
        },
      },
    ];

    it('ranks in-district station as recommended', () => {
      const recommendations = getStationRecommendations(
        mockStations,
        { lat: -16.83, lng: 26.98 },
        'Choma District',
        'choma',
      );

      expect(recommendations.length).toBe(3);
      expect(recommendations[0].station.id).toBe('station_in_district');
      expect(recommendations[0].isRecommended).toBe(true);
      expect(recommendations[0].isInsideDistrict).toBe(true);
      expect(recommendations[1].isRecommended).toBe(false);
    });
  });

  describe('Station metadata district integrity', () => {
    const activeCountries: ICountryCode[] = ['mw', 'zm', 'zw'];

    for (const country of activeCountries) {
      it(`validates all stations in "${country}" map to a recognized district`, () => {
        const geoData = getGeoLocationData(country);
        const deepest = getDeepestLocations(geoData);
        const stations = CLIMATE_STATIONS_META[country as CountryCodeLegacy];

        expect(stations.length).toBeGreaterThan(0);

        for (const station of stations) {
          expect(station.location?.length).toBeGreaterThan(0);
          const matchesDistrict = deepest.some((d) => isStationInDistrict(station, d.label, d.id));
          expect(matchesDistrict).toBe(
            true,
            `Station "${station.name}" (${station.id}) in ${country} has location [${station.location?.join(
              ', ',
            )}] which does not match any recognized district in @picsa/data.`,
          );
        }
      });
    }
  });
});
