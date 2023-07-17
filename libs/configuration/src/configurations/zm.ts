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
        { id: 'zm_en', label: 'English', code: 'zm_en' },
        { id: 'zm_ny', label: 'Chichewa', code: 'zm_ny' },
      ],
      selected: undefined,
    },
  },
  theme: 'picsa-zm',
};
export default configuration;
