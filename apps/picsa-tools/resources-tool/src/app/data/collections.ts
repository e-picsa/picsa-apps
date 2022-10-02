import { IResourceCollection } from '../models';

const collections: { [id: string]: IResourceCollection } = {
  picsaManual: {
    _created: '2019-09-25T10:00:04.000Z',
    _modified: '2019-09-27T11:00:01.000Z',
    _key: 'picsaManual',
    priority: 10.1,
    type: 'collection',
    title: 'PICSA Manual',
    description: 'PICSA training manuals available in a variety of languages',
    image: 'assets/resources/covers/picsa-field-manual.jpg',
    imageFit: 'cover',
    childResources: [
      '4I4F36gD0MUef26HfPZG',
      '9xqr6hxcWoVlsqydsNne',
      'lqsSRwYx3Lq1bFYG3lke',
    ],
  },
  picsaTrainingVideo: {
    _created: '2019-09-25T10:00:04.000Z',
    _modified: '2019-09-27T11:00:01.000Z',
    _key: 'picsaTrainingVideo',
    priority: 10,
    type: 'collection',
    title: 'PICSA Videos',
    description: 'Training videos to support PICSA',
    image: 'assets/resources/covers/ram-refresher.jpg',
    imageFit: 'cover',
    childResources: ['m6I8TfROsyr5Wp73BcAd'],
  },
};
export default collections;
