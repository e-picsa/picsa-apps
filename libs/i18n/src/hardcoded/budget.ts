// eslint-disable-next-line @nx/enforce-module-boundaries
import { BUDGET_CARDS } from '@picsa/budget/src/app/data';

import type { ITranslationEntry } from '../types';

const cardEntries: ITranslationEntry[] = BUDGET_CARDS.map((c) => ({
  text: c.label,
  tool: 'budget',
  context: c.type,
}));

export const BUDGET_ENTRIES = ([] as ITranslationEntry[]).concat(cardEntries);
