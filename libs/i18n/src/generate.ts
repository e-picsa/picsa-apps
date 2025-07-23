import { jsonToCSV } from '@picsa/utils/data';
import { spawnSync } from 'child_process';
import { emptyDirSync, ensureDirSync, existsSync, readJSONSync, rmSync, writeFileSync } from 'fs-extra';
import { tmpdir } from 'os';
import { resolve } from 'path';

import { EXTRACTED_PROJECTS, HARDCODED_DATA } from './hardcoded';
import type { ITranslationEntry } from './types';

const I18N_DIR = resolve(__dirname, '../');
const PROJECT_ROOT = resolve(I18N_DIR, '../../');
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
  for (const { path, tool, context } of EXTRACTED_PROJECTS) {
    const extracted = generateNGXTranslateStrings(resolve(PROJECT_ROOT, path));
    for (const key of Object.keys(extracted)) {
      entries.push(stringToTranslationEntry(key, tool, context));
    }
  }
  // Process hardcoded entries (will take priority over generated)
  for (const entry of HARDCODED_DATA) {
    entries.push(entry);
  }
  // sort and remove duplicates
  const ordered = entries
    .filter(({ text }) => text !== '')
    .sort((a, b) => {
      // context priority
      let aScore = 0;
      let bScore = 0;
      if (a.context) aScore += 100;
      if (b.context) bScore += 100;
      if (a.tool !== 'common') aScore += 10;
      if (b.tool !== 'common') bScore += 10;
      return aScore > bScore ? 1 : -1;
    });
  const unique: Record<string, ITranslationEntry> = {};
  // as entries will be sorted by lowest to highest score simply
  // allow higher score to override lower and form unique list
  for (const el of ordered) {
    unique[el.text] = el;
  }
  const output = Object.values(unique);
  writeOutputJson(output);
  // write output csv
  const headers: (keyof ITranslationEntry)[] = ['tool', 'context', 'text'];
  const csv = jsonToCSV(output, headers);
  const target = resolve(GENERATED_TEMPLATES_DIR, `_template.csv`);
  writeFileSync(target, csv);

  console.log('Templates generated', GENERATED_TEMPLATES_DIR);
  console.log('Assets generated', GENERATED_ASSETS_DIR);
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

if (require.main === module) {
  main();
}
