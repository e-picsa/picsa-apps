import { inject, Pipe, PipeTransform } from '@angular/core';

import { SupabaseStorageService } from '../services/supabase-storage.service';

/**
 * Convert a fully qualified storage path to public url
 * @example
 * ```
 * <img [src]="'my_bucket/folder/image.png' | storagePath "
 * ```
 */
@Pipe({
  name: 'storagePath',
})
export class StoragePathPipe implements PipeTransform {
  private storageService = inject(SupabaseStorageService);

  transform(path: string | null | undefined): string {
    if (!path) return '';
    const [bucketId, ...pathSegments] = path.split('/');
    if (!bucketId) return '';
    const objectPath = pathSegments.join('/');
    try {
      return this.storageService.getPublicLink(bucketId, objectPath);
    } catch {
      return '';
    }
  }
}
