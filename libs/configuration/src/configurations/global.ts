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
        { id: 'mw_ny', label: 'Chichewa', code: 'mw_ny' },
        { id: 'zm_ny', label: 'Chichewa', code: 'zm_ny' },
        { id: 'tg', label: 'Тоҷикӣ', code: 'tg' },
        // Additional language available to debug text marked for translators
        // Marked text will appear as •{text}•
        { id: 'debug', label: 'Translators', code: 'debug' },
      ],
      selected: undefined,
    },
  },
  theme: 'picsa-global',
};
export default configuration;
