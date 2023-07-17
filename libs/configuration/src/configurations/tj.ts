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
        { id: 'tj', label: 'English', code: 'en' },
        { id: 'tj_tg', label: 'Тоҷикӣ', code: 'tj_tg' },
      ],
      selected: undefined,
    },
  },
  theme: 'picsa-tj',
};
export default configuration;
