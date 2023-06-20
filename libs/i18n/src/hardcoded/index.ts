import { ITranslationEntry } from '../types';
import { BUDGET_ENTRIES } from './budget';
import { CLIMATE_ENTRIES } from './climate';
import { COMMON_ENTRIES } from './common';

export const HARDCODED_DATA: ITranslationEntry[] = [...BUDGET_ENTRIES, ...CLIMATE_ENTRIES, ...COMMON_ENTRIES];

/** List of project paths and reference names to process with ngx-extract */
export const EXTRACTED_PROJECTS = [
  // tools
  {
    path: 'apps/picsa-tools/budget-tool',
    name: 'budget',
  },
  {
    path: 'apps/picsa-tools/climate-tool',
    name: 'climate',
  },
  {
    path: 'apps/picsa-tools/manual-tool',
    name: 'manual',
  },
  {
    path: 'apps/picsa-tools/monitoring-tool',
    name: 'monitoring',
  },
  {
    path: 'apps/picsa-tools/option-tool',
    name: 'option',
  },
  {
    path: 'apps/picsa-tools/resources-tool',
    name: 'resources',
  },
  // apps
  {
    path: 'apps/picsa-apps/extension-app',
    name: 'extension',
  },
  // libs
  {
    path: 'libs',
    name: 'common',
  },
];
