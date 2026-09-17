import type { Database } from './db.types.ts';
export type { Database };

import type { CountryCode, CountryCodeLegacy, LocaleCode, LocaleCodeLegacy } from './db-derived.types.ts';
export type { CountryCode, CountryCodeLegacy, LocaleCode, LocaleCodeLegacy };

// Utility types
export type AppRole = Database['public']['Enums']['app_role'];
export type IAppUser = Database['public']['Tables']['app_users'];

import type { FunctionResponses } from './functions.types.ts';
export type { FunctionResponses };

import type * as ClimateApi from './climate-api.types.ts';
export type { ClimateApi };
