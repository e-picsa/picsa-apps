import { IConfiguration } from '../types';

const configuration: IConfiguration.Settings = {
  id: 'mw',
  android: {},
  budgetTool: {
    currency: 'MK',
    currencyBaseValue: 10000,
  },
  climateTool: {},
  localisation: {
    country: {
      label: 'Malawi',
      code: 'mw',
      image: 'assets/images/flags/mw.svg',
    },
    language: {
      options: [
        { id: 'en', label: 'English', code: 'en' },
        { id: 'ny', label: 'Chichewa', code: 'ny' },
      ],
      selected: undefined,
    },
  },
  theme: 'picsa-mw',
};
export default configuration;
