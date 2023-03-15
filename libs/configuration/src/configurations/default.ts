import { IConfiguration } from '../types';

const configuration: IConfiguration.Settings = {
  id: '',
  android: {},
  budgetTool: {
    currency: '$',
    currencyBaseValue: 1,
  },
  climateTool: {},
  localisation: {
    country: { label: '', code: '', image: '' },
    language: {
      options: [],
      selected: undefined,
    },
  },
  theme: '',
};
export default configuration;
