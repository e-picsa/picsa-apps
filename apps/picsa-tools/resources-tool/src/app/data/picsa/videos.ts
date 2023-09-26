import { IResourceCollection, IResourceVideo } from '../../models';

const videos: Record<string, IResourceVideo> = {
  ram_refresher: {
    _key: 'ram_refresher',
    _created: '2019-09-25T10:00:05.000Z',
    _modified: '2019-09-25T11:00:01.000Z',
    title: 'RAM Refresher',
    mimetype: 'video/mp4',
    description: 'A summary of how to create resource allocation maps (RAMs)',
    subtitle: '',
    filename: 'ram-refresher.mp4',
    type: 'video',
    image: 'assets/resources/covers/ram-refresher.jpg',
    url: 'https://firebasestorage.googleapis.com/v0/b/picsa-apps.appspot.com/o/picsa%2Fvideos%2Fram-refresher.mp4?alt=media&token=fcc2d91b-3e61-4def-a147-30eced72186c',
    size_kb: 11221.8,
    md5Checksum: '1ed969eee267505639eb81256227f176',
  },
};

const picsa_videos: IResourceCollection = {
  _created: '2019-09-25T10:00:04.000Z',
  _modified: '2019-09-27T11:00:01.000Z',
  _key: 'picsa_videos',
  priority: 10,
  type: 'collection',
  title: 'PICSA Videos',
  description: 'Training videos to support PICSA',
  image: 'assets/resources/covers/videos.svg',
  childResources: Object.keys(videos),
};

export default { ...videos, picsa_videos };
