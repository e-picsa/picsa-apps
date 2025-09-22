import { arrayToHashmap } from '@picsa/utils';
import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { IPicsaVideoData } from '../types';

const PICSA_VIDEO_DIGITAL_SKILLS_BASE: Record<string, Omit<IPicsaVideoData, 'id'>> = {
  '1_introduction': {
    title: translateMarker('Digital Skills Introduction'),
    children: [
      {
        id: '',
        locale_codes: ['global_en'],
        resolution: '360p',
        size_kb: 7110,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/global/videos/Digital%20Skills/01%20%20Digital%20Skills%20Introduction%20EN.mp4',
      },
      // ZM
      {
        id: '',
        locale_codes: ['zm_ny'],
        resolution: '360p',
        size_kb: 8250,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/Digital%20Skills/zm_ny/01.%20Digital%20Skills%20Introduction_NYA_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_bem'],
        resolution: '360p',
        size_kb: 7350,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/Digital%20Skills/01.%20Digital%20Skills%20Introduction_BEM_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_loz'],
        resolution: '360p',
        size_kb: 7210,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/Digital%20Skills/01.%20Digital%20Skills%20Introduction_LOZ_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_lue'],
        resolution: '360p',
        size_kb: 7200,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/Digital%20Skills/01.%20Digital%20Skills%20Introduction_LUV_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_kqn'],
        resolution: '360p',
        size_kb: 7530,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/Digital%20Skills/01.%20Digital%20Skills%20Introduction_KON_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_lun'],
        resolution: '360p',
        size_kb: 7500,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/Digital%20Skills/01.%20Digital%20Skills%20Introduction_LND_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_toi'],
        resolution: '360p',
        size_kb: 7410,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/Digital%20Skills/01.%20Digital%20Skills%20Introduction_TNG_360p.mp4',
      },
      // MW
      // {
      //   id: '',
      //   locale_codes: ['mw_ny'],
      //   resolution: '360p',
      //   size_kb: 0,
      //   supabase_url: '',
      // },
      {
        id: '',
        locale_codes: ['mw_tum'],
        resolution: '360p',
        size_kb: 7380,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/mw/videos/Digital%20Skills/01.%20Digital%20Skills%20Introduction_TUM_360p.mp4',
      },
    ],
  },
  '2_download_install_apps': {
    title: translateMarker('How to Download and Install Apps'),
    children: [
      {
        id: '',
        locale_codes: ['global_en'],
        resolution: '360p',
        size_kb: 7500,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/global/videos/Digital%20Skills/02%20%20How%20to%20Download%20and%20Install%20Apps%20EN.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_ny'],
        resolution: '360p',
        size_kb: 5620,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/Digital%20Skills/zm_ny/02.%20How%20to%20Download%20and%20Install%20Apps_NYA_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_bem'],
        resolution: '360p',
        size_kb: 5720,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/Digital%20Skills/02.%20How%20to%20Download%20and%20Install%20Apps_BEM_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_loz'],
        resolution: '360p',
        size_kb: 5170,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/Digital%20Skills/02.%20How%20to%20Download%20and%20Install%20Apps_LOZ_2_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_lue'],
        resolution: '360p',
        size_kb: 6010,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/Digital%20Skills/02.%20How%20to%20Download%20and%20Install%20Apps_LUV_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_kqn'],
        resolution: '360p',
        size_kb: 8320,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/Digital%20Skills/02.%20How%20to%20Download%20and%20Install%20Apps_KON_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_lun'],
        resolution: '360p',
        size_kb: 6650,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/Digital%20Skills/02.%20How%20to%20Download%20and%20Install%20Apps_LND_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_toi'],
        resolution: '360p',
        size_kb: 5260,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/Digital%20Skills/02.%20How%20to%20Download%20and%20Install%20Apps_TNG_360p.mp4',
      },
      // MW
      // {
      //   id: '',
      //   locale_codes: ['mw_ny'],
      //   resolution: '360p',
      //   size_kb: 0,
      //   supabase_url: '',
      // },
      {
        id: '',
        locale_codes: ['mw_tum'],
        resolution: '360p',
        size_kb: 5380,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/mw/videos/Digital%20Skills/02.%20How%20to%20Download%20and%20Install%20Apps_TUM_360p.mp4',
      },
    ],
  },
  '3_keep_device_operational': {
    title: translateMarker('How to Keep Your Device Operational'),
    children: [
      {
        id: '',
        locale_codes: ['global_en'],
        resolution: '360p',
        size_kb: 14720,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/global/videos/Digital%20Skills/03%20%20How%20to%20Keep%20Your%20Device%20Operational%20EN.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_ny'],
        resolution: '360p',
        size_kb: 1054,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/Digital%20Skills/zm_ny/03.%20How%20to%20keep%20%20your%20device%20operational_NYA_360p.mp4',
      },

      {
        id: '',
        locale_codes: ['zm_bem'],
        resolution: '360p',
        size_kb: 10930,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/Digital%20Skills/03.%20How%20to%20Keep%20Your%20Device%20Operational_BEM_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_loz'],
        resolution: '360p',
        size_kb: 10320,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/Digital%20Skills/03.%20How%20to%20Keep%20Your%20Device%20Operational_LOZ_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_lue'],
        resolution: '360p',
        size_kb: 13300,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/Digital%20Skills/03.%20How%20to%20Keep%20Your%20Device%20Operational_LUV_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_kqn'],
        resolution: '360p',
        size_kb: 18530,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/Digital%20Skills/03.%20How%20to%20Keep%20Your%20Device%20Operational_KON_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_lun'],
        resolution: '360p',
        size_kb: 16710,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/Digital%20Skills/03.%20How%20to%20Keep%20Your%20Device%20Operational_LND_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_toi'],
        resolution: '360p',
        size_kb: 13730,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/Digital%20Skills/03.%20How%20to%20Keep%20Your%20Device%20Operational_TNG_360p.mp4',
      },
      // MW
      // {
      //   id: '',
      //   locale_codes: ['mw_ny'],
      //   resolution: '360p',
      //   size_kb: 0,
      //   supabase_url: '',
      // },
      {
        id: '',
        locale_codes: ['mw_tum'],
        resolution: '360p',
        size_kb: 11600,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/mw/videos/Digital%20Skills/03.%20How%20to%20Keep%20Your%20Device%20Operational_TUM_360p.mp4',
      },
    ],
  },
  '4_digital_information': {
    title: translateMarker('How to Search for and Evaluate Digital Information'),
    children: [
      {
        id: '',
        locale_codes: ['global_en'],
        resolution: '360p',
        size_kb: 7790,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/global/videos/Digital%20Skills/04%20%20How%20to%20Search%20for%20and%20Evaluate%20Digital%20Information%20EN.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_ny'],
        resolution: '360p',
        size_kb: 6810,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/Digital%20Skills/zm_ny/04.%20How%20to%20Search%20for%20and%20Evaluate%20Digital%20Information_NYA_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_bem'],
        resolution: '360p',
        size_kb: 5670,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/Digital%20Skills/04.%20How%20to%20Search%20for%20and%20Evaluate%20Digital%20Information_BEM_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_loz'],
        resolution: '360p',
        size_kb: 6280,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/Digital%20Skills/04.%20How%20to%20Search%20for%20and%20Evaluate%20Digital%20Information_LOZ_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_lue'],
        resolution: '360p',
        size_kb: 6520,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/Digital%20Skills/04.%20How%20to%20Search%20for%20and%20Evaluate%20Digital%20Information_LUV_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_kqn'],
        resolution: '360p',
        size_kb: 8430,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/Digital%20Skills/04.%20How%20to%20Search%20for%20and%20Evaluate%20Digital%20Information_KON_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_lun'],
        resolution: '360p',
        size_kb: 7730,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/Digital%20Skills/04.%20How%20to%20Search%20for%20and%20Evaluate%20Digital%20Information_LND_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_toi'],
        resolution: '360p',
        size_kb: 4890,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/Digital%20Skills/04.%20How%20to%20Search%20for%20and%20Evaluate%20Digital%20Information_TNG_360p.mp4',
      },
      // MW
      // {
      //   id: '',
      //   locale_codes: ['mw_ny'],
      //   resolution: '360p',
      //   size_kb: 0,
      //   supabase_url: '',
      // },
      {
        id: '',
        locale_codes: ['mw_tum'],
        resolution: '360p',
        size_kb: 5620,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/mw/videos/Digital%20Skills/04.%20How%20to%20Search%20for%20and%20Evaluate%20Digital%20Information_TUM_360p.mp4',
      },
    ],
  },
  '5_share_content': {
    title: translateMarker('How to share content with others'),
    children: [
      {
        id: '',
        locale_codes: ['global_en'],
        resolution: '360p',
        size_kb: 6470,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/global/videos/Digital%20Skills/05%20%20How%20to%20share%20content%20with%20others%20EN.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_ny'],
        resolution: '360p',
        size_kb: 5580,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/Digital%20Skills/zm_ny/05.%20How%20to%20share%20content%20with%20others_NYA_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_bem'],
        resolution: '360p',
        size_kb: 4810,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/Digital%20Skills/05.%20How%20to%20share%20content%20with%20others_BEM_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_loz'],
        resolution: '360p',
        size_kb: 4410,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/Digital%20Skills/05.%20How%20to%20share%20content%20with%20others_LOZ_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_lue'],
        resolution: '360p',
        size_kb: 5120,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/Digital%20Skills/05.%20How%20to%20share%20content%20with%20others_LUV_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_kqn'],
        resolution: '360p',
        size_kb: 8390,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/Digital%20Skills/05.%20How%20to%20share%20content%20with%20others_KON_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_lun'],
        resolution: '360p',
        size_kb: 6450,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/Digital%20Skills/05.%20How%20to%20share%20content%20with%20others_LND_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_toi'],
        resolution: '360p',
        size_kb: 6200,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/Digital%20Skills/05.%20How%20to%20Share%20Content%20With%20Others_TNG_360p.mp4',
      },
      // MW
      // {
      //   id: '',
      //   locale_codes: ['mw_ny'],
      //   resolution: '360p',
      //   size_kb: 0,
      //   supabase_url: '',
      // },
      {
        id: '',
        locale_codes: ['mw_tum'],
        resolution: '360p',
        size_kb: 5130,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/mw/videos/Digital%20Skills/05.%20How%20to%20share%20content%20with%20others_TUM_360p.mp4',
      },
    ],
  },
  '6_create_content': {
    title: translateMarker('How to Create Your Own Content'),
    children: [
      {
        id: '',
        locale_codes: ['global_en'],
        resolution: '360p',
        size_kb: 9480,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/global/videos/Digital%20Skills/06%20%20How%20to%20Create%20Your%20Own%20Content%20EN.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_ny'],
        resolution: '360p',
        size_kb: 8100,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/Digital%20Skills/zm_ny/06.%20%20How%20to%20Create%20Your%20Own%20Content_NYA_360p.mp4',
      },

      {
        id: '',
        locale_codes: ['zm_bem'],
        resolution: '360p',
        size_kb: 6700,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/Digital%20Skills/06.%20How%20to%20Create%20Your%20Own%20Content_BEM_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_loz'],
        resolution: '360p',
        size_kb: 6690,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/Digital%20Skills/06.%20How%20to%20Create%20Your%20Own%20Content_LOZ_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_lue'],
        resolution: '360p',
        size_kb: 6600,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/Digital%20Skills/06.%20How%20to%20Create%20Your%20Own%20Content_LUV_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_kqn'],
        resolution: '360p',
        size_kb: 9630,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/Digital%20Skills/06.%20How%20to%20Create%20Your%20Own%20Content_KON_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_lun'],
        resolution: '360p',
        size_kb: 8720,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/Digital%20Skills/06.%20How%20to%20Create%20Your%20Own%20Content_LND_360p.mp4',
      },
      {
        id: '',
        locale_codes: ['zm_toi'],
        resolution: '360p',
        size_kb: 7680,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/Digital%20Skills/06.%20How%20to%20Create%20Your%20Own%20Content_TNG_360p.mp4',
      },
      // MW
      // {
      //   id: '',
      //   locale_codes: ['mw_ny'],
      //   resolution: '360p',
      //   size_kb: 0,
      //   supabase_url: '',
      // },
      {
        id: '',
        locale_codes: ['mw_tum'],
        resolution: '360p',
        size_kb: 6770,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/mw/videos/Digital%20Skills/06.%20How%20to%20Create%20Your%20Own%20Content_TUM_360p.mp4',
      },
    ],
  },
};

export const PICSA_VIDEO_DIGITAL_SKILLS_DATA: IPicsaVideoData[] = Object.entries(PICSA_VIDEO_DIGITAL_SKILLS_BASE).map(
  ([id, entry]) => ({
    ...entry,
    id,
    children: entry.children.map((child) => {
      const { locale_codes, resolution } = child;
      const [locale_code] = locale_codes;
      child.id = `digital_skills_${id}_${locale_code}_${resolution}`;
      return child;
    }),
  }),
);

export const PICSA_VIDEO_DIGITAL_SKILLS_HASHMAP: Record<string, IPicsaVideoData> = arrayToHashmap(
  PICSA_VIDEO_DIGITAL_SKILLS_DATA,
  'id',
);
