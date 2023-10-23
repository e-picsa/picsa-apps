import { IResourceCollection, IResourceFile } from '../../schemas';

const videos: Record<string, IResourceFile> = {
  ram_refresher: {
    id: 'ram_refresher',
    title: 'RAM Refresher',
    mimetype: 'video/mp4',
    description: 'A summary of how to create resource allocation maps (RAMs)',
    filename: 'ram-refresher.mp4',
    type: 'file',
    subtype: 'video',
    cover: { image: 'assets/resources/covers/ram-refresher.jpg' },
    url: 'https://firebasestorage.googleapis.com/v0/b/picsa-apps.appspot.com/o/picsa%2Fvideos%2Fram-refresher.mp4?alt=media&token=fcc2d91b-3e61-4def-a147-30eced72186c',
    size_kb: 11221.8,
    md5Checksum: '1ed969eee267505639eb81256227f176',
  },
};

const picsa_videos_extension: IResourceCollection = {
  id: 'picsa_videos_extension',
  priority: 10,
  type: 'collection',
  title: 'Extension Videos',
  description: 'Training videos to support PICSA',
  childResources: { collections: [], files: Object.keys(videos), links: [] },
  parentCollection: 'picsa_videos',
};

export default { ...videos, picsa_videos_extension };
