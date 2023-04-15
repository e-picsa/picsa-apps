// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { BUDGET_CARDS } from '@picsa/budget/src/app/data';
import type { ITranslationEntry } from '../types';

export const BUDGET_ENTRIES = BUDGET_CARDS.map((c) => {
  const entry: ITranslationEntry = {
    text: c.label,
    tool: 'budget',
    context: c.type,
  };
  return entry;
});
