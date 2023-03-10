import { spawnSync } from 'child_process';
import {
  existsSync,
  readJSONSync,
  readJsonSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'fs-extra';
import { tmpdir } from 'os';
import { resolve } from 'path';
import * as DATA from './hardcoded';
import { ITranslationEntry } from './types';

const I18N_DIR = resolve(__dirname, '../');
const PROJECT_ROOT = resolve(__dirname, '../..');
const TEMPLATE_PATH = resolve(I18N_DIR, 'generated', `_template.json`);

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
  generateTranslationTemplates();
  generateLanguageFiles();
}

function generateTranslationTemplates() {
  const entries: ITranslationEntry[] = [
    ...DATA.BUDGET_ENTRIES,
    ...DATA.CLIMATE_ENTRIES,
    // TODO - resources, monitoring etc.
  ];
  for (const name of EXTRACTED_TOOLS) {
    const extracted = generateNGXTranslateStrings(
      `./apps/picsa-tools/${name}-tool`
    );
    for (const key of Object.keys(extracted)) {
      entries.push(stringToTranslationEntry(key, name));
    }
  }
  const common = generateNGXTranslateStrings('libs');
  for (const key of Object.keys(common)) {
    entries.push(stringToTranslationEntry(key, 'common'));
  }

  const sorted = entries.sort((a, b) => {
    if (a.tool === b.tool) return `${a.context}` > `${b.context}` ? 1 : -1;
    return a.tool > b.tool ? 1 : -1;
  });
  writeOutputJson(sorted);
  writeOutputCSV(sorted);
}

function generateLanguageFiles() {
  const entries: ITranslationEntry[] = readJsonSync(TEMPLATE_PATH);

  const translationsDir = resolve(I18N_DIR, 'translations');
  const translatedFiles = readdirSync(translationsDir).map((name) => ({
    filePath: resolve(translationsDir, name),
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
    const outputTarget = resolve(I18N_DIR, 'generated', `${code}.json`);
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
}

/** Convert json to csv and output (adapted from https://stackoverflow.com/a/31536517) */
function writeOutputCSV(entries: ITranslationEntry[]) {
  const target = resolve(I18N_DIR, 'generated', `_template.csv`);
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
