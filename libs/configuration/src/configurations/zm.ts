import { IConfiguration } from '../types';

const configuration: IConfiguration.Settings = {
  id: 'zm',
  meta: { label: 'Zambia', image: 'assets/images/flags/zm.svg' },
  android: {},
  budgetTool: {},
  climateTool: {
    stationFilter: (station: any) => station.country === 'Zambia',
  },
  localisation: {
    country: { label: 'Zambia', code: 'zm' },
    language: {
      options: [{ id: 'en', label: 'English', code: 'en' }],
      selected: undefined,
    },
  },
  theme: 'picsa-zm',
};
export default configuration;
