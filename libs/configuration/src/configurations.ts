import type { IConfiguration } from './types';

// TODO - additional configs will likely need deep-clone and then modifications

// const malawi: IConfiguration = {
//   ...defaultConfiguration('malawi'),
// };

// const zambia: IConfiguration = {
//   ...defaultConfiguration('zambia'),
// };

const global: IConfiguration = {
  id: 'global',
  android: {
    appId: '',
  },
  budgetTool: {},
  climateTool: {},
  localisation: {
    options: [
      {
        country: { label: 'Global', code: 'global' },
        languages: [{ label: 'English', code: 'en' }],
      },
      {
        country: { label: 'Malawi', code: 'mw' },
        languages: [
          { label: 'English', code: 'en' },
          { label: 'Chichewa', code: 'ny' },
        ],
      },
      {
        country: { label: 'Zambia', code: 'zm' },
        languages: [{ label: 'English', code: 'en' }],
      },
    ],
  },
  theme: {},
  userSettings: {
    localisation: ['global', 'en'],
  },
};

/** Configurations define different environments that can be set at runtime */
export const CONFIGURATIONS = {
  global,
  // malawi,
  // zambia,
};
