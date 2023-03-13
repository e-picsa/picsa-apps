import { ITranslationEntry } from '../types';
import { BUDGET_ENTRIES } from './budget';
import { CLIMATE_ENTRIES } from './climate';

export const HARDCODED_DATA: ITranslationEntry[] = [
  ...BUDGET_ENTRIES,
  ...CLIMATE_ENTRIES,
];
