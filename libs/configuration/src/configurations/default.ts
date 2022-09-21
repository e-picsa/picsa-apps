import { IConfiguration } from '../types';

const configuration: IConfiguration.Settings = {
  id: '',
  meta: { label: '', image: '' },
  android: {},
  budgetTool: {
    currency: '$',
    currencyBaseValue: 1,
  },
  climateTool: {},
  localisation: {
    country: { label: '', code: '' },
    language: {
      options: [],
      selected: undefined,
    },
  },
  theme: '',
};
export default configuration;
