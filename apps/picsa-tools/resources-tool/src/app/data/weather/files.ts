import { IResourceFile } from '../../schemas';

interface IDownscaledForecast extends IResourceFile {
  meta: {
    locationId: string;
  };
}

export const DOWNSCALED_FORECASTS: Record<string, IDownscaledForecast> = {
  downscaled_forecast_2023_kasungu_en: {
    id: 'downscaled_forecast_2023_kasungu_en',
    description: '',
    filename: 'forecast-kasungu-english.pdf',
    mimetype: 'application/pdf',
    title: 'KASUNGU DISTRICT DOWNSCALED SEASONAL FORECAST, 2023-2024',
    type: 'file',
    subtype: 'pdf',
    url: 'https://firebasestorage.googleapis.com/v0/b/picsa-apps.appspot.com/o/weather%2FSeasonal%20Forecasts%2FKASUNGU_English_Poster_2023_2024_compressed.pdf?alt=media&token=79f46884-e20e-45fd-b2f1-aa096c4e61db',
    size_kb: 356,
    md5Checksum: '1e9d080d9395f14687100191e75a02f0',
    filter: { countries: ['mw'] },
    language: 'en',
    meta: {
      locationId: 'Malawi_Kasungu',
    },
  },
  downscaled_forecast_2023_kasungu_ny: {
    id: 'downscaled_forecast_2023_kasungu_ny',
    description: '',
    filename: 'forecast-kasungu-chichewa.pdf',
    mimetype: 'application/pdf',
    title: 'ULOSI WA KAGWEDWE KA MVULA M’BOMA LA KASUNGU M’DZINJA LA 2023-2024',
    type: 'file',
    subtype: 'pdf',
    url: 'https://firebasestorage.googleapis.com/v0/b/picsa-apps.appspot.com/o/weather%2FSeasonal%20Forecasts%2FKASUNGU_Chichewa_Poster_2023_2024_compressed.pdf?alt=media&token=18da5ae1-09dc-4224-b742-0e555cf584fe',
    size_kb: 381.4,
    md5Checksum: '5e9c7141d11bc6fab0c113487e46d410',
    filter: { countries: ['mw'] },
    language: 'ny',
    meta: {
      locationId: 'Malawi_Kasungu',
    },
  },
  downscaled_forecast_2023_nkhotakota_en: {
    id: 'downscaled_forecast_2023_nkhotakota_en',
    description: '',
    filename: 'forecast-nkhotakota-english.pdf',
    mimetype: 'application/pdf',
    title: 'NKHOTAKOTA DISTRICT DOWNSCALED SEASONAL FORECAST, 2023-2024',
    type: 'file',
    subtype: 'pdf',
    url: 'https://firebasestorage.googleapis.com/v0/b/picsa-apps.appspot.com/o/weather%2FSeasonal%20Forecasts%2FNKHOTAKOTA_English_Poster_2023_2024_compressed.pdf?alt=media&token=0b2b4317-4c0a-44f5-a681-ce10b45af841',
    size_kb: 396.2,
    md5Checksum: 'b6221f1f62791e9110471b2ed04b9954',
    filter: { countries: ['mw'] },
    language: 'en',
    meta: {
      locationId: 'Malawi_Nkhotakota',
    },
  },
  downscaled_forecast_2023_nkhotakota_ny: {
    id: 'downscaled_forecast_2023_nkhotakota_ny',
    description: '',
    filename: 'forecast-nkhotakota-chichewa.pdf',
    mimetype: 'application/pdf',
    title: 'ULOSI WA KAGWEDWE KA MVULA M’BOMA LA NKHOTAKOTA M’DZINJA LA 2023-2024',
    type: 'file',
    subtype: 'pdf',
    url: 'https://firebasestorage.googleapis.com/v0/b/picsa-apps.appspot.com/o/weather%2FSeasonal%20Forecasts%2FNKHOTAKOTA_Chichewa_Poster_2023_2024_compressed.pdf?alt=media&token=2e4d14cf-2e82-48ac-9222-e8020791c50b',
    size_kb: 416.1,
    md5Checksum: '70a8fb7adb64982e630d4d3890880c72',
    filter: { countries: ['mw'] },
    language: 'ny',
    meta: {
      locationId: 'Malawi_Nkhotakota',
    },
  },
};
