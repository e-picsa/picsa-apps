import { arrayToHashmap } from '@picsa/utils';
import { IPicsaVideoData } from '../types';
import { hackGenerateLegacyResources } from './utils';

type ITestimonialId = 'victoria_ngombe' | 'john_tembo' | 'jackline_nkhoma' | 'dani_chambwe';

const PICSA_VIDEO_TESTIMONIAL_BASE: Record<ITestimonialId, Omit<IPicsaVideoData, 'id'>> = {
  victoria_ngombe: {
    title: '',
    children: [
      {
        id: '',
        locale_codes: ['mw_ny', 'global_en'],
        resolution: '360p',
        size_kb: 0,
        supabase_url: '',
      },
    ],
  },
  dani_chambwe: {
    title: '',
    children: [
      {
        id: '',
        locale_codes: ['mw_ny', 'global_en'],
        resolution: '360p',
        size_kb: 0,
        supabase_url: '',
      },
    ],
  },
  john_tembo: {
    title: '',
    children: [
      {
        id: '',
        locale_codes: ['zm_ny', 'global_en'],
        resolution: '360p',
        size_kb: 0,
        supabase_url: '',
      },
    ],
  },
  jackline_nkhoma: {
    title: '',
    children: [
      {
        id: '',
        locale_codes: ['zm_ny', 'global_en'],
        resolution: '360p',
        size_kb: 0,
        supabase_url: '',
      },
    ],
  },
};

export const PICSA_VIDEO_TESTIMONIAL_DATA: IPicsaVideoData[] = Object.entries(PICSA_VIDEO_TESTIMONIAL_BASE).map(
  ([id, entry]) => ({
    id: id as ITestimonialId,
    children: entry.children.map((child) => {
      const { locale_codes, resolution } = child;
      const [locale_code] = locale_codes;
      child.id = `farmer_${id}_${locale_code}_${resolution}`;
      return child;
    }),
  })
);

export const PICSA_VIDEO_TESTIMONIAL_HASHMAP: Record<ITestimonialId, IPicsaVideoData> = arrayToHashmap(
  PICSA_VIDEO_TESTIMONIAL_DATA,
  'id'
);

/**************************************************************************
 * Legacy Resource Format
 * Support legacy resources system where each resource child has own db entry
 *
 * TODO - migrate all resources to use modern format so code below can be removed
 ***************************************************************************/

export const PICSA_VIDEO_TESTIMONIAL_RESOURCES = hackGenerateLegacyResources(PICSA_VIDEO_TESTIMONIAL_DATA);

export const PICSA_VIDEO_TESTIMONIAL_RESOURCES_HASHMAP = arrayToHashmap(PICSA_VIDEO_TESTIMONIAL_RESOURCES, 'id');
