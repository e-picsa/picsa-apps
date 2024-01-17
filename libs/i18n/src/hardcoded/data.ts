import * as DATA from '@picsa/data';

import type { ITranslationEntry } from '../types';

const days: ITranslationEntry[] = DATA.DAY_NAMES.map((d, i) => ({
  text: d.label,
  tool: 'common_days' as any,
  context: `day_${i + 1}`,
}));

const days_short: ITranslationEntry[] = DATA.DAY_NAMES.map((d, i) => ({
  text: d.labelShort,
  tool: 'common_days' as any,
  context: `day_short_${i + 1}`,
}));

const months: ITranslationEntry[] = DATA.MONTH_NAMES.map((m, i) => ({
  text: m.label,
  tool: 'common_months' as any,
  context: `month_${pad(i + 1)}`,
}));
const months_short: ITranslationEntry[] = DATA.MONTH_NAMES.map((m, i) => ({
  text: m.labelShort,
  tool: 'common_months' as any,
  context: `month_short_${pad(i + 1)}`,
}));
const crops: ITranslationEntry[] = DATA.CROPS_DATA.map((c) => ({
  text: c.label,
  tool: 'common_crops' as any,
}));

export const DATA_ENTRIES = [...crops, ...days, ...days_short, ...months, ...months_short];

// pad leading 0 for 2-digit number, e.g 9 -> 09
function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}
