import { IStationMeta } from '@picsa/models';

import {
  calculateHaversineDistanceKm,
  computeFeatureBboxCenter,
  getStationRecommendations,
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
      expect(normalizeLocationName('Makoholi Exp. Station (Met)')).toBe('makoholiexp');
      expect(normalizeLocationName(null)).toBe('');
    });
  });

  describe('computeFeatureBboxCenter', () => {
    it('calculates center from Polygon coordinates', () => {
      const feature = {
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

    it('returns undefined for invalid features', () => {
      expect(computeFeatureBboxCenter(null)).toBeUndefined();
      expect(computeFeatureBboxCenter({ geometry: {} })).toBeUndefined();
    });
  });

  describe('getStationRecommendations', () => {
    const mockStations: IStationMeta[] = [
      {
        id: 'station_far',
        name: 'Far Station',
        latitude: -18.0,
        longitude: 27.0,
        countryCode: 'zm',
        location: ['Other District'],
        capabilities: {
          schemaVersion: 1,
          lastUpdated: '2024-01-01',
          contentHash: 'abc',
          years: [1970, 2020],
          totalYears: 50,
          completeRainYears: 48,
        },
      },
      {
        id: 'station_in_district',
        name: 'In District Station',
        latitude: -16.9,
        longitude: 27.0,
        countryCode: 'zm',
        location: ['Choma'],
        capabilities: {
          schemaVersion: 1,
          lastUpdated: '2024-01-01',
          contentHash: 'abc',
          years: [1970, 2020],
          totalYears: 50,
          completeRainYears: 45,
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
});
