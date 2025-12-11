import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { arrayToHashmap } from '@picsa/utils';
import { IPicsaVideoData } from '../types';

type IPicsaFarmerVideoId =
  | 'ram'
  | 'seasonal_calendar'
  | 'historic_climate'
  | 'probability_risk'
  | 'options'
  | 'participatory_budget'
  | 'seasonal_forecast'
  | 'short_term_forecast';

const PICSA_FARMER_VIDEOS_BASE: Record<IPicsaFarmerVideoId, Omit<IPicsaVideoData, 'id'>> = {
  ram: {
    title: translateMarker('Resource Allocation Map'),
    children: [
      {
        id: '',
        locale_codes: ['global_en'],
        size_kb: 14840,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/global/videos/PICSA%20Steps/1a%20%20Resource%20Allocation%20Map.mp4',
      },
      // MW
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
        locale_codes: ['mw_tum'],
        size_kb: 17820,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/mw/videos/PICSA%20Steps/07.%20Resource%20Allocation%20Map%20(RAM)%20TUM_360p.mp4',
      },
      // ZM
      {
        id: '',
        locale_codes: ['zm_ny'],
        size_kb: 17710,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/1a%20Resource%20Allocation%20Map.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_bem'],
        size_kb: 16760,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/07.%20Resource%20Allocation%20Map%20(RAM)%20BEM_Final_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_kqn'],
        size_kb: 25440,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/07.%20Resource%20Allocation%20Map%20(RAM)%20KON_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_loz'],
        size_kb: 16830,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/07.%20Resource%20Allocation%20Map%20(RAM)%20%20LOZ_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_lue'],
        size_kb: 25210,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/07.%20Resource%20Allocation%20Map%20(RAM)%20LUV_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_lun'],
        size_kb: 18180,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/07.%20Resource%20Allocation%20Map%20(RAM)%20LUN_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_toi'],
        size_kb: 20490,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/07.%20Resource%20Allocation%20Map%20(RAM)_TNG_360p.mp4',
      },
    ],
  },
  seasonal_calendar: {
    title: translateMarker('Seasonal Calendar'),
    children: [
      {
        id: '',
        locale_codes: ['global_en'],
        size_kb: 12950,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/global/videos/PICSA%20Steps/1b%20%20Seasonal%20Calendar.mp4',
      },
      // MW
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
        locale_codes: ['mw_tum'],
        size_kb: 13670,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/mw/videos/PICSA%20Steps/13.%20Seasonal%20Calendar_TUM_360p.mp4',
      },
      // ZM
      {
        id: '',
        locale_codes: ['zm_ny'],
        size_kb: 15300,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/1b%20Seasonal%20Calendar.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_bem'],
        size_kb: 15600,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/13.%20Seasonal%20Calendar_BEM_Final_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_kqn'],
        size_kb: 23170,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/13.%20Seasonal%20Calendar_KON_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_loz'],
        size_kb: 14030,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/13.%20Seasonal%20Calendar_LOZ_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_lue'],
        size_kb: 16960,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/13.%20Seasonal%20Calendar_LUV_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_lun'],
        size_kb: 22570,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/13.%20Seasonal%20Calendar_LUN_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_toi'],
        size_kb: 18470,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/13.%20Seasonal%20Calendar_TNG_360p.mp4',
      },
    ],
  },
  historic_climate: {
    title: translateMarker('Historical Climate Information'),
    children: [
      {
        id: '',
        locale_codes: ['global_en'],
        size_kb: 20710,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/global/videos/PICSA%20Steps/2%20%20Historical%20Climate%20Information.mp4',
      },
      // MW
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
        locale_codes: ['mw_tum'],
        size_kb: 23280,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/mw/videos/PICSA%20Steps/10.%20Historical%20Climate%20Information%20(HCI)%20TUM_360p.mp4',
      },
      // ZM
      {
        id: '',
        locale_codes: ['zm_ny'],
        size_kb: 26490,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/2%20Historical%20Climate%20Information.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_bem'],
        size_kb: 27630,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/10.%20Historical%20Climate%20Information%20(HCI)%20BEM%20_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_kqn'],
        size_kb: 36240,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/10.%20Historical%20Climate%20Information%20(HCI)%20KON_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_loz'],
        size_kb: 28420,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/10.%20Historical%20Climate%20Information%20(HCI)%20LOZ_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_lue'],
        size_kb: 27280,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/10.%20Historical%20Climate%20Information%20(HCI)%20LUV_2_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_lun'],
        size_kb: 39660,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/10.%20Historical%20Climate%20Information%20(HCI)%20LUN_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_toi'],
        size_kb: 32940,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/10.%20Historical%20Climate%20Information%20(HCI)_TNG_360p.mp4',
      },
    ],
  },
  probability_risk: {
    title: translateMarker('Probability and Risk'),
    children: [
      {
        id: '',
        locale_codes: ['global_en'],
        size_kb: 20800,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/global/videos/PICSA%20Steps/3%20%20What%20are%20the%20risks%20and%20opportunities.mp4',
      },
      // MW
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
        locale_codes: ['mw_tum'],
        size_kb: 21570,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/mw/videos/PICSA%20Steps/08.%20What%20are%20the%20risks%20and%20opportunities%20TUM_360p.mp4',
      },
      // ZM
      {
        id: '',
        locale_codes: ['zm_ny'],
        size_kb: 25200,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/3%20What%20are%20the%20risks%20and%20opportunities.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_bem'],
        size_kb: 27950,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/08.%20What%20are%20the%20risks%20and%20opportunities%20BEM_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_kqn'],
        size_kb: 34650,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/08.%20What%20are%20the%20risks%20and%20opportunities%20KON_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_loz'],
        size_kb: 29050,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/08.%20What%20are%20the%20risks%20and%20opportunities%20LOZ_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_lue'],
        size_kb: 26070,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/08.%20What%20are%20the%20risks%20and%20opportunities%20LUV_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_lun'],
        size_kb: 39790,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/08.%20What%20are%20the%20risks%20and%20opportunities%20LUN_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_toi'],
        size_kb: 31720,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/08.%20What%20are%20the%20risks%20and%20opportunities_TNG_360p.mp4',
      },
    ],
  },
  options: {
    title: translateMarker('Crop, Livestock and Livelihood Options'),
    children: [
      {
        id: '',
        locale_codes: ['global_en'],
        size_kb: 19680,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/global/videos/PICSA%20Steps/4%20%20Crop,%20Livestock%20and%20Livelihood%20Options.mp4',
      },
      // MW
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
        locale_codes: ['mw_tum'],
        size_kb: 24310,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/mw/videos/PICSA%20Steps/11.%20Crop,%20Livestock%20and%20Livelihood%20Options%20TUM_360p.mp4',
      },
      // ZM
      {
        id: '',
        locale_codes: ['zm_ny'],
        size_kb: 30020,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/4%20Crop,%20Livestock%20and%20Livelihood%20Options.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_bem'],
        size_kb: 25730,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/11.%20Crop,%20Livestock%20and%20Livelihood%20Options_BEM%20(1)_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_kqn'],
        size_kb: 34540,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/11.%20Crop,%20Livestock%20and%20Livelihood%20Options%20KON_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_loz'],
        size_kb: 29250,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/11.%20Crop,%20Livestock%20and%20Livelihood%20Options%20LOZ_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_lue'],
        size_kb: 27990,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/11.%20Crop,%20Livestock%20and%20Livelihood%20Options%20LUV_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_lun'],
        size_kb: 40220,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/11.%20Crop,%20Livestock%20and%20Livelihood%20Options%20LUN_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_toi'],
        size_kb: 29600,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/11.%20Crop,%20Livestock%20and%20Livelihood%20Options_TNG_360p.mp4',
      },
    ],
  },
  participatory_budget: {
    title: translateMarker('Participatory Budget'),
    children: [
      {
        id: '',
        locale_codes: ['global_en'],
        size_kb: 21720,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/global/videos/PICSA%20Steps/5%20%20Particpatory%20Budget.mp4',
      },
      // MW
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
        locale_codes: ['mw_tum'],
        size_kb: 26260,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/mw/videos/PICSA%20Steps/09.%20Participatory%20Budgets%20TUM_360p.mp4',
      },
      // ZM
      {
        id: '',
        locale_codes: ['zm_ny'],
        size_kb: 22500,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/5%20Participatory%20Budgets.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_bem'],
        size_kb: 24820,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/09.%20Participatory%20Budgets_BEM_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_kqn'],
        size_kb: 40160,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/09.%20Participatory%20Budgets%20KON_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_loz'],
        size_kb: 24860,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/09.%20Participatory%20Budgets%20%20LOZ_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_lue'],
        size_kb: 29090,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/09.%20Participatory%20Budgets%20LUV_2_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_lun'],
        size_kb: 37430,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/09.%20Participatory%20Budgets%20LUN_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_toi'],
        size_kb: 30780,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/09.%20Participatory%20Budgets%20_TNG_360p.mp4',
      },
    ],
  },
  // Each country also provides en variant
  seasonal_forecast: {
    title: translateMarker('Seasonal Forecast'),
    children: [
      // MW
      {
        id: '',
        locale_codes: ['mw_en'],
        size_kb: 27130,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/mw/videos/PICSA%20Steps/Seasonal%20Forecast%20-%20Malawi_ENG_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['mw_ny'],
        size_kb: 33870,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/mw/videos/PICSA%20Steps/Seasonal%20Forecast%20-%20Malawi_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['mw_tum'],
        size_kb: 33820,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/mw/videos/PICSA%20Steps/12.%20Seasonal%20Forecast%20-%20Malawi%20TUM_360p.mp4',
      },
      // ZM
      {
        id: '',
        locale_codes: ['zm_en'],
        size_kb: 26160,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/7a%20Seasonal%20Forecast_Zambia_360p.mp4',
      },

      {
        id: '',
        locale_codes: ['zm_ny'],
        size_kb: 31030,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/Seasonal%20Forecast%20-%20Zambia_NYA_norm_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_bem'],
        size_kb: 29460,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/12.%20Seasonal%20Forecast%20-%20Zambia_BEM_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_kqn'],
        size_kb: 39900,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/12.%20Seasonal%20Forecast%20-%20Zambia_KON_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_loz'],
        size_kb: 32290,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/12.%20Seasonal%20Forecast%20-%20Zambia_LOZ_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_lue'],
        size_kb: 31640,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/12.%20Seasonal%20Forecast%20-%20Zambia_LUV_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_lun'],
        size_kb: 49360,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/12.%20Seasonal%20Forecast%20-%20Zambia_LUN_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_toi'],
        size_kb: 35330,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/12.%20Seasonal%20Forecast%20-%20Zambia_TNG_360p.mp4',
      },
    ],
  },
  // Each country also provides en variant
  short_term_forecast: {
    title: translateMarker('Short Term Forecast'),
    children: [
      // MW
      {
        id: '',
        locale_codes: ['mw_en'],
        size_kb: 18530,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/mw/videos/PICSA%20Steps/Short%20Term%20Forecast%20-%20Malawi_ENG_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['mw_ny'],
        size_kb: 17900,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/mw/videos/PICSA%20Steps/Short%20Term%20Forecast%20-%20Malawi_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['mw_tum'],
        size_kb: 17590,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/mw/videos/PICSA%20Steps/14.Short%20Term%20Forecast%20-%20Malawi_TUM_360p.mp4',
      },
      // ZM
      {
        id: '',
        locale_codes: ['zm_en'],
        size_kb: 17390,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/7b%20Short%20Term%20Forecast_Zambia_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_ny'],
        size_kb: 20370,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/Short%20Term%20Forecast%20-%20Zambia_NYA_norm_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_bem'],
        size_kb: 15770,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/14.%20Short%20Term%20Forecast%20-%20Zambia_BEM_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_kqn'],
        size_kb: 28660,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/14.%20Short%20Term%20Forecast%20-%20Zambia_KON_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_loz'],
        size_kb: 17080,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/14.%20Short%20Term%20Forecast%20-%20Zambia_LOZ_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_lue'],
        size_kb: 16630,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/14.%20Short%20Term%20Forecast%20-%20Zambia_LUV_2_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_lun'],
        size_kb: 22730,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/14.%20Short%20Term%20Forecast%20-%20Zambia_LUN_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_toi'],
        size_kb: 18090,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Steps/14.%20Short%20Term%20Forecast%20-%20Zambia_TNG_360p.mp4',
      },
    ],
  },
};

export const PICSA_FARMER_VIDEOS_DATA: IPicsaVideoData[] = Object.entries(PICSA_FARMER_VIDEOS_BASE).map(
  ([id, entry]) => ({
    ...entry,
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
