import { ICountryCode } from '@picsa/data';
import type { Database } from '@picsa/server-types';

type TranslationDB = Database['public']['Tables']['translations'];

// Standard translation entries do not include id or overrides (id generated from text)
type TranslationEntryStandard = Omit<TranslationDB['Insert'], 'id'> & {
  id?: never;
  overrides?: never;
};

// Overridable translation entries provide unique id alongside overrides
type TranslationEntryWithOverrides = TranslationDB['Insert'] & {
  id: string;
  overrides: Partial<Record<ICountryCode, string>>;
};

export type ITranslationEntry = TranslationEntryStandard | TranslationEntryWithOverrides;
