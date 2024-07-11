// eslint-disable-next-line @nx/enforce-module-boundaries
import DEFAULT_DEFINITIONS from '@picsa/data/climate/chart_definitions/default';

import type { ITranslationEntry } from '../types';

const entries: ITranslationEntry[] = [];
const definitions = Object.values(DEFAULT_DEFINITIONS());

for (const el of definitions) {
  entries.push({ text: el.name, tool: 'climate', context: 'chart' });
  entries.push({ text: el.shortname, tool: 'climate', context: 'chart' });
  entries.push({ text: el.yLabel, tool: 'climate', context: 'chart' });
  entries.push({ text: el.definition, tool: 'climate', context: 'chart' });
}

export const CLIMATE_ENTRIES = entries;
