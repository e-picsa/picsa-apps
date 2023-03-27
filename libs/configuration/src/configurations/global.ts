import { IConfiguration } from '../types';

const configuration: IConfiguration.Settings = {
  id: 'demo',
  android: {},
  budgetTool: {
    currency: '$',
    currencyBaseValue: 1,
  },
  climateTool: {
    // include all stations
    stationFilter: () => true,
  },

  localisation: {
    country: {
      label: 'Global',
      code: '',
      image: 'assets/images/flags/global.svg',
    },
    language: {
      options: [
        { id: 'en', label: 'English', code: 'en' },
        { id: 'ny', label: 'Chichewa', code: 'ny' },
        { id: 'tg', label: 'Тоҷикӣ', code: 'tg' },
      ],
      selected: undefined,
    },
  },
  theme: 'picsa-global',
};
export default configuration;
