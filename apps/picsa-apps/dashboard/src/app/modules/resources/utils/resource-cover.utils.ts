import { FallbackImageType } from '@picsa/components';

/**
 * Determine fallback image type based on file mimetype.
 */
export function getFileFallbackType(mimetype?: string | null): FallbackImageType {
  if (!mimetype) return 'document';
  if (mimetype === 'video/mp4' || mimetype.startsWith('video/')) return 'video';
  if (mimetype === 'application/pdf') return 'pdf';
  if (mimetype.startsWith('audio/')) return 'audio';
  if (mimetype.startsWith('image/')) return 'image';
  return 'document';
}
