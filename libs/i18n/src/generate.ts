import { arrayToHashmap, jsonToCSV } from '@picsa/utils/data';
import { spawnSync } from 'child_process';
import {
  emptyDirSync,
  ensureDirSync,
  existsSync,
  readdirSync,
  readJSONSync,
  readJsonSync,
  rmSync,
  writeFileSync,
} from 'fs-extra';
import { tmpdir } from 'os';
import { resolve } from 'path';

import { EXTRACTED_PROJECTS, HARDCODED_DATA } from './hardcoded';
import type { ITranslationEntry } from './types';

const I18N_DIR = resolve(__dirname, '../');
const PROJECT_ROOT = resolve(I18N_DIR, '../../');
const SOURCE_STRINGS_DIR = resolve(I18N_DIR, 'source');
const GENERATED_ASSETS_DIR = resolve(I18N_DIR, 'assets');
const GENERATED_TEMPLATES_DIR = resolve(I18N_DIR, 'templates');
const TEMPLATE_PATH = resolve(GENERATED_TEMPLATES_DIR, `_template.json`);

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
  const entries: ITranslationEntry[] = [];
  // Process ngx-translate extraction
  for (const { name, path } of EXTRACTED_PROJECTS) {
    const extracted = generateNGXTranslateStrings(resolve(PROJECT_ROOT, path));
    for (const key of Object.keys(extracted)) {
      entries.push(stringToTranslationEntry(key, name));
    }
  }
  // Process hardcoded entries (will take priority over generated)
  for (const entry of HARDCODED_DATA) {
    entries.push(entry);
  }
  // sort and remove duplicates
  const unique = Object.values(arrayToHashmap(entries, 'text')).filter(({ text }) => text !== '');
  const sorted = unique.sort((a, b) => {
    const comparator = `${a.tool}-${a.context}-${a.text}` > `${b.tool}-${b.context}-${b.text}`;
    return comparator ? 1 : -1;
  });
  writeOutputJson(sorted);
  // write output csv
  const headers: (keyof ITranslationEntry)[] = ['tool', 'context', 'text'];
  const csv = jsonToCSV(sorted, headers);
  const target = resolve(GENERATED_TEMPLATES_DIR, `_template.csv`);
  writeFileSync(target, csv);

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
      const translation = translations[text];
      if (translation) {
        translated[text] = translations[text];
      } else {
        // use marker to show non-translated version fallback
        translated[text] = `•${text}•`;
        untranslated[text] = '';
      }
    }
    const outputTarget = resolve(GENERATED_ASSETS_DIR, `${code}.json`);
    const outputTranslations = {
      // Omit missing translations
      // ...sortJsonByKey(untranslated),
      ...sortJsonByKey(translated),
    };
    writeFileSync(outputTarget, JSON.stringify(outputTranslations, null, 2));
  }
}

function stringToTranslationEntry(text: string, tool: string, context?: string) {
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
  const enJsonPath = resolve(GENERATED_ASSETS_DIR, 'global_en.json');
  for (const { text } of Object.values(entries)) {
    enJson[text] = text;
  }
  writeFileSync(enJsonPath, JSON.stringify(enJson, null, 2));
}

/**
 * Export a list of all strings referenced in @vendure/ngx-translate-extract
 * https://github.com/vendure-ecommerce/ngx-translate-extract
 * */
function generateNGXTranslateStrings(input: string): Record<string, string> {
  const binPath = resolve(PROJECT_ROOT, 'node_modules/.bin/ngx-translate-extract');
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
  for (const key of Object.keys(json).sort((a, b) => (a.toLowerCase() > b.toLowerCase() ? 1 : -1))) {
    sorted[key] = json[key];
  }
  return sorted;
}

if (require.main === module) {
  main();
}
