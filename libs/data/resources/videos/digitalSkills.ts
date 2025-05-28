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
  })
);

export const PICSA_VIDEO_DIGITAL_SKILLS_HASHMAP: Record<string, IPicsaVideoData> = arrayToHashmap(
  PICSA_VIDEO_DIGITAL_SKILLS_DATA,
  'id'
);
