import { spawnSync } from 'child_process';

// import { spawnSync } from 'child_process';
import {
  emptyDirSync,
  ensureDirSync,
  existsSync,
  readJSONSync,
  readJsonSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'fs-extra';
import { tmpdir } from 'os';
import { resolve } from 'path';
import { HARDCODED_DATA } from './hardcoded';
import { ITranslationEntry } from './types';
import { arrayToHashmap } from '@picsa/utils';

const I18N_DIR = resolve(__dirname, '../');
const PROJECT_ROOT = resolve(I18N_DIR, '../../');
const SOURCE_STRINGS_DIR = resolve(I18N_DIR, 'source');
const GENERATED_ASSETS_DIR = resolve(I18N_DIR, 'assets');
const GENERATED_TEMPLATES_DIR = resolve(I18N_DIR, 'templates');
const TEMPLATE_PATH = resolve(GENERATED_TEMPLATES_DIR, `_template.json`);

/** List of tool names which to extract from the picsa-tools workspace */
const EXTRACTED_TOOLS = [
  'budget',
  'climate',
  'monitoring',
  'option',
  'resources',
] as const;

/**
 * Generate a list of strings for translation, as identified in the app through ngx-translate
 * bindings and hardcoded data entries
 * Create language-specific translation sheets by mapping source translations with template
 * */
function main() {
  setupFolders();
  generateTranslationTemplates();
  generateAppLanguageAssets();
}

function setupFolders() {
  ensureDirSync(GENERATED_ASSETS_DIR);
  emptyDirSync(GENERATED_ASSETS_DIR);
  ensureDirSync(GENERATED_TEMPLATES_DIR);
  emptyDirSync(GENERATED_TEMPLATES_DIR);
}

/**
 * Extract all available strings from both ngx-translate methods and hardcoded data
 * Create json and csv lists of unique entry templates for translation
 */
function generateTranslationTemplates() {
  const entries: ITranslationEntry[] = HARDCODED_DATA;
  for (const name of EXTRACTED_TOOLS) {
    const extracted = generateNGXTranslateStrings(
      resolve(PROJECT_ROOT, `apps/picsa-tools/${name}-tool`)
    );
    for (const key of Object.keys(extracted)) {
      entries.push(stringToTranslationEntry(key, name));
    }
  }
  const common = generateNGXTranslateStrings('libs');
  for (const key of Object.keys(common)) {
    entries.push(stringToTranslationEntry(key, 'common'));
  }
  // sort and remove duplicates
  const unique = Object.values(arrayToHashmap(entries, 'text'));
  const sorted = unique.sort((a, b) => {
    // sort empty strings to top, then by tool-context-text
    if (a.text === '' || b.text === '') return a.text > b.text ? 1 : -1;
    const comparator =
      `${a.tool}-${a.context}-${a.text}` > `${b.tool}-${b.context}-${b.text}`;
    return comparator ? 1 : -1;
  });
  writeOutputJson(sorted);
  writeOutputCSV(sorted);
  console.log('Templates generated', GENERATED_TEMPLATES_DIR);
  console.log('Assets generated', GENERATED_ASSETS_DIR);
}

/**
 * Check source strings dir. For every set of language translations merge with
 * template translations list to produce a single [lang].json file ready for
 * import into translation assets
 */
function generateAppLanguageAssets() {
  const entries: ITranslationEntry[] = readJsonSync(TEMPLATE_PATH);
  const translatedFiles = readdirSync(SOURCE_STRINGS_DIR).map((name) => ({
    filePath: resolve(SOURCE_STRINGS_DIR, name),
    code: name.split('.')[0],
  }));
  for (const { filePath, code } of translatedFiles) {
    const translated: Record<string, string> = {};
    const untranslated: Record<string, string> = {};
    const translations = readJsonSync(filePath);
    // Populate case-insensitive translations to case-sensitive source entries
    for (const { text } of entries) {
      if (text in translations) {
        translated[text] = translations[text];
      } else {
        untranslated[text] = '';
      }
    }
    const outputTarget = resolve(GENERATED_ASSETS_DIR, `${code}.json`);
    const outputTranslations = {
      ...sortJsonByKey(untranslated),
      ...sortJsonByKey(translated),
    };
    writeFileSync(outputTarget, JSON.stringify(outputTranslations, null, 2));
  }
}

function stringToTranslationEntry(
  text: string,
  tool: string,
  context?: string
) {
  const entry: ITranslationEntry = {
    text,
    tool: tool as any,
  };
  if (context) entry.context = context;
  return entry;
}

function writeOutputJson(entries: ITranslationEntry[]) {
  writeFileSync(TEMPLATE_PATH, JSON.stringify(entries, null, 2));
  // write additional en version where key just matches value
  const enJson = {};
  const enJsonPath = resolve(GENERATED_ASSETS_DIR, 'en.json');
  for (const { text } of Object.values(entries)) {
    enJson[text] = text;
  }
  writeFileSync(enJsonPath, JSON.stringify(enJson, null, 2));
}

/** Convert json to csv and output (adapted from https://stackoverflow.com/a/31536517) */
function writeOutputCSV(entries: ITranslationEntry[]) {
  const target = resolve(GENERATED_TEMPLATES_DIR, `_template.csv`);
  const replacer = (key: string, value: string) =>
    value === null ? '' : value; // specify how you want to handle null values here
  const header: (keyof ITranslationEntry)[] = ['tool', 'context', 'text'];
  const csv = [
    header.join(','), // header row first
    ...entries.map((row) =>
      header
        .map((fieldName) => JSON.stringify(row[fieldName], replacer))
        .join(',')
    ),
  ].join('\r\n');
  writeFileSync(target, csv);
}

/**
 * Export a list of all strings referenced in @vendure/ngx-translate-extract
 * https://github.com/vendure-ecommerce/ngx-translate-extract
 * */
function generateNGXTranslateStrings(input: string): Record<string, string> {
  const binPath = resolve(
    PROJECT_ROOT,
    'node_modules/.bin/ngx-translate-extract'
  );
  const tmpTarget = resolve(tmpdir(), 'ngx-extract.json');
  if (existsSync(tmpTarget)) rmSync(tmpTarget);
  const cmd = `${binPath} --input ${input} --output ${tmpTarget} --clean --sort --replace --format json`;
  spawnSync(cmd, { shell: true, stdio: 'inherit' });
  const extracted = readJSONSync(tmpTarget);
  rmSync(tmpTarget);
  return extracted;
}

function sortJsonByKey(json: Record<string, any>) {
  const sorted = {};
  for (const key of Object.keys(json).sort((a, b) =>
    a.toLowerCase() > b.toLowerCase() ? 1 : -1
  )) {
    sorted[key] = json[key];
  }
  return sorted;
}

if (require.main === module) {
  main();
}
