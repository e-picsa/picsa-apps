import { arrayToHashmap } from '@picsa/utils';
import { IPicsaVideoData } from '../types';

type IPicsaOperationalVideoID = 'intro' | 'historic_climate' | 'options' | 'participatory_budget';

const PICSA_OPERATIONAL_VIDEOS_BASE: Record<IPicsaOperationalVideoID, Omit<IPicsaVideoData, 'id'>> = {
  intro: {
    children: [
      {
        id: '',
        // HACK - zm_ny shown for all while waiting on other videos
        locale_codes: ['zm_ny', 'global_en'],
        resolution: '480p',
        size_kb: 22300,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/zm/videos/operational/overall.mp4',
      },
    ],
  },

  historic_climate: {
    children: [
      {
        id: '',
        // HACK - zm_ny shown for all while waiting on other videos
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
        // HACK - zm_ny shown for all while waiting on other videos
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
        // HACK - zm_ny shown for all while waiting on other videos
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
  })
);

export const PICSA_OPERATIONAL_VIDEOS_HASHMAP: Record<IPicsaOperationalVideoID, IPicsaVideoData> = arrayToHashmap(
  PICSA_OPERATIONAL_VIDEOS_DATA,
  'id'
);
