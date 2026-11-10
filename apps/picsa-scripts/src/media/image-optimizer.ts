import * as path from 'path';
import sharp from 'sharp';

/**
 * Format bytes into human-readable string (e.g. '12.4 KB', '2.1 MB')
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2));
  return `${val} ${sizes[i]}`;
}

/**
 * Resolve target optimized filename.
 * Vector SVGs remain SVGs, raster images are converted to .webp extension.
 */
export function getOptimizedFilename(originalFilename: string): string {
  if (originalFilename.toLowerCase().endsWith('.svg')) return originalFilename;
  const { name } = path.parse(originalFilename);
  return `${name}.webp`;
}

/**
 * Optimizes a raster image to max 300px dimension and converts to WebP at 80% quality.
 * Vector SVGs are returned unchanged.
 */
export async function optimizeCoverBuffer(buffer: Buffer, filename: string): Promise<Buffer> {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.svg') {
    return buffer;
  }

  return sharp(buffer)
    .resize(300, 300, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 80 })
    .toBuffer();
}
