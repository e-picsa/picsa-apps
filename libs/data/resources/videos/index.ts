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

const steps = hackGenerateLegacyResources(PICSA_FARMER_VIDEOS_DATA);
const testimonials = hackGenerateLegacyResources(PICSA_VIDEO_TESTIMONIAL_DATA);

export const RESOURCE_VIDEO_HASHMAP = {
  ...arrayToHashmap(steps, 'id'),
  ...arrayToHashmap(testimonials, 'id'),
};

export * from './picsaSteps';
export * from './testimonials';
