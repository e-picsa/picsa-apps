import { IConfiguration } from '../types';

const configuration: IConfiguration.Settings = {
  id: 'mw',
  meta: { label: 'Malawi', image: 'assets/images/flags/mw.svg' },
  android: {},
  budgetTool: {
    currency: 'MK',
    currencyBaseValue: 10000,
  },
  climateTool: {},
  localisation: {
    country: { label: 'Malawi', code: 'mw' },
    language: {
      options: [
        { id: 'en', label: 'English', code: 'en' },
        { id: 'ny', label: 'Chichewa', code: 'ny' },
      ],
      selected: undefined,
    },
  },
  theme: 'picsa-default',
};
export default configuration;
