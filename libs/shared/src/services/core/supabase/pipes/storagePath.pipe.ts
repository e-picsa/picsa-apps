import { inject,Pipe, PipeTransform } from '@angular/core';

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
  standalone: true,
})
export class StoragePathPipe implements PipeTransform {
  private storageService = inject(SupabaseStorageService);

  transform(path: string): string {
    const [bucketId, ...pathSegments] = path.split('/');
    const objectPath = pathSegments.join('/');
    return this.storageService.getPublicLink(bucketId, objectPath);
  }
}
