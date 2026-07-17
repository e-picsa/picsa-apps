import type { ICountryCode } from '@picsa/data';
import { CLIMATE_CHART_DEFINITIONS } from '@picsa/data/climate/chart_definitions';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { IChartMeta } from '@picsa/models';

import type { ITranslationEntry } from '../types';

const entries = new Map<string, ITranslationEntry>();

const { default: defaultDefs, ...allCountryDefs } = CLIMATE_CHART_DEFINITIONS;

const extractedKeys: (keyof IChartMeta)[] = ['definition', 'name', 'shortname', 'xLabel', 'yLabel'];

// populate default entries
for (const [defId, def] of Object.entries(defaultDefs)) {
  for (const key of extractedKeys) {
    const value = def[key];
    if (typeof value === 'string') {
      const id = `climate:chart:${defId}:${key}`;
      entries.set(id, {
        text: value,
        tool: 'climate',
      });
    }
  }
}

// assign country overrides
for (const [countryCode, countryDefs] of Object.entries(allCountryDefs)) {
  for (const [defId, def] of Object.entries(countryDefs)) {
    for (const key of extractedKeys) {
      const value = def[key];
      if (typeof value === 'string') {
        const id = `climate:chart:${defId}:${key}`;
        const entry = entries.get(id);
        if (entry && entry.text !== value) {
          entries.set(id, {
            id,
            text: entry.text,
            tool: 'climate',
            overrides: {
              ...(entry.overrides || {}),
              [countryCode as ICountryCode]: value,
            },
          });
        }
      }
    }
  }
}

export const CLIMATE_ENTRIES = Array.from(entries.values());
