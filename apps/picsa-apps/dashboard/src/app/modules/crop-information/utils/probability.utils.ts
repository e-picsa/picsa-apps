// eslint-disable-next-line @nx/enforce-module-boundaries
import type { IStationCropData } from '@picsa/crop-probability/src/app/models';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { groupAndSortCropDataItems } from '@picsa/crop-probability/src/app/utils/probability-table.utils';
import { ICropName, MONTH_DATA } from '@picsa/data';

import type { IAnnualRainfallSummariesData, ICropSuccessEntry } from '../../climate/types';
import type { ICropData, ICropDataDownscaledWaterRequirements } from '../services';

export interface ISeasonStartProbability {
  plantDate: number;
  label: string;
  probability: number;
}

export const WATER_REQUIREMENT_ROUNDING = 25;

/**
 * Strategy interface for interpolating crop success probability values.
 * Allows decoupling the interpolation math from database traversal logic.
 */
export type IProbabilityInterpolationStrategy = (
  target: number,
  lowerKey: number,
  upperKey: number,
  lowerValue: number,
  upperValue: number,
) => number;

/**
 * Standard linear interpolation (weighted average) implementation.
 */
export const linearInterpolationStrategy: IProbabilityInterpolationStrategy = (
  target,
  lower,
  upper,
  valLower,
  valUpper,
) => {
  if (lower === upper) return valLower;
  const fraction = (target - lower) / (upper - lower);
  return valLower + fraction * (valUpper - valLower);
};

/**
 * Performs a single-pass search to find the sorted keys directly surrounding a target value.
 * Returns identical keys if target is an exact match or falls out of bounds (capping behavior).
 */
export function findSurroundingKeys(target: number, keys: number[]): { lower: number; upper: number } {
  if (keys.length === 0) {
    throw new Error('Keys array cannot be empty');
  }
  const sorted = [...keys].sort((a, b) => a - b);
  const len = sorted.length;

  const index = sorted.findIndex((key) => key >= target);

  if (index === 0) {
    return { lower: sorted[0], upper: sorted[0] };
  }
  if (index === -1) {
    return { lower: sorted[len - 1], upper: sorted[len - 1] };
  }

  const upper = sorted[index];
  if (upper === target) {
    return { lower: upper, upper };
  }

  return { lower: sorted[index - 1], upper };
}

export const CROP_SORT_PRIORITY: ICropName[] = [
  'maize',
  'sorghum',
  'beans',
  'groundnuts',
  'roundnuts',
  'soya-beans',
  'sunflower',
  'cowpeas',
  'cotton',
  'tobacco',
  'sweet-potatoes',
];

export type IProbabilityHashmap = Record<number, Record<number, Record<number, number>>>;

export function roundToNearest(value: number, n: number): number {
  if (n === 0) return value; // Prevent division by zero

  const result = Math.round(value / n) * n;

  // Determine decimal places of step 'n' to clean up floating point noise
  const stepString = n.toString();
  const decimalPlaces = stepString.includes('.') ? stepString.split('.')[1].length : 0;

  return decimalPlaces > 0 ? parseFloat(result.toFixed(decimalPlaces)) : result;
}

// HACK - current data system hardcodes ranges, so try to match
// NOTE - this is a temporary measure and only works for data with 180 day offset
export function plantDayToDateLabel(plantDate: number): string {
  const d = new Date(2025, 0);
  // TODO - +181 used in some local met but need to check with definitions/get api to return day of year
  // Sometimes also 182/183
  d.setDate(plantDate + 181);
  return `${d.getDate()}-${MONTH_DATA[d.getMonth()].labelShort}`;
}

/**
 * Calculates the cumulative distribution function (CDF) for a given data set.
 * To calculate probability `<= `a value use `cdf[value+1]`
 *
 * Uses counting sort and prefix sums for O(1) lookups after O(n) preprocessing.
 * Generated using GPT-4.1
 *
 * @param data - Array of observed values
 */
export function cumulativeDistribution(data: number[]): number[] {
  if (!data || data.length === 0) return [];
  // Step 1: Count occurrences of each number.
  // Use array length Max + 1 for number 0, 1, ... MAX
  const MAX = Math.max(...data);
  const counts = new Array(MAX + 1).fill(0);
  for (const num of data) counts[num]++;

  // Step 2: Build prefix sums
  // To query <= value we will need to select cdf[prefix + 1], so ensure MAX + 2 entries
  const cdf = new Array(MAX + 2).fill(0);
  for (let i = 1; i <= MAX + 1; i++) {
    cdf[i] = cdf[i - 1] + counts[i - 1];
  }

  return cdf;
}

export function generateProbabilityHashmap(entries: ICropSuccessEntry[]): IProbabilityHashmap {
  const hashmap: { [water_req: number]: { [plant_length: number]: { [plant_day: number]: number } } } = {};
  for (const entry of entries) {
    const { plant_day, plant_length, total_rain, prop_success_no_start } = entry;
    hashmap[total_rain] ??= {};
    hashmap[total_rain][plant_length] ??= {};
    hashmap[total_rain][plant_length][plant_day] = prop_success_no_start;
  }
  return hashmap;
}

/**
 * Helper to interpolate between lower and upper boundary values.
 * Falls back to available boundary value if one is missing (sparse data).
 */
export function interpolateValue(
  target: number,
  lowerKey: number,
  upperKey: number,
  valLower: number | undefined,
  valUpper: number | undefined,
  strategy: IProbabilityInterpolationStrategy = linearInterpolationStrategy,
): number | undefined {
  if (typeof valLower === 'number' && typeof valUpper === 'number') {
    return strategy(target, lowerKey, upperKey, valLower, valUpper);
  }
  return valLower ?? valUpper;
}

/**
 * Fetches and interpolates the crop success probability for a given water requirement and plant length.
 * Decouples lookup and math strategies, supporting nearest-neighbor/clipping bounds and sparse database fallbacks.
 */
export function getCropSuccessProbability(
  water: number,
  days: number,
  plantDates: number[],
  probabilityHashmap: IProbabilityHashmap,
  strategy: IProbabilityInterpolationStrategy = linearInterpolationStrategy,
): (number | undefined)[] {
  const waterKeys = Object.keys(probabilityHashmap).map(Number);
  if (waterKeys.length === 0) {
    return new Array(plantDates.length).fill(undefined);
  }

  const { lower: lowerWater, upper: upperWater } = findSurroundingKeys(water, waterKeys);

  const getProbabilitiesForWaterKey = (wKey: number): (number | undefined)[] => {
    const waterEntry = probabilityHashmap[wKey];
    if (!waterEntry) {
      return new Array(plantDates.length).fill(undefined);
    }

    const plantLengths = Object.keys(waterEntry).map(Number);
    if (plantLengths.length === 0) {
      return new Array(plantDates.length).fill(undefined);
    }

    const { lower: lowerDays, upper: upperDays } = findSurroundingKeys(days, plantLengths);

    return plantDates.map((date) =>
      interpolateValue(
        days,
        lowerDays,
        upperDays,
        waterEntry[lowerDays]?.[date],
        waterEntry[upperDays]?.[date],
        strategy,
      ),
    );
  };

  if (lowerWater === upperWater) {
    return getProbabilitiesForWaterKey(lowerWater);
  }

  const probsLowerWater = getProbabilitiesForWaterKey(lowerWater);
  const probsUpperWater = getProbabilitiesForWaterKey(upperWater);

  return plantDates.map((_, i) =>
    interpolateValue(water, lowerWater, upperWater, probsLowerWater[i], probsUpperWater[i], strategy),
  );
}

export function generateProbabilityEntryValues(
  probabilities: { upper: (number | undefined)[]; lower: (number | undefined)[] },
  plantDates: number[],
): (number | null)[] {
  return plantDates.map((v, i) => {
    const lower = probabilities.lower[i];
    const upper = probabilities.upper[i];
    if (typeof lower === 'number' && typeof upper === 'number') {
      const mean = (lower + upper) / 2;
      return roundToNearest(mean, 0.1);
    }
    // If probability NaN simply return as null
    return null;
  });
}

export function sortByPriorityCrops(a: IStationCropData, b: IStationCropData): number {
  const aPriority = CROP_SORT_PRIORITY.includes(a.crop) ? CROP_SORT_PRIORITY.indexOf(a.crop) : 99;
  const bPriority = CROP_SORT_PRIORITY.includes(b.crop) ? CROP_SORT_PRIORITY.indexOf(b.crop) : 99;
  return aPriority - bPriority;
}

export function generateTable(params: {
  cropDataHashmap: Record<string, ICropData['Row']>;
  waterRequirements: ICropDataDownscaledWaterRequirements;
  startProbabilities: ISeasonStartProbability[];
  probabilityHashmap: IProbabilityHashmap;
}): IStationCropData[] {
  const { cropDataHashmap, waterRequirements = {}, startProbabilities, probabilityHashmap } = params;
  const entries: IStationCropData[] = [];
  const plantDates = startProbabilities.map((v) => v.plantDate);
  for (const [crop, requirements] of Object.entries(waterRequirements)) {
    const entry: IStationCropData = {
      crop: crop as ICropName,
      data: [],
    };
    for (const [variety, waterRequirement] of Object.entries(requirements)) {
      const varietyData = cropDataHashmap[`${crop}/${variety}`];
      if (varietyData) {
        const { days_lower, days_upper } = varietyData;
        const days = { lower: days_lower, upper: days_upper };
        const probabilities = {
          lower: getCropSuccessProbability(waterRequirement, days_lower, plantDates, probabilityHashmap),
          upper: getCropSuccessProbability(waterRequirement, days_upper, plantDates, probabilityHashmap),
        };
        const probabilityValues = generateProbabilityEntryValues(probabilities, plantDates);
        entry.data.push({
          days: [...new Set([days.lower, days_upper])].join(' - '),
          days_lower: days.lower,
          days_upper: days.upper,
          variety,
          probabilities: probabilityValues,
          water: [waterRequirement],
        });
      } else {
        console.warn(`no variety data found for [${crop}/${variety}]`);
      }
    }

    entry.data = groupAndSortCropDataItems(entry.data);
    entries.push(entry);
  }

  return entries.sort(sortByPriorityCrops);
}

export function calcSeasonStartProbabilities(
  rainfallData: IAnnualRainfallSummariesData[],
  probabilityData: ICropSuccessEntry[],
): ISeasonStartProbability[] {
  const allStartDates = rainfallData.map((d) => d.start_rains_doy).filter((v) => typeof v === 'number') as number[];
  if (allStartDates.length === 0) return [];
  const uniquePlantDates = [...new Set(probabilityData.map((v) => v.plant_day))];
  const cdf = cumulativeDistribution(allStartDates);

  // Lookup each plant date and find total number of years >= value ()
  const total = allStartDates.length;
  return uniquePlantDates
    .map((plantDate) => ({
      plantDate,
      probability: cdf[plantDate + 1] / total,
      label: plantDayToDateLabel(plantDate),
    }))
    .filter(({ probability }) => probability >= 0.05);
}
