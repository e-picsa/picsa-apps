import { arrayToHashmap } from '@picsa/utils';
import { IPicsaVideoData } from '../types';

const PICSA_VIDEO_TESTIMONIAL_BASE: Record<string, Omit<IPicsaVideoData, 'id'>> = {
  victoria_ngombe: {
    title: "Victoria Ng'ombe",
    children: [
      {
        id: '',
        locale_codes: ['mw_ny', 'global_en'],
        resolution: '360p',
        size_kb: 5080,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/mw/videos/testimonials/victoria_ngombe.mp4',
      },
    ],
  },
  jackline_nkhoma: {
    title: 'Jackline Nkhoma',
    children: [
      {
        id: '',
        locale_codes: ['zm_ny', 'global_en'],
        resolution: '360p',
        size_kb: 6740,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/testimonials/jackline_nkhoma.mp4',
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
        size_kb: 7630,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/mw/videos/testimonials/dani_chambwe.mp4',
      },
    ],
  },
  john_tembo: {
    title: 'John Tembo',
    children: [
      {
        id: '',
        locale_codes: ['zm_ny', 'global_en'],
        resolution: '360p',
        size_kb: 10150,
        supabase_url: 'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/testimonials/.mp4',
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
  })
);

export const PICSA_VIDEO_TESTIMONIAL_HASHMAP: Record<string, IPicsaVideoData> = arrayToHashmap(
  PICSA_VIDEO_TESTIMONIAL_DATA,
  'id'
);
