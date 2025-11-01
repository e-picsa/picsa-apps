import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { arrayToHashmap } from '@picsa/utils';
import { IPicsaVideoData } from '../types';

type IPicsaOperationalVideoID = 'intro' | 'historic_climate' | 'options' | 'participatory_budget';

const PICSA_OPERATIONAL_VIDEOS_BASE: Record<IPicsaOperationalVideoID, Omit<IPicsaVideoData, 'id'>> = {
  intro: {
    title: translateMarker('Intro - Operational'),
    children: [
      // Global
      {
        id: '',
        locale_codes: ['global_en', 'global_en'],
        resolution: '360p',
        size_kb: 7860,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/global/videos/operational/Intro%20Video%20English.mp4',
      },
      // ZM
      // LEGACY - to remove in 2026
      // {
      //   id: '',
      //   locale_codes: ['zm_ny'],
      //   resolution: '480p',
      //   size_kb: 22300,
      //   supabase_url:
      //     'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/operational/overall.mp4',
      // },
      {
        id: '',
        locale_codes: ['zm_ny'],
        resolution: '480p',
        size_kb: 16470,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/operational/Intro%20Operational%20Video_Zambia_480p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_bem'],
        resolution: '480p',
        size_kb: 13000,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/operational/Intro%20Operational%20Tools_BEM_480p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_kqn'],
        resolution: '480p',
        size_kb: 12910,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/operational/Intro%20Tool_KON_480p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_lue'],
        resolution: '480p',
        size_kb: 14330,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/operational/Introduction%20to%20Operational%20Tools%20-%20LUV_480p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_lun'],
        resolution: '480p',
        size_kb: 18840,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/operational/Intro%20Operational%20Tool_LUN_480p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_loz'],
        resolution: '480p',
        size_kb: 11810,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/operational/Intro%20Operational%20Tool%20-%20LOZ_480p.mp4',
      },

      {
        id: '',
        locale_codes: ['zm_toi'],
        resolution: '480p',
        size_kb: 16780,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/operational/Intro%20to%20Operational%20Tools_TNG_480p.mp4',
      },

      // MW
      {
        id: '',
        locale_codes: ['mw_ny'],
        size_kb: 14100,
        resolution: '480p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/mw/videos/operational/Malawi%20Chewa%20Intro%20Video_480p.mp4',
      },
      {
        id: '',
        locale_codes: ['mw_tum'],
        size_kb: 13510,
        resolution: '480p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/mw/videos/operational/Intro%20Oparation%20Tool_TUM_480p.mp4',
      },
    ],
  },

  historic_climate: {
    title: translateMarker('Historic Climate - Operational'),
    children: [
      // Global
      {
        id: '',
        locale_codes: ['global_en', 'global_en'],
        resolution: '360p',
        size_kb: 3990,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/global/videos/operational/HCI%20English.mp4',
      },
      // ZM
      // LEGACY - to remove in 2026
      // {
      //   id: '',
      //   locale_codes: ['zm_ny', 'global_en'],
      //   size_kb: 15730,
      //   resolution: '480p',
      //   supabase_url:
      //     'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/operational/historic-climate.mp4',
      // },
      {
        id: '',
        locale_codes: ['zm_ny'],
        size_kb: 6780,
        resolution: '480p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/operational/HCI%20Zambia_480p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_bem'],
        size_kb: 7520,
        resolution: '480p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/operational/HCI%20Tool%20Operational_BEM_480p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_kqn'],
        size_kb: 6790,
        resolution: '480p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/operational/HCI%20Operational%20Tool_KON_480p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_lue'],
        size_kb: 8190,
        resolution: '480p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/operational/HCI%20Operational%20tool%20-%20LUV_480p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_loz'],
        size_kb: 7320,
        resolution: '480p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/operational/HCI%20Operational%20Tool%20-%20LOZ_480p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_lun'],
        size_kb: 8820,
        resolution: '480p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/operational/HCI%20Operational%20Tool_LUN_480p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_toi'],
        size_kb: 9860,
        resolution: '480p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/operational/HCI%20Operational%20Tool_TNG_480p.mp4',
      },

      // MW
      {
        id: '',
        locale_codes: ['mw_ny'],
        size_kb: 6990,
        resolution: '480p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/mw/videos/operational/HCI%20Malawi%20_480p.mp4',
      },
      {
        id: '',
        locale_codes: ['mw_tum'],
        size_kb: 7840,
        resolution: '480p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/mw/videos/operational/HCI%20Operational%20Tool_TUM_480p.mp4',
      },
    ],
  },

  options: {
    title: translateMarker('Options - Operational'),
    children: [
      // Global
      {
        id: '',
        locale_codes: ['global_en', 'global_en'],
        resolution: '360p',
        size_kb: 15190,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/global/videos/operational/Options%20English.mp4',
      },
      // ZM
      // LEGACY - to remove in 2026
      // {
      //   id: '',
      //   locale_codes: ['zm_ny', 'global_en'],
      //   size_kb: 43900,
      //   resolution: '480p',
      //   supabase_url:
      //     'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/operational/option.mp4',
      // },
      {
        id: '',
        locale_codes: ['zm_ny'],
        size_kb: 30390,
        resolution: '480p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/operational/Option%20operational%20video_480p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_bem'],
        size_kb: 31050,
        resolution: '480p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/operational/Options%20Tool%20Operational_BEM_480p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_kqn'],
        resolution: '480p',
        size_kb: 29470,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/operational/Options%20Tool_KON_480p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_loz'],
        size_kb: 27940,
        resolution: '480p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/operational/Options%20Operational%20Tool%20-%20LOZ_480p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_lue'],
        size_kb: 33480,
        resolution: '480p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/operational/Options%20Tool%20Operational%20-%20LUV_480p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_lun'],
        resolution: '480p',
        size_kb: 29760,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/operational/Options%20Operational%20Tool_LUN_480p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_toi'],
        size_kb: 33250,
        resolution: '480p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/operational/Options%20Operational%20Tool_TNG_480p.mp4',
      },
      // MW
      {
        id: '',
        locale_codes: ['mw_ny'],
        size_kb: 31700,
        resolution: '480p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/mw/videos/operational/Options%20Operational%20Video_Malawi_480p.mp4',
      },
      {
        id: '',
        locale_codes: ['mw_tum'],
        size_kb: 29350,
        resolution: '480p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/mw/videos/operational/Options%20Operational%20Tool_TUM_480p.mp4',
      },
    ],
  },
  participatory_budget: {
    title: translateMarker('Participatory Budgets - Operational'),
    children: [
      // Global
      {
        id: '',
        locale_codes: ['global_en', 'global_en'],
        resolution: '360p',
        size_kb: 12590,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/global/videos/operational/PB%20Operational%20Video.mp4',
      },
      // ZM
      // LEGACY - to remove in 2026
      // {
      //   id: '',
      //   locale_codes: ['zm_ny', 'global_en'],
      //   size_kb: 43410,
      //   resolution: '480p',
      //   supabase_url: 'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/operational/pb.mp4',
      // },

      {
        id: '',
        locale_codes: ['zm_ny'],
        size_kb: 20800,
        resolution: '480p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/operational/PB%20Operational%20video_480p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_bem'],
        size_kb: 24500,
        resolution: '480p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/operational/PB%20Tool%20Operational_BEM_480p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_kqn'],
        resolution: '480p',
        size_kb: 25670,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/operational/PB%20%20Tool_KON_480p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_loz'],
        size_kb: 21890,
        resolution: '480p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/operational/PB%20Operational%20Tool%20-%20LOZ_480p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_lue'],
        size_kb: 26260,
        resolution: '480p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/operational/Participatory%20Budget%20Tool%20%20-%20LUV_480p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_lun'],
        resolution: '480p',
        size_kb: 37920,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/operational/Participatory%20Budget%20Tool_LUN_480p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_toi'],
        size_kb: 29240,
        resolution: '480p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/operational/PB%20Operational%20Tool_TNG_480p.mp4',
      },
      // MW
      {
        id: '',
        locale_codes: ['mw_ny'],
        size_kb: 27200,
        resolution: '480p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/mw/videos/operational/PB%20Operational%20Video_Malawi_480p.mp4',
      },
      {
        id: '',
        locale_codes: ['mw_tum'],
        size_kb: 25540,
        resolution: '480p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/mw/videos/operational/PB%20Operational%20Tool_TUM_480p.mp4',
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
