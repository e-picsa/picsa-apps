import { IConfiguration } from '../types';

const configuration: IConfiguration.Settings = {
  id: 'zm',
  android: {},
  budgetTool: {
    currency: 'ZMK',
    currencyBaseValue: 10,
  },
  climateTool: {},
  localisation: {
    country: {
      label: 'Zambia',
      code: 'zm',
      image: 'assets/images/flags/zm.svg',
    },
    language: {
      options: [
        { id: 'en', label: 'English', code: 'en' },
        { id: 'ny', label: 'Chichewa', code: 'ny' },
      ],
      selected: undefined,
    },
  },
  theme: 'picsa-zm',
};
export default configuration;
