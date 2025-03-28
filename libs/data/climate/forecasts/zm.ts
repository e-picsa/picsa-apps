import { IForecastRow } from './types';

const seasonal: IForecastRow[] = [
  {
    id: 'c139d571-723c-4013-8246-28b0a291becf',
    country_code: 'zm',
    forecast_type: 'seasonal',
    storage_file: 'zm/forecasts/ZMD Seasonal forecast 2024-25.pdf',
    language_code: 'global_en',
    location: [],
    mimetype: 'application/pdf',
    created_at: '2024-10-14 18:12:29.879524+00',
    updated_at: '2024-10-14 18:12:29.879524+00',
  },
];

export const downscaled: IForecastRow[] = [
  {
    id: '8067b33b-dca9-47cc-9296-fb42b0ec5f54',
    country_code: 'zm',
    forecast_type: 'downscaled',
    language_code: 'zm_ny',
    location: ['eastern', 'chipata'],
    storage_file: 'zm/forecasts/downscaled/CINYANJA SEASONAL RAINFALL FORECAST YA CHIPATA DISTRICT 2024.pdf',
    created_at: '2024-10-25 09:59:27.62489+00',
    updated_at: '2024-10-25 09:59:27.62489+00',
    mimetype: 'application/pdf',
  },
  {
    id: '23938706-cea7-4c9e-b199-961d17b4be9a',
    country_code: 'zm',
    forecast_type: 'downscaled',
    language_code: 'zm_ny',
    location: ['eastern', 'petauke'],
    storage_file: 'zm/forecasts/downscaled/CINYANJA SEASONAL RAINFALL FORECAST YA PETAUKE DISTRICT 2024.pdf',
    created_at: '2024-10-25 09:59:30.722051+00',
    updated_at: '2024-10-25 09:59:30.722051+00',
    mimetype: 'application/pdf',
  },
  {
    id: '37b86bd1-f8a1-4709-8fd2-d2e6b8dc7294',
    country_code: 'zm',
    forecast_type: 'downscaled',
    language_code: 'global_en',
    location: ['eastern', 'chipata'],
    storage_file: 'zm/forecasts/downscaled/SEASONAL RAINFALL FORECAST FOR CHIPATA DISTRICT 2024.pdf',
    created_at: '2024-10-25 09:59:15.267263+00',
    updated_at: '2024-10-25 09:59:15.267263+00',
    mimetype: 'application/pdf',
  },
  {
    id: '9f4fd23f-d1c8-474f-aacc-f15d5aec4da9',
    country_code: 'zm',
    forecast_type: 'downscaled',
    language_code: 'global_en',
    location: ['eastern', 'petauke'],
    storage_file: 'zm/forecasts/downscaled/SEASONAL RAINFALL FORECAST FOR PETAUKE DISTRICT 2024.pdf',
    created_at: '2024-10-25 09:59:17.786206+00',
    updated_at: '2024-10-25 09:59:17.786206+00',
    mimetype: 'application/pdf',
  },
];

export default { seasonal, downscaled };
