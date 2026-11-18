import type { IAnnualRainfallSummariesData, ICropSuccessEntry } from '../../climate/types';
import {
  buildCropVarietyQcRows,
  evaluateLocationCropQc,
  evaluateVarietyQc,
  extractStationLookupBounds,
  extractStationSeasonBounds,
  formatPlantDayLabel,
} from './crop-qc.utils';

describe('crop-qc.utils', () => {
  const makeProbEntry = (plant_day: number, plant_length: number, total_rain: number): ICropSuccessEntry => ({
    station: 'TEST',
    plant_day,
    plant_length,
    total_rain,
    prop_success_no_start: 0.5,
    prop_success_with_start: 0.5,
  });

  describe('extractStationLookupBounds', () => {
    it('should return null when entries are missing or empty', () => {
      expect(extractStationLookupBounds(null)).toBeNull();
      expect(extractStationLookupBounds(undefined)).toBeNull();
      expect(extractStationLookupBounds([])).toBeNull();
    });

    it('should extract min/max days, water, and planting date bounds', () => {
      const entries = [makeProbEntry(123, 60, 200), makeProbEntry(153, 105, 600), makeProbEntry(183, 150, 1200)];
      const bounds = extractStationLookupBounds(entries);
      expect(bounds).toEqual({
        minDays: 60,
        maxDays: 150,
        daysSteps: 3,
        daysStep: 45,
        minWater: 200,
        maxWater: 1200,
        waterSteps: 3,
        waterStep: 400,
        minPlantDay: 123,
        maxPlantDay: 183,
        plantDaySteps: 3,
        plantDayStep: 30,
        minPlantDateLabel: formatPlantDayLabel(123),
        maxPlantDateLabel: formatPlantDayLabel(183),
        entryCount: 3,
      });
    });
  });

  describe('extractStationSeasonBounds', () => {
    it('should return null when no valid season_length entries exist', () => {
      expect(extractStationSeasonBounds(null)).toBeNull();
      expect(extractStationSeasonBounds([{ station: 'A', year: 2020 }] as IAnnualRainfallSummariesData[])).toBeNull();
    });

    it('should ignore null season_length entries and compute min, max, avg', () => {
      const rainfall = [
        { station: 'A', year: 2019, season_length: 90 },
        { station: 'A', year: 2020, season_length: undefined },
        { station: 'A', year: 2021, season_length: 180 },
      ] as IAnnualRainfallSummariesData[];
      expect(extractStationSeasonBounds(rainfall)).toEqual({
        minSeasonLength: 90,
        maxSeasonLength: 180,
        avgSeasonLength: 135,
        validYears: 2,
      });
    });
  });

  describe('evaluateVarietyQc', () => {
    const lookupBounds = extractStationLookupBounds([makeProbEntry(123, 60, 200), makeProbEntry(183, 150, 800)]);
    const seasonBounds = { minSeasonLength: 80, maxSeasonLength: 160, avgSeasonLength: 120, validYears: 30 };

    it('should include a variety strictly within lookup and season bounds', () => {
      const res = evaluateVarietyQc({
        crop: 'maize',
        variety: 'SC-419',
        waterRequirement: 450,
        varietyData: { days_lower: 100, days_upper: 120 },
        lookupBounds,
        seasonBounds,
      });
      expect(res.included).toBe(true);
      expect(res.failures).toEqual([]);
      expect(res.warnings).toEqual([]);
    });

    it('should exclude missing variety definitions regardless of applyBounds', () => {
      const res = evaluateVarietyQc({
        crop: 'maize',
        variety: 'UNKNOWN',
        waterRequirement: 450,
        varietyData: undefined,
        lookupBounds,
        seasonBounds,
        applyBounds: false,
      });
      expect(res.included).toBe(false);
      expect(res.failures.map((f) => f.code)).toEqual(['missing_variety_definition']);
    });

    it('should distinguish partial range exceedance (days_upper > max) vs full range exceedance (days_lower > max)', () => {
      const partial = evaluateVarietyQc({
        crop: 'maize',
        variety: 'SC-727',
        waterRequirement: 500,
        varietyData: { days_lower: 150, days_upper: 155 },
        lookupBounds,
        seasonBounds,
      });
      expect(partial.included).toBe(false);
      expect(partial.failures.map((f) => f.code)).toEqual(['days_upper_above_lookup_max']);

      const full = evaluateVarietyQc({
        crop: 'pigeon-peas',
        variety: 'KACHANGU',
        waterRequirement: 500,
        varietyData: { days_lower: 190, days_upper: 190 },
        lookupBounds,
        seasonBounds,
      });
      expect(full.included).toBe(false);
      expect(full.failures.map((f) => f.code)).toEqual(['days_above_lookup_max']);
      expect(full.warnings.map((w) => w.code)).toEqual(['exceeds_max_season_length']);
    });

    it('should exclude varieties with water below min or above max lookup bounds', () => {
      const below = evaluateVarietyQc({
        crop: 'beans',
        variety: 'NUA',
        waterRequirement: 195,
        varietyData: { days_lower: 70, days_upper: 70 },
        lookupBounds,
        seasonBounds,
      });
      expect(below.included).toBe(false);
      expect(below.failures.map((f) => f.code)).toEqual(['water_below_lookup_min']);

      const above = evaluateVarietyQc({
        crop: 'pigeon-peas',
        variety: 'SAUMA',
        waterRequirement: 855,
        varietyData: { days_lower: 270, days_upper: 270 },
        lookupBounds,
        seasonBounds,
      });
      expect(above.included).toBe(false);
      expect(above.failures.map((f) => f.code)).toEqual(['days_above_lookup_max', 'water_above_lookup_max']);
    });

    it('should keep variety included when applyBounds is false while still reporting failures', () => {
      const res = evaluateVarietyQc({
        crop: 'maize',
        variety: 'SC-727',
        waterRequirement: 500,
        varietyData: { days_lower: 150, days_upper: 155 },
        lookupBounds,
        seasonBounds,
        applyBounds: false,
      });
      expect(res.included).toBe(true);
      expect(res.failures.map((f) => f.code)).toEqual(['days_upper_above_lookup_max']);
    });

    it('should warn on exceeds_360_days and exceeds_max_season_length without excluding if within lookup bounds', () => {
      const wideLookup = extractStationLookupBounds([makeProbEntry(123, 60, 200), makeProbEntry(183, 180, 800)]);
      const tightSeason = { minSeasonLength: 80, maxSeasonLength: 170, avgSeasonLength: 120, validYears: 30 };
      const res = evaluateVarietyQc({
        crop: 'cotton',
        variety: 'LATE',
        waterRequirement: 500,
        varietyData: { days_lower: 170, days_upper: 175 },
        lookupBounds: wideLookup,
        seasonBounds: tightSeason,
      });
      expect(res.included).toBe(true);
      expect(res.warnings.map((w) => w.code)).toEqual(['exceeds_max_season_length']);

      const over360 = evaluateVarietyQc({
        crop: 'cassava',
        variety: 'SAUTI',
        waterRequirement: 500,
        varietyData: { days_lower: 450, days_upper: 450 },
        lookupBounds: null,
        seasonBounds: tightSeason,
      });
      expect(over360.included).toBe(true);
      expect(over360.warnings.map((w) => w.code)).toEqual(['exceeds_360_days', 'exceeds_max_season_length']);
    });
  });

  describe('evaluateLocationCropQc & buildCropVarietyQcRows', () => {
    it('should summarize location results and aggregate across deployment varieties', () => {
      const lookupBounds = extractStationLookupBounds([makeProbEntry(123, 60, 200), makeProbEntry(183, 150, 800)]);
      const cropData = [
        { crop: 'maize', variety: 'SC-419', days_lower: 110, days_upper: 120 },
        { crop: 'maize', variety: 'SC-727', days_lower: 150, days_upper: 155 },
        { crop: 'cassava', variety: 'SAUTI', days_lower: 450, days_upper: 450 },
      ];
      const cropDataHashmap = {
        'maize/SC-419': cropData[0],
        'maize/SC-727': cropData[1],
        'cassava/SAUTI': cropData[2],
      };

      const locSummary = evaluateLocationCropQc({
        locationId: 'chipata',
        stationId: 'zm/chipata_met',
        cropDataHashmap,
        waterRequirements: { maize: { 'SC-419': 450, 'SC-727': 600, LOCAL: 500 } },
        lookupBounds,
        seasonBounds: null,
      });
      expect(locSummary.evaluatedCount).toBe(3);
      expect(locSummary.includedCount).toBe(1);
      expect(locSummary.excludedCount).toBe(2);

      const rows = buildCropVarietyQcRows({
        cropData,
        downscaledData: [
          {
            location_id: 'chipata',
            station_id: 'zm/chipata_met',
            water_requirements: { maize: { 'SC-419': 450, 'SC-727': 600, LOCAL: 500 } },
          },
        ],
        stationBoundsById: { 'zm/chipata_met': { lookupBounds, seasonBounds: null } },
      });

      const byKey = Object.fromEntries(rows.map((r) => [`${r.crop}/${r.variety}`, r]));
      expect(byKey['maize/SC-419'].status).toBe('OK');
      expect(byKey['maize/SC-419'].water_min).toBe(450);
      expect(byKey['maize/SC-419'].days_issue).toBeNull();
      expect(byKey['maize/SC-727'].status).toBe('All Excluded');
      expect(byKey['maize/SC-727'].water_min).toBe(600);
      expect(byKey['maize/SC-727'].days_issue).toBe('exclude');
      expect(byKey['maize/SC-727'].issues).toHaveLength(1);
      expect(byKey['maize/SC-727'].issues[0].locationId).toBe('chipata');
      expect(byKey['maize/LOCAL'].status).toBe('Missing Definition');
      expect(byKey['cassava/SAUTI'].status).toBe('Season / >360d Warning');
      expect(byKey['cassava/SAUTI'].water_min).toBeNull();
      expect(byKey['cassava/SAUTI'].warnings_count).toBe(1);
      expect(byKey['cassava/SAUTI'].days_issue).toBe('warning');
      expect(byKey['cassava/SAUTI'].summary).toBe('> 360d limit');
      expect(byKey['maize/SC-727'].status_rank).toBeLessThan(byKey['maize/LOCAL'].status_rank);
      expect(byKey['cassava/SAUTI'].status_rank).toBeLessThan(byKey['maize/SC-419'].status_rank);

      // Verify >360d variety with downscaled locations is not double-counted (+1)
      const downscaledOver360 = buildCropVarietyQcRows({
        cropData: [{ crop: 'cassava', variety: 'SAUTI', days_lower: 450, days_upper: 450 }],
        downscaledData: [
          { location_id: 'loc1', station_id: 'zm/chipata_met', water_requirements: { cassava: { SAUTI: 500 } } },
          { location_id: 'loc2', station_id: 'zm/chipata_met', water_requirements: { cassava: { SAUTI: 520 } } },
        ],
        stationBoundsById: { 'zm/chipata_met': { lookupBounds, seasonBounds: null } },
      });
      expect(downscaledOver360[0].warnings_count).toBe(2);
    });
  });
});
