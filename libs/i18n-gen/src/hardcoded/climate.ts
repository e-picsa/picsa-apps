import { ICountryCode } from '@picsa/data';
import { CLIMATE_CHART_DEFINITIONS } from '@picsa/data/climate/chart_definitions';
// eslint-disable-next-line @nx/enforce-module-boundaries
import type { IChartMeta } from '@picsa/models';

import type { ITranslationEntry } from '../types';

const entries: ITranslationEntry[] = [];

const { default: defaultDefs, ...allCountryDefs } = CLIMATE_CHART_DEFINITIONS;

const extractedKeys: (keyof IChartMeta)[] = ['definition'];

// populate per-country overrides of chart definitions
for (const chartId of Object.keys(defaultDefs)) {
  for (const key of extractedKeys) {
    for (const [countryCode, countryDefs] of Object.entries(allCountryDefs)) {
      const text = countryDefs[chartId]?.[key] || '';
      const id = `${countryCode}:climate.chart.${chartId}.${key}`;
      entries.push({
        id,
        text,
        tool: 'climate',
        country_code: countryCode as ICountryCode,
      });
    }
  }
}

export const CLIMATE_ENTRIES = entries;
