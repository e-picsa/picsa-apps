import type { IResourceFile } from '@picsa/resources/src/app/schemas';
import { IPicsaVideoData } from '../types';

/**
 * HACK - generate a list of legacy resources from updated farmer data
 */
export function hackGenerateLegacyResources(videos: IPicsaVideoData[]) {
  const resources: IResourceFile[] = [];
  for (const { children, description, title } of videos) {
    for (const { id, size_kb, supabase_url, locale_codes, resolution } of children) {
      const resourceFile: IResourceFile = {
        id,
        filename: `${id}.mp4`,
        md5Checksum: '',
        mimetype: 'video/mp4',
        size_kb,
        subtype: 'video',
        title: title || '',
        type: 'file',
        url: supabase_url,
        description,
      };
      resources.push(resourceFile);
    }
  }
  return resources;
}
