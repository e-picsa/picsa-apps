import { IResourceCollection } from '../models';

const collections: { [id: string]: IResourceCollection } = {
  picsaManual: {
    _created: '2019-09-25T10:00:04.000Z',
    _modified: '2019-09-27T11:00:01.000Z',
    _key: 'picsaManual',
    type: 'collection',
    title: 'PICSA Manual',
    description: 'PICSA training manuals available in a variety of languages',
    image: 'assets/resources/picsa-field-manual-cover.jpg',
    resources: [
      '4I4F36gD0MUef26HfPZG',
      '9xqr6hxcWoVlsqydsNne',
      'lqsSRwYx3Lq1bFYG3lke',
    ],
  },
  picsaTrainingVideo: {
    _created: '2019-09-25T10:00:04.000Z',
    _modified: '2019-09-27T11:00:01.000Z',
    _key: 'picsaTrainingVideo',
    type: 'collection',
    title: 'PICSA Videos',
    description: 'Training videos to support PICSA',
    image: 'assets/resources/ram-refresher-cover.jpg',
    resources: ['m6I8TfROsyr5Wp73BcAd'],
  },
  otherApps: {
    _created: '2019-05-25T10:00:04.000Z',
    _modified: '2019-05-27T11:00:01.000Z',
    _key: 'otherApps',
    type: 'collection',
    title: 'Apps and Games',
    description: 'Links to other useful apps and games',
    image: 'assets/resources/apps-cover.png',
    resources: ['6VjjF3yZJejFigwDIPr8'],
  },
};
export default collections;
