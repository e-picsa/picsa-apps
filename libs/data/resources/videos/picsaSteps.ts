import { arrayToHashmap } from '@picsa/utils';
import { IPicsaVideoData } from '../types';

type IPicsaFarmerVideoId =
  | 'intro'
  | 'ram'
  | 'seasonal_calendar'
  | 'historic_climate'
  | 'probability_risk'
  | 'options'
  | 'participatory_budget'
  | 'seasonal_forecast'
  | 'short_term_forecast';

const PICSA_FARMER_VIDEOS_BASE: Record<IPicsaFarmerVideoId, Omit<IPicsaVideoData, 'id'>> = {
  intro: {
    children: [
      {
        id: '',
        locale_codes: ['mw_ny', 'global_en'],
        resolution: '360p',
        size_kb: 15790,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/mw/videos/PICSA%20Malawi%20Intro%202025.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_ny', 'global_en'],
        resolution: '360p',
        size_kb: 15960,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Zambia%20Intro%202025.mp4',
      },
    ],
  },
  ram: {
    children: [
      {
        id: '',
        locale_codes: ['global_en'],
        size_kb: 14840,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/global/videos/PICSA%20Steps/1a%20%20Resource%20Allocation%20Map.mp4',
      },
      {
        id: '',
        locale_codes: ['mw_ny'],
        size_kb: 18910,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/mw/videos/PICSA%20Steps/1a%20Resource%20Allocation%20Map.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_ny'],
        size_kb: 17710,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/1a%20Resource%20Allocation%20Map.mp4',
      },
    ],
  },
  seasonal_calendar: {
    children: [
      {
        id: '',
        locale_codes: ['global_en'],
        size_kb: 12950,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/global/videos/PICSA%20Steps/1b%20%20Seasonal%20Calendar.mp4',
      },
      {
        id: '',
        locale_codes: ['mw_ny'],
        size_kb: 16780,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/mw/videos/PICSA%20Steps/1b%20Seasonal%20Calendar.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_ny'],
        size_kb: 15300,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/1b%20Seasonal%20Calendar.mp4',
      },
    ],
  },
  historic_climate: {
    children: [
      {
        id: '',
        locale_codes: ['global_en'],
        size_kb: 20710,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/global/videos/PICSA%20Steps/2%20%20Historical%20Climate%20Information.mp4',
      },
      {
        id: '',
        locale_codes: ['mw_ny'],
        size_kb: 31310,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/mw/videos/PICSA%20Steps/2%20Historical%20Climate%20Information.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_ny'],
        size_kb: 26490,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/2%20Historical%20Climate%20Information.mp4',
      },
    ],
  },
  probability_risk: {
    children: [
      {
        id: '',
        locale_codes: ['global_en'],
        size_kb: 20800,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/global/videos/PICSA%20Steps/3%20%20What%20are%20the%20risks%20and%20opportunities.mp4',
      },
      {
        id: '',
        locale_codes: ['mw_ny'],
        size_kb: 29280,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/mw/videos/PICSA%20Steps/3%20What%20are%20the%20risks%20and%20opportunities.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_ny'],
        size_kb: 25200,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/3%20What%20are%20the%20risks%20and%20opportunities.mp4',
      },
    ],
  },
  options: {
    children: [
      {
        id: '',
        locale_codes: ['global_en'],
        size_kb: 19680,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/global/videos/PICSA%20Steps/4%20%20Crop,%20Livestock%20and%20Livelihood%20Options.mp4',
      },
      {
        id: '',
        locale_codes: ['mw_ny'],
        size_kb: 30580,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/mw/videos/PICSA%20Steps/4%20Crop,%20Livestock%20and%20Livelihood%20Options.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_ny'],
        size_kb: 30020,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/4%20Crop,%20Livestock%20and%20Livelihood%20Options.mp4',
      },
    ],
  },
  participatory_budget: {
    children: [
      {
        id: '',
        locale_codes: ['global_en'],
        size_kb: 21720,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/global/videos/PICSA%20Steps/5%20%20Particpatory%20Budget.mp4',
      },
      {
        id: '',
        locale_codes: ['mw_ny'],
        size_kb: 22040,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/mw/videos/PICSA%20Steps/5%20Participatory%20Budgets.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_ny'],
        size_kb: 22500,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/5%20Participatory%20Budgets.mp4',
      },
    ],
  },
  seasonal_forecast: {
    children: [
      {
        id: '',
        // TODO - zm currently in place of global
        locale_codes: ['zm_ny', 'global_en'],
        size_kb: 26160,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/7a%20Seasonal%20Forecast_Zambia_360p.mp4',
      },
    ],
  },
  short_term_forecast: {
    children: [
      {
        id: '',
        // TODO - zm currently in place of global
        locale_codes: ['zm_ny', 'global_en'],
        size_kb: 17390,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/7b%20Short%20Term%20Forecast_Zambia_360p.mp4',
      },
    ],
  },
};

export const PICSA_FARMER_VIDEOS_DATA: IPicsaVideoData[] = Object.entries(PICSA_FARMER_VIDEOS_BASE).map(
  ([id, entry]) => ({
    id: id as IPicsaFarmerVideoId,
    children: entry.children.map((child) => {
      const { locale_codes, resolution } = child;
      // use primary locale code for id
      const [locale_code] = locale_codes;
      child.id = `farmer_${id}_${locale_code}_${resolution}`;
      return child;
    }),
  }),
);

export const PICSA_FARMER_VIDEOS_HASHMAP: Record<IPicsaFarmerVideoId, IPicsaVideoData> = arrayToHashmap(
  PICSA_FARMER_VIDEOS_DATA,
  'id',
);
