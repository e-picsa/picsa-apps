import { arrayToHashmap } from '@picsa/utils';
import { PICSA_FARMER_VIDEOS_DATA } from './picsaSteps';
import { PICSA_VIDEO_TESTIMONIAL_DATA } from './testimonials';
import { hackGenerateLegacyResources } from './utils';

/**************************************************************************
 * Legacy Resource Format
 * Support legacy resources system where each resource child has own db entry
 *
 * TODO - migrate all resources to use modern format so code below can be removed
 ***************************************************************************/

const PICSA_FARMER_VIDEO_RESOURCES = hackGenerateLegacyResources(PICSA_FARMER_VIDEOS_DATA);
const PICSA_VIDEO_TESTIMONIAL_RESOURCES = hackGenerateLegacyResources(PICSA_VIDEO_TESTIMONIAL_DATA);

export const PICSA_FARMER_VIDEO_RESOURCES_HASHMAP = arrayToHashmap(PICSA_FARMER_VIDEO_RESOURCES, 'id');
export const PICSA_VIDEO_TESTIMONIAL_RESOURCES_HASHMAP = arrayToHashmap(PICSA_VIDEO_TESTIMONIAL_RESOURCES, 'id');

export * from './picsaSteps';
export * from './testimonials';
