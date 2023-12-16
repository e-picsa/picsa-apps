import { readdirSync } from 'fs-extra';
import { resolve } from 'path';

import { ITranslationEntry } from '../types';
import { BUDGET_ENTRIES } from './budget';
import { CLIMATE_ENTRIES } from './climate';
import { COMMON_ENTRIES } from './common';

export const HARDCODED_DATA: ITranslationEntry[] = [...BUDGET_ENTRIES, ...CLIMATE_ENTRIES, ...COMMON_ENTRIES];

const PROJECT_ROOT = resolve(__dirname, '../../../../');

/** List of project paths and reference names to process with ngx-extract */
export const EXTRACTED_PROJECTS = [
  // tools
  ...readdirSync(resolve(PROJECT_ROOT, 'apps/picsa-tools'))
    .filter((project) => !project.endsWith('-e2e'))
    .map((project) => ({
      path: `apps/picsa-tools/${project}`,
      name: project.replace('-tool', ''),
    })),
  // additional apps to include
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
