import * as DATA from '@picsa/data';

import type { ITranslationEntry } from '../types';

const crops: ITranslationEntry[] = DATA.CROPS_DATA.map((c) => ({
  text: c.label,
  tool: 'common_crops',
}));
const crop_activity: ITranslationEntry[] = DATA.CROP_ACTIVITY_DATA.map((c) => ({
  text: c.label,
  tool: 'common_crop_activity',
}));

const days: ITranslationEntry[] = DATA.DAY_NAMES.map((d, i) => ({
  text: d.label,
  tool: 'common_days',
  context: `day_${i + 1}`,
}));

const days_short: ITranslationEntry[] = DATA.DAY_NAMES.map((d, i) => ({
  text: d.labelShort,
  tool: 'common_days',
  context: `day_short_${i + 1}`,
}));

const months: ITranslationEntry[] = DATA.MONTH_NAMES.map((m, i) => ({
  text: m.label,
  tool: 'common_months',
  context: `month_${pad(i + 1)}`,
}));
const months_short: ITranslationEntry[] = DATA.MONTH_NAMES.map((m, i) => ({
  text: m.labelShort,
  tool: 'common_months',
  context: `month_short_${pad(i + 1)}`,
}));
const weather: ITranslationEntry[] = Object.values(DATA.WEATHER_DATA).map(({ label }) => ({
  text: label,
  tool: 'common_weather',
}));

export const DATA_ENTRIES = [
  ...crops,
  ...crop_activity,
  ...days,
  ...days_short,
  ...months,
  ...months_short,
  ...weather,
];

// pad leading 0 for 2-digit number, e.g 9 -> 09
function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}
