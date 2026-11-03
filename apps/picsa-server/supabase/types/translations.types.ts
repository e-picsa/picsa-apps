import type { Database } from './db.types.ts';
import type { LocaleCodeLegacy } from './db-derived.types.ts';

/**
 * Translations Database Model & Parity Assertions
 *
 * BACKGROUND:
 * `public.translations` currently uses a wide-column schema where each non-English
 * language has a dedicated column (e.g. `mw_ny`, `zm_bem`, `zw_sn`, `zw_nd`),
 * while English source text is stored in `text`.
 *
 * WHY THIS TYPE CHECK EXISTS:
 * When a new locale is registered in `geo.locales` or deployment configs, the app
 * and dashboard dynamically attempt to query and update `row[locale_code]`.
 * If the corresponding database column was not added via a Supabase migration
 * (e.g. `ALTER TABLE public.translations ADD COLUMN zw_sn text;`), runtime errors
 * occur when translators attempt to save or read strings for that language.
 *
 * HOW IT WORKS:
 * - `TranslationLocaleColumn` derives all expected DB column names from `LocaleCodeLegacy`
 *   (excluding `*_en` which maps to the base `text` column).
 * - `MissingTranslationColumns` computes `Exclude<TranslationLocaleColumn, keyof ITranslationRow>`.
 * - `_AssertAllColumnsPresent` enforces at compile time that `MissingTranslationColumns`
 *   must be `never`.
 *
 * WHAT TO DO IF THIS FAILS TO COMPILE:
 * If a type error occurs here:
 *   Type '{ ERROR: ...; MISSING_COLUMNS: "..."; }' does not satisfy constraint 'true'
 * It means a locale was added without its database column migration.
 * 1. Create a migration in `apps/picsa-server/supabase/migrations/`:
 *    `ALTER TABLE public.translations ADD COLUMN IF NOT EXISTS <locale> text;`
 * 2. Update `apps/picsa-server/supabase/types/db.types.ts` to include the column.
 *
 * FUTURE REFACTOR:
 * When `public.translations` is migrated to a normalized relational structure
 * or JSONB document referencing BCP 47 codes (see GitHub issue #844),
 * wide columns and this assertion will no longer be necessary.
 */

/** Translation database table row */
export type ITranslationRow = Database['public']['Tables']['translations']['Row'];

/** Translation database insert payload */
export type ITranslationInsert = Database['public']['Tables']['translations']['Insert'];

/** Translation database update payload */
export type ITranslationUpdate = Database['public']['Tables']['translations']['Update'];

/** Non-English translation locales that must map to dedicated column names on `public.translations` */
export type TranslationLocaleColumn = Exclude<LocaleCodeLegacy, `${string}_en`>;

type MissingTranslationColumns = Exclude<TranslationLocaleColumn, keyof ITranslationRow>;

type _AssertNoMissingColumns<
  TMissing,
  _Result = [TMissing] extends [never]
    ? true
    : {
        ERROR: 'Locale defined in LocaleCodeLegacy has no matching column on public.translations in db.types.ts';
        MISSING_COLUMNS: TMissing;
        REQUIRED_ACTION: 'Add a Supabase migration: ALTER TABLE public.translations ADD COLUMN <col> text;';
      },
> = _Result extends true ? true : _Result;

/**
 * Compile-time assertion: evaluated during typecheck and CI builds without emitting any runtime JS.
 * Will throw a compile error if any non-English locale is missing its column in db.types.ts.
 */
type _VerifyTranslationColumnsExistInDB = _AssertNoMissingColumns<MissingTranslationColumns>;

type _TypeCheck<T extends true> = T;
// Evaluated by TypeScript during compilation
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _AssertAllColumnsPresent = _TypeCheck<_VerifyTranslationColumnsExistInDB>;
