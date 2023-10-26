import { IResourceFile } from '../../schemas';

interface IDownscaledForecast extends IResourceFile {
  meta: {
    locationIds: string[];
  };
}

const downscaledForecasts: Record<string, IDownscaledForecast> = {
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
      locationIds: ['Malawi_Kasungu'],
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
      locationIds: ['Malawi_Kasungu'],
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
      locationIds: ['Malawi_Nkhotakota'],
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
      locationIds: ['Malawi_Nkhotakota'],
    },
  },
  seasonal_forecast_2023_chipata: {
    id: 'seasonal_forecast_2023_chipata',
    description: '',
    filename: 'Chipata_Seasonal_Forecast_2023_compressed.pdf',
    mimetype: 'application/pdf',
    title: 'Seasonal Forecast Chipata 2023',
    type: 'file',
    subtype: 'pdf',
    url: 'https://firebasestorage.googleapis.com/v0/b/picsa-apps.appspot.com/o/weather%2FSeasonal%20Forecasts%2FChipata_Seasonal_Forecast_2023_compressed.pdf?alt=media&token=7b0eef18-7352-4340-b1dc-7d3d3887deb1',
    size_kb: 264.5,
    md5Checksum: 'e518fb9173765a36e7d82bb4ae3577d9',
    filter: { countries: ['zm'] },
    language: 'en',
    meta: {
      locationIds: ['Zambia_Chipata'],
    },
  },
  seasonal_forecast_2023_petauke: {
    id: 'seasonal_forecast_2023_petauke',
    description: '',
    filename: 'Petauke_Seasonal_Forecast_2023_compressed.pdf',
    mimetype: 'application/pdf',
    title: 'Seasonal Forecast Petauke 2023',
    type: 'file',
    subtype: 'pdf',
    url: 'https://firebasestorage.googleapis.com/v0/b/picsa-apps.appspot.com/o/weather%2FSeasonal%20Forecasts%2FPetauke_Seasonal_Forecast_2023_compressed.pdf?alt=media&token=a6d05f21-a89d-45c5-bc19-cea3e549ba52',
    size_kb: 259.5,
    md5Checksum: '3cbbd07e607443e5a0c6bc0d302225f7',
    filter: { countries: ['zm'] },
    language: 'en',
    meta: {
      locationIds: ['Zambia_Petauke'],
    },
  },
};

const otherForecasts: Record<string, IDownscaledForecast> = {
  rainfall_forecast_2023_zm: {
    id: 'rainfall_forecast_2023_zm',
    description: '',
    filename: 'Zambia_Rainfall_Forecast_2023_2024_compressed.pdf',
    mimetype: 'application/pdf',
    title: 'RAINFALL FORECAST 2023/2024 SEASON',
    type: 'file',
    subtype: 'pdf',
    url: 'https://firebasestorage.googleapis.com/v0/b/picsa-apps.appspot.com/o/weather%2FSeasonal%20Forecasts%2FZambia_Rainfall_Forecast_2023_2024_compressed.pdf?alt=media&token=21afe2eb-e809-42ac-a187-085ea8217cfd',
    size_kb: 463.1,
    md5Checksum: 'a7a9ac7d24d79177208dc2539eed07b8',
    filter: { countries: ['zm'] },
    language: 'en',
    meta: {
      locationIds: ['Zambia_Petauke', 'Zambia_Chipata'],
    },
  },
  rainfall_forecast_2023_zm_ny: {
    id: 'rainfall_forecast_2023_zm_ny',
    description: '',
    filename: 'Zambia_Chinyanja_Rainfall_Forecast_2023_2024.pdf',
    mimetype: 'application/pdf',
    title: 'KULOZERA ZA NYENGO YA MVULA YA CAKA CA 2023/2024',
    type: 'file',
    subtype: 'pdf',
    url: 'https://firebasestorage.googleapis.com/v0/b/picsa-apps.appspot.com/o/weather%2FSeasonal%20Forecasts%2FZambia_Chinyanja_Rainfall_Forecast_2023_2024.pdf?alt=media&token=d700185e-b833-47b1-95a9-bc1e83d13bc9',
    size_kb: 500.3,
    md5Checksum: '76a01e3a99ff0abca5708bd020c3b5bf',
    filter: { countries: ['zm'] },
    language: 'ny',
    meta: {
      locationIds: ['Zambia_Petauke', 'Zambia_Chipata'],
    },
  },
};

export default { downscaledForecasts, otherForecasts };
