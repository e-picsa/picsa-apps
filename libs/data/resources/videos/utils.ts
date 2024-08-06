import type { IResourceFile } from '@picsa/resources/src/app/schemas';

/**
 * HACK - generate a list of legacy resources from updated farmer data
 */
export function hackGenerateLegacyResources(videoData) {
  const resources: IResourceFile[] = [];
  for (const { children } of videoData) {
    for (const { id, size_kb, supabase_url } of children) {
      const resourceFile: IResourceFile = {
        id,
        filename: `${id}.mp4`,
        md5Checksum: '',
        mimetype: 'video/mp4',
        size_kb,
        subtype: 'video',
        title: '',
        type: 'file',
        url: supabase_url,
      };
      resources.push(resourceFile);
    }
  }
  return resources;
}
