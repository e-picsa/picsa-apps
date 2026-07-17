import { CLIMATE_CHART_DEFINITIONS } from '@picsa/data/climate/chart_definitions';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { IChartMeta } from '@picsa/models';

import type { ITranslationEntry } from '../types';

const entries = new Map<string, ITranslationEntry>();

const { default: defaultDefs, ...allCountryDefs } = CLIMATE_CHART_DEFINITIONS;

const extractedKeys: (keyof IChartMeta)[] = ['definition'];

// populate default entries
for (const chartId of Object.keys(defaultDefs)) {
  for (const key of extractedKeys) {
    const id = `climate:chart:${chartId}:${key}`;
    const overrides = {};
    // get country overrides
    for (const [countryCode, countryDefs] of Object.entries(allCountryDefs)) {
      overrides[countryCode] = countryDefs[chartId]?.[key];
    }

    entries.set(id, {
      id,
      text: '',
      tool: 'climate',
      overrides,
    });
  }
}

export const CLIMATE_ENTRIES = Array.from(entries.values());
