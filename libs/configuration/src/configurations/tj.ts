import { IConfiguration } from '../types';

const configuration: IConfiguration.Settings = {
  id: 'tj',
  android: {},
  budgetTool: {
    currency: 'TJS',
    currencyBaseValue: 10,
  },
  climateTool: {},
  localisation: {
    country: {
      label: 'Tajikistan',
      code: 'tj',
      image: 'assets/images/flags/tj.svg',
    },
    language: {
      options: [
        { id: 'en', label: 'English', code: 'en' },
        { id: 'tg', label: 'Тоҷикӣ', code: 'tg' },
      ],
      selected: undefined,
    },
  },
  theme: 'picsa-tj',
};
export default configuration;
