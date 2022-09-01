import { IConfiguration } from '../types';

const configuration: IConfiguration.Settings = {
  id: 'mw',
  meta: { label: 'Malawi', image: 'assets/images/flags/mw.svg' },
  android: {},
  budgetTool: {},
  climateTool: {},
  localisation: {
    country: { label: 'Malawi', code: 'mw' },
    language: {
      options: [
        { id: 'en', label: 'English', code: 'en' },
        { id: 'ny', label: 'Chichewa', code: 'ny' },
      ],
      selected: undefined,
    },
  },
  theme: '',
};
export default configuration;
