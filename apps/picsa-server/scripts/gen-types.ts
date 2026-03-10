import { writeFileSync } from 'fs';
import { Project, SyntaxKind } from 'ts-morph';

import { getSupabaseClient } from './utils/supabase.utils';

const DB_TYPES_PATH = 'supabase/types/db.types.ts';
const DERIVED_TYPES_PATH = 'supabase/types/db-derived.types.ts';

/**
 * Custom type gen for geo data
 */
async function main() {
  await generateDeriveCountryCodeTypes();
  await patchCountryCodeTypes();
}

main();

/**
 * Extract list of country and locale codes defined in geo schema and use to populate derived
 * typescript types. Includes legacy mapping
 */
async function generateDeriveCountryCodeTypes() {
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

  writeFileSync(DERIVED_TYPES_PATH, output);
  console.log('Generated ' + DERIVED_TYPES_PATH);
}

/**
 * Retroactively assign stricter country_code types throughout all generated
 * database definitions, to link to derived types
 * Include mapping for legacy types depending on db schema
 */
async function patchCountryCodeTypes() {
  const project = new Project();
  const sourceFile = project.addSourceFileAtPath(DB_TYPES_PATH);

  // Ensure import exists
  const existingImport = sourceFile.getImportDeclaration('./db-derived.types.ts');
  if (!existingImport) {
    sourceFile.insertImportDeclaration(0, {
      isTypeOnly: true,
      namedImports: ['CountryCode', 'CountryCodeLegacy'],
      moduleSpecifier: './db-derived.types.ts',
    });
  }
  console.log('sourcefile', sourceFile.print());

  // Find the `Database` type alias
  const dbType = sourceFile.getTypeAliasOrThrow('Database');
  const dbTypeLiteral = dbType.getTypeNodeOrThrow().asKindOrThrow(SyntaxKind.TypeLiteral);

  // Schema → replacement type mapping
  const schemaMap: Record<string, string> = {
    geo: 'CountryCode',
    public: 'CountryCodeLegacy',
  };

  for (const [schemaName, replacementType] of Object.entries(schemaMap)) {
    const schemaProp = dbTypeLiteral.getProperty(schemaName);
    if (!schemaProp) continue;

    // Find all `country_code` properties anywhere within this schema
    const allProperties = schemaProp.getDescendantsOfKind(SyntaxKind.PropertySignature);

    for (const prop of allProperties) {
      if (prop.getName() !== 'country_code') continue;

      const typeNode = prop.getTypeNode();
      if (!typeNode) continue;

      const typeText = typeNode.getText();

      // Replace `string` with the derived type, preserving `| null`
      if (typeText === 'string') {
        prop.setType(replacementType);
      } else if (typeText === 'string | null') {
        prop.setType(`${replacementType} | null`);
      }
    }
  }

  sourceFile.saveSync();
  console.log(`Patched ${DB_TYPES_PATH} using ts-morph`);
}
