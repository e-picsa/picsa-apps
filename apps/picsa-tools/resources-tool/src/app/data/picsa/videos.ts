import { IResourceCollection, IResourceFile } from '../../schemas';

const picsa_videos: IResourceCollection = {
  id: 'picsa_videos',
  priority: 10,
  type: 'collection',
  title: 'PICSA Videos',
  description: 'Training videos to support PICSA',
  cover: {
    image: 'assets/resources/covers/videos.svg',
  },
  childResources: { collections: ['picsa_videos_extension', 'picsa_videos_farmer'], files: [], links: [] },
};

export default { picsa_videos };
