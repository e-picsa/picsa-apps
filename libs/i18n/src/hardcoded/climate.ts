import { CHART_TYPES } from '@picsa/climate/src/app/data';
import type { ITranslationEntry } from '../types';

const entries: ITranslationEntry[] = [];

for (const el of CHART_TYPES) {
  entries.push({ text: el.name, tool: 'climate', context: 'chart' });
  entries.push({ text: el.yLabel, tool: 'climate', context: 'chart' });
  entries.push({ text: el.definition, tool: 'climate', context: 'chart' });
}

export const CLIMATE_ENTRIES = entries;
