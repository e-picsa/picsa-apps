import { arrayToHashmap } from '@picsa/utils';
import type { IResourceFile } from '@picsa/resources/src/app/schemas';
import { IPicsaVideoData } from './types';

type IPicsaFarmerVideoId =
  | 'intro'
  | 'ram'
  | 'seasonal_calendar'
  | 'historic_climate'
  | 'probability_risk'
  | 'options'
  | 'participatory_budget';

const PICSA_FARMER_VIDEOS_BASE: Record<IPicsaFarmerVideoId, Omit<IPicsaVideoData, 'id'>> = {
  intro: {
    children: [
      {
        id: '',
        locale_code: 'mw_ny',
        resolution: '360p',
        size_kb: 12900,
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/mw/videos/PICSA%20Intro.mp4?t=2024-08-02T05%3A17%3A54.946Z',
      },
    ],
  },
  ram: {
    children: [
      {
        id: '',
        locale_code: 'global_en',
        size_kb: 14840,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/global/videos/PICSA%20Steps/1a%20%20Resource%20Allocation%20Map.mp4',
      },
    ],
  },
  seasonal_calendar: {
    children: [
      {
        id: '',
        locale_code: 'global_en',
        size_kb: 12950,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/global/videos/PICSA%20Steps/1b%20%20Seasonal%20Calendar.mp4',
      },
    ],
  },
  historic_climate: {
    children: [
      {
        id: '',
        locale_code: 'global_en',
        size_kb: 20710,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/global/videos/PICSA%20Steps/2%20%20Historical%20Climate%20Information.mp4',
      },
    ],
  },
  probability_risk: {
    children: [
      {
        id: '',
        locale_code: 'global_en',
        size_kb: 20800,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/global/videos/PICSA%20Steps/3%20%20What%20are%20the%20risks%20and%20opportunities.mp4',
      },
    ],
  },
  options: {
    children: [
      {
        id: '',
        locale_code: 'global_en',
        size_kb: 19680,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/global/videos/PICSA%20Steps/4%20%20Crop,%20Livestock%20and%20Livelihood%20Options.mp4',
      },
    ],
  },
  participatory_budget: {
    children: [
      {
        id: '',
        locale_code: 'global_en',
        size_kb: 21720,
        resolution: '360p',
        supabase_url:
          'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/global/videos/PICSA%20Steps/5%20%20Particpatory%20Budget.mp4',
      },
    ],
  },
};

export const PICSA_FARMER_VIDEOS_DATA: IPicsaVideoData[] = Object.entries(PICSA_FARMER_VIDEOS_BASE).map(
  ([id, entry]) => ({
    id: id as IPicsaFarmerVideoId,
    children: entry.children.map((child) => {
      const { locale_code, resolution } = child;
      child.id = `farmer_${id}_${locale_code}_${resolution}`;
      return child;
    }),
  })
);

export const PICSA_FARMER_VIDEOS_HASHMAP: Record<IPicsaFarmerVideoId, IPicsaVideoData> = arrayToHashmap(
  PICSA_FARMER_VIDEOS_DATA,
  'id'
);

/**************************************************************************
 * Legacy Resource Format
 * Support legacy resources system where each resource child has own db entry
 *
 * TODO - migrate all resources to use modern format so code below can be removed
 ***************************************************************************/

export const PICSA_FARMER_VIDEO_RESOURCES = hackGenerateLegacyResources();

export const PICSA_FARMER_VIDEO_RESOURCES_HASHMAP = arrayToHashmap(PICSA_FARMER_VIDEO_RESOURCES, 'id');

/**
 * HACK - generate a list of legacy resources from updated farmer data
 */
function hackGenerateLegacyResources() {
  const resources: IResourceFile[] = [];
  for (const { children } of PICSA_FARMER_VIDEOS_DATA) {
    for (const { id, size_kb, supabase_url } of children) {
      const resourceFile: IResourceFile = {
        id,
        filename: `${id}.mp4`,
        md5Checksum: '',
        mimetype: 'video/mp4',
        size_kb,
        subtype: 'video',
        title: '',
        type: 'file',
        url: supabase_url,
      };
      resources.push(resourceFile);
    }
  }
  return resources;
}
