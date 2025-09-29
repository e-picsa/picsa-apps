import { arrayToHashmap } from '@picsa/utils';
import { IPicsaVideoData } from '../types';

type IPicsaIntroVideoId = 'intro';

const PICSA_INTRO_VIDEOS_BASE: Record<IPicsaIntroVideoId, Omit<IPicsaVideoData, 'id'>> = {
  intro: {
    children: [
      // NOTE - 'global_en' does not exist for intro but ny versions include subtitles

      // LEGACY - To Delete In Future

      // {
      //   id: '',
      //   locale_codes: ['mw_ny', 'global_en'],
      //   resolution: '360p',
      //   size_kb: 15790,
      //   supabase_url:
      //     'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/mw/videos/PICSA%20Malawi%20Intro%202025.mp4',
      // },
      //  {
      //   id: '',
      //   locale_codes: ['zm_ny', 'global_en'],
      //   resolution: '360p',
      //   size_kb: 15960,
      //   supabase_url:
      //     'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/PICSA%20Zambia%20Intro%202025.mp4',
      // },

      // MW
      {
        id: '',
        locale_codes: ['mw_ny', 'global_en'],
        resolution: '360p',
        size_kb: 25900,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/mw/videos/intro/PICSA%20Malawi%20Intro_CHE_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['mw_tum'],
        resolution: '360p',
        size_kb: 18330,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/mw/videos/intro/PICSA%20Malawi%20Intro_TUM_360p.mp4',
      },

      // ZM
      {
        id: '',
        locale_codes: ['zm_ny', 'global_en'],
        resolution: '360p',
        size_kb: 18100,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/intro/PICSA%20Zambia%20Intro_NYA_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_bem'],
        resolution: '360p',
        size_kb: 19120,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/intro/PICSA%20Zambia%20Intro_BEM_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_kqn'],
        resolution: '360p',
        size_kb: 17250,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/intro/Zambia%20PICSA%20Intro-KON_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_loz'],
        resolution: '360p',
        size_kb: 18850,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/intro/PICSA%20Zambia%20Intro_LOZ_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_lue'],
        resolution: '360p',
        size_kb: 17220,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/intro/Zambia%20PICSA%20Intro_LUV_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_lun'],
        resolution: '360p',
        size_kb: 17240,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/intro/Zamiba%20PICSA%20Intro_LUN_360p.mp4',
      },

      {
        id: '',
        locale_codes: ['zm_toi'],
        resolution: '360p',
        size_kb: 18950,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/intro/PICSA%20Zambia%20Intro_TON_360p.mp4',
      },
    ],
  },
};

export const PICSA_INTRO_VIDEOS_DATA: IPicsaVideoData[] = Object.entries(PICSA_INTRO_VIDEOS_BASE).map(
  ([id, entry]) => ({
    id: id as IPicsaIntroVideoId,
    children: entry.children.map((child) => {
      const { locale_codes, resolution } = child;
      // use primary locale code for id
      const [locale_code] = locale_codes;
      child.id = `farmer_${id}_${locale_code}_${resolution}`;
      return child;
    }),
  }),
);

export const PICSA_INTRO_VIDEOS_HASHMAP: Record<IPicsaIntroVideoId, IPicsaVideoData> = arrayToHashmap(
  PICSA_INTRO_VIDEOS_DATA,
  'id',
);
