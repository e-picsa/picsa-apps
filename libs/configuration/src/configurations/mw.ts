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
        { id: 'mw', label: 'English', code: 'en' },
        { id: 'mw_ny', label: 'Chichewa', code: 'mw_ny' },
      ],
      selected: undefined,
    },
  },
  theme: 'picsa-mw',
};
export default configuration;
