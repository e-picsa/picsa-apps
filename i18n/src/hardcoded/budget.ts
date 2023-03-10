import BUDGET_CARDS from '../../../apps/picsa-tools/budget-tool/src/app/data/cards';
import type { ITranslationEntry } from '../types';

export const BUDGET_ENTRIES = BUDGET_CARDS.map((c) => {
  const entry: ITranslationEntry = {
    text: c.label,
    tool: 'budget',
    context: c.type,
  };
  return entry;
});
