import { DAY_NAMES, MONTH_NAMES } from '@picsa/data';

import type { ITranslationEntry } from '../types';

const buttons: ITranslationEntry[] = ['Back', 'Close', 'Next', 'Save', 'Cancel', 'Delete', 'Edit'].map((text) => ({
  text,
  tool: 'common',
  context: 'buttons',
}));

const days: ITranslationEntry[] = DAY_NAMES.map((d, i) => ({
  text: d.label,
  tool: 'common_days' as any,
  context: `day_${i + 1}`,
}));

const days_short: ITranslationEntry[] = DAY_NAMES.map((d, i) => ({
  text: d.labelShort,
  tool: 'common_days' as any,
  context: `day_${i + 1}`,
}));

const months: ITranslationEntry[] = MONTH_NAMES.map((m, i) => ({
  text: m.label,
  tool: 'common_months' as any,
  context: `month_${pad(i + 1)}`,
}));
const months_short: ITranslationEntry[] = MONTH_NAMES.map((m, i) => ({
  text: m.labelShort,
  tool: 'common_months' as any,
  context: `month_${pad(i + 1)}`,
}));

export const COMMON_ENTRIES = [...buttons, ...days, ...days_short, ...months, ...months_short];

// pad leading 0 for 2-digit number, e.g 9 -> 09
function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}
