// eslint-disable-next-line @nx/enforce-module-boundaries
import { BUDGET_CARDS } from '@picsa/budget/src/app/data';

import type { ITranslationEntry } from '../types';

const cardEntries: ITranslationEntry[] = BUDGET_CARDS.map((c) => ({
  text: c.label,
  tool: 'budget',
  context: c.type,
}));

const monthEntries: ITranslationEntry[] = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
].map((text, i) => ({ text, tool: 'budget', context: `month_${i + 1}` }));

const monthShortEntries: ITranslationEntry[] = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
].map((text, i) => ({ text, tool: 'budget', context: `month_${i + 1}_short` }));

const dayEntries: ITranslationEntry[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
].map((text, i) => ({
  text,
  tool: 'budget',
  context: `day_${i + 1}`,
}));

export const BUDGET_ENTRIES = ([] as ITranslationEntry[]).concat(
  cardEntries,
  monthEntries,
  monthShortEntries,
  dayEntries
);
