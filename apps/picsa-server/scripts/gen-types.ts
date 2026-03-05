import { writeFileSync } from 'fs';
import { getSupabaseClient } from './utils/supbase.utils';

/**
 * Custom type gen for geo data
 */
async function main() {
  const supabase = getSupabaseClient();
  const { data: countries, error: countriesError } = await supabase.schema('geo').from('countries').select('*');
  if (countriesError) {
    console.warn(countriesError);
    process.exit(1);
  }
  const { data: locales, error: localesError } = await supabase.schema('geo').from('locales').select('*');
  if (localesError) {
    console.warn(localesError);
    process.exit(1);
  }
  if (!countries) {
    console.warn(`[Supabase] geo.countries data missing. Ensure DB migrations complete before generating types`);
    process.exit(1);
  }
  if (!locales) {
    console.warn(`[Supabase] geo.locales data missing. Ensure DB migrations complete before generating types`);
    process.exit(1);
  }

  const countryCodes = countries.map((c) => `"${c.code}"`).join(' | ');
  const localeCodes = locales.map((l) => `"${l.code}"`).join(' | ');

  // HACK - legacy format used lower case countries and lower `[country]_[lang]` locales
  // with `global` code
  const countryCodesLegacy = countries
    .filter((c) => c.code !== 'XX' && c.code !== 'ZZ')
    .map((c) => `"${c.code.toLowerCase()}"`)
    .concat(`"global"`)
    .join(' | ');
  const localeCodesLegacy = locales
    .map((l) => `"${l.country_code?.toLowerCase() || 'global'}_${l.language_code}"`)
    .join(' | ');

  const output = `// Auto-generated — do not edit manually
// Run: npx tsx scripts/gen-types.ts

export type CountryCode = ${countryCodes};

export type CountryCodeLegacy = ${countryCodesLegacy};

export type LocaleCode = ${localeCodes};

export type LocaleCodeLegacy = ${localeCodesLegacy};
`;

  writeFileSync('supabase/types/db-derived.types.ts', output);
  console.log('Generated supabase/types/db-derived.types.ts');
}

main();
