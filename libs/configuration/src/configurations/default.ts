import { IConfiguration } from '../types';

const configuration: IConfiguration.Settings = {
  id: '',
  meta: { label: '', image: '' },
  android: {},
  budgetTool: {},
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
