import { FallbackImageType, getFallbackTypeForMimetype } from '@picsa/components';

const COUNTRY_COVER_REGEX = /^([a-z]{2})\/resources\/covers\/(.+)$/;

/**
 * Determine fallback image type based on file mimetype.
 * Delegates to the shared resolver alongside FALLBACK_IMAGE_CONFIGS.
 */
export function getFileFallbackType(mimetype?: string | null): FallbackImageType {
  return getFallbackTypeForMimetype(mimetype);
}

/**
 * Normalizes a Supabase storage `cover_image` path to the bundled offline asset path
 * produced by `sync-resources.ts` (`getBundledAssetCoverPath`), converting raster images
 * to `.webp` while preserving `.svg` files and mapping `global/` vs `<country>/` folders.
 */
export function normalizeBundledCoverPath(storagePath?: string | null): string | null {
  if (!storagePath) return null;
  const clean = storagePath.trim();
  if (!clean) return null;
  if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('assets/')) {
    return clean;
  }
  const slashIdx = clean.lastIndexOf('/');
  const filename = slashIdx >= 0 ? clean.slice(slashIdx + 1) : clean;
  const dotIdx = filename.lastIndexOf('.');
  const optimized = filename.toLowerCase().endsWith('.svg')
    ? filename
    : `${dotIdx > 0 ? filename.slice(0, dotIdx) : filename}.webp`;

  if (clean.startsWith('global/resources/covers/')) {
    return `assets/resources/covers/${optimized}`;
  }
  const countryMatch = COUNTRY_COVER_REGEX.exec(clean);
  if (countryMatch) {
    return `assets/resources/covers/${countryMatch[1]}/${optimized}`;
  }
  return clean;
}
