import { IResourceFile } from '../../schemas';

interface IDownscaledForecast extends IResourceFile {
  meta: {
    locationId: string;
  };
}

export const DOWNSCALED_FORECASTS: Record<string, IDownscaledForecast> = {
  downscaled_forecast_kasungu_en: {
    id: 'downscaled_forecast_kasungu_en',
    description: '',
    filename: 'forecast-kasungu-english.pdf',
    mimetype: 'application/pdf',
    title: 'KASUNGU DISTRICT DOWNSCALED SEASONAL FORECAST, 2022-2023',
    type: 'file',
    url: 'https://firebasestorage.googleapis.com/v0/b/picsa-apps.appspot.com/o/weather%2Fforecast-kasungu-english.pdf?alt=media&token=bbb710a6-4854-4f0c-8447-cf919fef1061',
    size_kb: 1084.1,
    md5Checksum: '95aa01cddb75d06725a7cd3904334043',
    filter: { countries: ['mw'] },
    language: 'en',
    meta: {
      locationId: 'Malawi_Kasungu',
    },
  },
  downscaled_forecast_kasungu_ny: {
    id: 'downscaled_forecast_kasungu_ny',
    description: '',
    filename: 'forecast-kasungu-chichewa.pdf',
    mimetype: 'application/pdf',
    title: 'ULOSI WA KAGWEDWE KA MVULA M’BOMA LA KASUNGU M’DZINJA LA 2022-2023',
    type: 'file',
    url: 'https://firebasestorage.googleapis.com/v0/b/picsa-apps.appspot.com/o/weather%2Fforecast-kasungu-chichewa.pdf?alt=media&token=c8353b9b-0a1a-4a5e-8df0-8ffc136cc38c',
    size_kb: 1085.3,
    md5Checksum: '9de79ed0fdd77bb202c5716ce3e8d11c',
    filter: { countries: ['mw'] },
    language: 'ny',
    meta: {
      locationId: 'Malawi_Kasungu',
    },
  },
  downscaled_forecast_nkhotakota_en: {
    id: 'downscaled_forecast_nkhotakota_en',
    description: '',
    filename: 'forecast-nkhotakota-english.pdf',
    mimetype: 'application/pdf',
    title: 'NKHOTAKOTA DISTRICT DOWNSCALED SEASONAL FORECAST, 2022-2023',
    type: 'file',
    url: 'https://firebasestorage.googleapis.com/v0/b/picsa-apps.appspot.com/o/weather%2Fforecast-nkhotakota-english.pdf?alt=media&token=c642c01b-a94d-4953-a16a-d375db9f642a',
    size_kb: 702.4,
    md5Checksum: '98c2332a4d83d251725fdccc83af1826',
    filter: { countries: ['mw'] },
    language: 'en',
    meta: {
      locationId: 'Malawi_Nkhotakota',
    },
  },
  downscaled_forecast_nkhotakota_ny: {
    id: 'downscaled_forecast_nkhotakota_ny',
    description: '',
    filename: 'forecast-nkhotakota-chichewa.pdf',
    mimetype: 'application/pdf',
    title: 'ULOSI WA KAGWEDWE KA MVULA M’BOMA LA NKHOTAKOTA M’DZINJA LA 2022-2023',
    type: 'file',
    url: 'https://firebasestorage.googleapis.com/v0/b/picsa-apps.appspot.com/o/weather%2Fforecast-nkhotakota-chichewa.pdf?alt=media&token=04b95abf-a78c-4752-b2b7-a6f42149b492',
    size_kb: 742.9,
    md5Checksum: '359f9e0df76b4887befcca129b502dc1',
    filter: { countries: ['mw'] },
    language: 'ny',
    meta: {
      locationId: 'Malawi_Nkhotakota',
    },
  },
};
