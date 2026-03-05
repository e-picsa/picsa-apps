import { writeFileSync } from 'fs';
import { getSupabaseClient } from './utils';

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
  const { data: testData, error: testError } = await supabase.from('deployments').select('*');
  if (testError) {
    console.warn(testError);
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

  const output = `// Auto-generated — do not edit manually
// Run: npx tsx scripts/generate-geo-types.ts

export type CountryCode = ${countryCodes};

export type LocaleCode = ${localeCodes};
`;

  writeFileSync('src/types/geo.generated.ts', output);
  console.log('Generated src/types/geo.generated.ts');
}

main();
