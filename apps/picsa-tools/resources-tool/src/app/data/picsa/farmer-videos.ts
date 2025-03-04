import { RESOURCE_VIDEO_HASHMAP } from '@picsa/data/resources';

import { IResourceCollection } from '../../schemas';

/**************************************************************************
 * Legacy Resource Format
 * Support legacy resources system where each resource child has own db entry
 *
 * TODO - migrate all resources to use modern format so code below can be removed
 ***************************************************************************/

const files = Object.keys(RESOURCE_VIDEO_HASHMAP);

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
  ...RESOURCE_VIDEO_HASHMAP,
  picsa_videos_farmer,
};
