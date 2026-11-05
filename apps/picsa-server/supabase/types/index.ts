import type { Database } from './db.types.ts';
export type { Database };

import type { CountryCode, CountryCodeLegacy, LocaleCode, LocaleCodeLegacy } from './db-derived.types.ts';
export type { CountryCode, CountryCodeLegacy, LocaleCode, LocaleCodeLegacy };

// Utility types
export type AppRole = Database['public']['Enums']['app_role'];
export type IAppUser = Database['public']['Tables']['app_users'];

// Translations table types & database column parity assertions
// NOTE: single-line import + export (not multiline `export ... from`).
// The pinned Supabase CLI (2.69.0) only bind-mounts files referenced by
// single-line `import ... from` statements into the edge-runtime container,
// so multiline references resolve locally but are missing at serve time.
import type { ITranslationInsert, ITranslationRow, ITranslationUpdate, TranslationLocaleColumn } from './translations.types.ts';
export type { ITranslationInsert, ITranslationRow, ITranslationUpdate, TranslationLocaleColumn };

import type { FunctionResponses } from './functions.types.ts';
export type { FunctionResponses };

import type * as ClimateApi from './climate-api.types.ts';
export type { ClimateApi };
