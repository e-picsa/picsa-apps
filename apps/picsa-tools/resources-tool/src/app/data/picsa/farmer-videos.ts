import { PICSA_FARMER_VIDEO_RESOURCES_HASHMAP, PICSA_VIDEO_TESTIMONIAL_RESOURCES_HASHMAP } from '@picsa/data/resources';

import { IResourceCollection } from '../../schemas';

/**************************************************************************
 * Legacy Resource Format
 * Support legacy resources system where each resource child has own db entry
 *
 * TODO - migrate all resources to use modern format so code below can be removed
 ***************************************************************************/

const files = [
  ...Object.keys(PICSA_FARMER_VIDEO_RESOURCES_HASHMAP),
  ...Object.keys(PICSA_VIDEO_TESTIMONIAL_RESOURCES_HASHMAP),
];

/**
 * Create a collection to store all farmer videos populated to hardcoded data
 */
const picsa_videos_farmer: IResourceCollection = {
  id: 'picsa_videos_farmer',
  priority: 10,
  type: 'collection',
  title: 'Farmer Videos',
  description: 'Training videos to support PICSA',
  childResources: { collections: [], files, links: [] },
  parentCollection: 'picsa_videos',
};

export default {
  ...PICSA_FARMER_VIDEO_RESOURCES_HASHMAP,
  ...PICSA_VIDEO_TESTIMONIAL_RESOURCES_HASHMAP,
  picsa_videos_farmer,
};
