import { arrayToHashmap } from '@picsa/utils';
import { IPicsaVideoData } from '../types';

const PICSA_VIDEO_TESTIMONIAL_BASE: Record<string, Omit<IPicsaVideoData, 'id'>> = {
  // LEGACY - To Remove in 2026
  // {
  //       id: '',
  //       locale_codes: ['zm_ny', 'global_en'],
  //       resolution: '360p',
  //       size_kb: 10150,
  //       supabase_url:
  //         'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/testimonials/john_tembo.mp4',
  //     },
  // {
  //       id: '',
  //       locale_codes: ['zm_ny', 'global_en'],
  //       resolution: '360p',
  //       size_kb: 5080,
  //       supabase_url:
  //         'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/testimonials/victoria_ngombe.mp4',
  //     },
  // {
  //       id: '',
  //       locale_codes: ['mw_ny', 'global_en'],
  //       resolution: '360p',
  //       size_kb: 6740,
  //       supabase_url:
  //         'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/mw/videos/testimonials/jackline_nkhoma.mp4',
  //     },
  // {
  //       id: '',
  //       locale_codes: ['mw_ny', 'global_en'],
  //       resolution: '360p',
  //       size_kb: 7630,
  //       supabase_url:
  //         'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/mw/videos/testimonials/dani_chambwe.mp4',
  //     },

  // MW
  jackline_nkhoma: {
    title: 'Jackline Nkhoma',
    children: [
      {
        id: '',
        locale_codes: ['mw_ny', 'global_en'],
        resolution: '360p',
        size_kb: 9890,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/mw/videos/testimonials/Jackline%20Nkhoma_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['mw_tum'],
        resolution: '360p',
        size_kb: 9140,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/mw/videos/testimonials/Jackline%20Nkoma_TUM_360p.mp4',
      },
    ],
  },

  dani_chambwe: {
    title: 'Dani Chambwe',
    children: [
      {
        id: '',
        locale_codes: ['mw_ny', 'global_en'],
        resolution: '360p',
        size_kb: 13300,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/mw/videos/testimonials/Dani%20Chambwe_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['mw_tum'],
        resolution: '360p',
        size_kb: 12570,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/mw/videos/testimonials/Dani%20Chambwe_TUM_360p.mp4',
      },
    ],
  },
  // ZM
  john_tembo: {
    title: 'John Tembo',
    children: [
      {
        id: '',
        locale_codes: ['zm_ny', 'global_en'],
        resolution: '360p',
        size_kb: 20670,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/testimonials/John%20Tembo_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_bem'],
        resolution: '360p',
        size_kb: 15030,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/testimonials/John%20Tembo_BEM_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_kqn'],
        resolution: '360p',
        size_kb: 15320,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/testimonials/John%20Tembo_KON_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_loz'],
        resolution: '360p',
        size_kb: 15610,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/testimonials/John%20Tembo_LOZ_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_lue'],
        resolution: '360p',
        size_kb: 15390,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/testimonials/John%20%20Tembo_LUV_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_lun'],
        resolution: '360p',
        size_kb: 15420,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/testimonials/John%20Tenbo_LUN_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_toi'],
        resolution: '360p',
        size_kb: 15420,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/testimonials/John%20Tembo_TON_360p.mp4',
      },
    ],
  },
  victoria_ngombe: {
    title: "Victoria Ng'ombe",
    children: [
      {
        id: '',
        locale_codes: ['zm_ny', 'global_en'],
        resolution: '360p',
        size_kb: 8600,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/testimonials/Victoria%20Ngombe_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_bem'],
        resolution: '360p',
        size_kb: 7730,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/testimonials/Victoria%20Ngombe_BEM_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_kqn'],
        resolution: '360p',
        size_kb: 7840,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/testimonials/Victoria%20Ngombe_KON_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_loz'],
        resolution: '360p',
        size_kb: 7790,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/testimonials/Victoria%20Ngombe_LOZ_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_lun'],
        resolution: '360p',
        size_kb: 7820,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/testimonials/Victoria%20Ngombe_LUN_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_lue'],
        resolution: '360p',
        size_kb: 7820,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/testimonials/Victoria%20Ngombe_LUV_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_toi'],
        resolution: '360p',
        size_kb: -1,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/testimonials/Victoria%20Ngombe_TON_360p.mp4',
      },
    ],
  },
};

export const PICSA_VIDEO_TESTIMONIAL_DATA: IPicsaVideoData[] = Object.entries(PICSA_VIDEO_TESTIMONIAL_BASE).map(
  ([id, entry]) => ({
    ...entry,
    id,
    children: entry.children.map((child) => {
      const { locale_codes, resolution } = child;
      const [locale_code] = locale_codes;
      child.id = `farmer_testimonial_${id}_${locale_code}_${resolution}`;
      return child;
    }),
  }),
);

export const PICSA_VIDEO_TESTIMONIAL_HASHMAP: Record<string, IPicsaVideoData> = arrayToHashmap(
  PICSA_VIDEO_TESTIMONIAL_DATA,
  'id',
);
