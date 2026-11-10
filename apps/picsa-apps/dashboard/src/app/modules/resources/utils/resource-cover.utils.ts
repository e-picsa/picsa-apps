import { FallbackImageType, getFallbackTypeForMimetype } from '@picsa/components';

/**
 * Determine fallback image type based on file mimetype.
 * Delegates to the shared resolver alongside FALLBACK_IMAGE_CONFIGS.
 */
export function getFileFallbackType(mimetype?: string | null): FallbackImageType {
  return getFallbackTypeForMimetype(mimetype);
}
