import { IConfiguration } from '../types';

const configuration: IConfiguration.Settings = {
  id: 'zm',
  meta: { label: 'Zambia', image: 'assets/images/flags/zm.svg' },
  android: {},
  budgetTool: {
    currency: 'ZMK',
    currencyBaseValue: 10,
  },
  climateTool: {},
  localisation: {
    country: { label: 'Zambia', code: 'zm' },
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
