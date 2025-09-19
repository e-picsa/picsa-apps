import { arrayToHashmap } from '@picsa/utils';
import { IPicsaVideoData } from '../types';

type IPicsaOperationalVideoID = 'intro' | 'historic_climate' | 'options' | 'participatory_budget';

const PICSA_OPERATIONAL_VIDEOS_BASE: Record<IPicsaOperationalVideoID, Omit<IPicsaVideoData, 'id'>> = {
  intro: {
    children: [
      {
        id: '',
        locale_codes: ['global_en', 'global_en'],
        resolution: '360p',
        size_kb: 7860,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/global/videos/operational/Intro%20Video%20English.mp4',
      },
      // ZM
      {
        id: '',
        locale_codes: ['zm_ny'],
        resolution: '480p',
        size_kb: 22300,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/operational/overall.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_bem'],
        resolution: '480p',
        size_kb: 19120,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/intro/PICSA%20Zambia%20Intro_BEM_360p.mp4',
      },
      {
        id: '',
        locale_codes: [],
        resolution: '480p',
        size_kb: 18100,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/intro/PICSA%20Zambia%20Intro_NYA_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_toi'],
        resolution: '480p',
        size_kb: 18950,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/intro/PICSA%20Zambia%20Intro_TON_360p.mp4',
      },
      // MW
      {
        id: '',
        locale_codes: ['mw_ny'],
        resolution: '480p',
        size_kb: 25900,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/mw/videos/intro/PICSA%20Malawi%20Intro_CHE_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['mw_tum'],
        resolution: '480p',
        size_kb: 18330,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/mw/videos/intro/PICSA%20Malawi%20Intro_TUM_360p.mp4',
      },
    ],
  },

  historic_climate: {
    children: [
      {
        id: '',
        locale_codes: ['global_en', 'global_en'],
        resolution: '360p',
        size_kb: 3990,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/global/videos/operational/HCI%20English.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_ny', 'global_en'],
        size_kb: 15730,
        resolution: '480p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/operational/historic-climate.mp4',
      },
    ],
  },

  options: {
    children: [
      {
        id: '',
        locale_codes: ['global_en', 'global_en'],
        resolution: '360p',
        size_kb: 15190,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/global/videos/operational/Options%20English.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_ny', 'global_en'],
        size_kb: 43900,
        resolution: '480p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/operational/option.mp4',
      },
    ],
  },
  participatory_budget: {
    children: [
      {
        id: '',
        locale_codes: ['global_en', 'global_en'],
        resolution: '360p',
        size_kb: 12590,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/global/videos/operational/PB%20Operational%20Video.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_ny', 'global_en'],
        size_kb: 43410,
        resolution: '480p',
        supabase_url: 'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/operational/pb.mp4',
      },
    ],
  },
};

export const PICSA_OPERATIONAL_VIDEOS_DATA: IPicsaVideoData[] = Object.entries(PICSA_OPERATIONAL_VIDEOS_BASE).map(
  ([id, entry]) => ({
    id: id as IPicsaOperationalVideoID,
    children: entry.children.map((child) => {
      const { locale_codes, resolution } = child;
      // use primary locale code for id
      const [locale_code] = locale_codes;
      child.id = `operational_${id}_${locale_code}_${resolution}`;
      return child;
    }),
  }),
);

export const PICSA_OPERATIONAL_VIDEOS_HASHMAP: Record<IPicsaOperationalVideoID, IPicsaVideoData> = arrayToHashmap(
  PICSA_OPERATIONAL_VIDEOS_DATA,
  'id',
);
