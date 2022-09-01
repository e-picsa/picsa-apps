import { IConfiguration } from '../types';

const configuration: IConfiguration.Settings = {
  id: 'zm',
  meta: { label: 'Zambia', image: 'assets/images/flags/zm.svg' },
  android: {},
  budgetTool: {},
  climateTool: {},
  localisation: {
    country: { label: 'Zambia', code: 'zm' },
    language: {
      options: [{ id: 'en', label: 'English', code: 'en' }],
      selected: undefined,
    },
  },
  theme: '',
};
export default configuration;
