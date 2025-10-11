import { IForecastRow } from './types';

const seasonal: IForecastRow[] = [
  {
    id: 'c139d571-723c-4013-8246-28b0a291becf',
    country_code: 'zm',
    forecast_type: 'seasonal',
    label: '2025 - 2026',
    storage_file: 'zm/forecasts/ZMD Seasonal forecast 2025-26.pdf',
    language_code: 'global_en',
    location: [],
    mimetype: 'application/pdf',
    created_at: '2024-10-14 18:12:29.879524+00',
    updated_at: '2024-10-14 18:12:29.879524+00',
  },
];

export const downscaled: IForecastRow[] = [
  {
    id: 'zmd-downscaled-eastern-2025-26.nya.pdf',
    country_code: 'zm',
    forecast_type: 'downscaled',
    label: '2025 - 2026',
    language_code: 'zm_ny',
    location: ['eastern'],
    storage_file: 'zm/forecasts/downscaled/2025-26/zmd-downscaled-eastern-2025-26.nya.pdf',
    created_at: '',
    updated_at: '',
    mimetype: 'application/pdf',
  },
];

export default { seasonal, downscaled };
