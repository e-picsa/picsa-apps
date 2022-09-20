import { IResourceCollection } from '../models';

const collections: { [id: string]: IResourceCollection } = {
  picsaManual: {
    _created: '2019-09-25T10:00:04.000Z',
    _modified: '2019-09-27T11:00:01.000Z',
    _key: 'picsaManual',
    priority: 10,
    type: 'collection',
    title: 'PICSA Manual',
    description: 'PICSA training manuals available in a variety of languages',
    image: 'assets/resources/covers/picsa-field-manual.jpg',
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
    type: 'collection',
    title: 'PICSA Videos',
    description: 'Training videos to support PICSA',
    image: 'assets/resources/covers/ram-refresher.jpg',
    childResources: ['m6I8TfROsyr5Wp73BcAd'],
  },
  dccms: {
    _created: '2019-09-25T10:00:04.000Z',
    _modified: '2019-09-27T11:00:01.000Z',
    _key: 'dccms',
    type: 'collection',
    title: 'DCCMS',
    description:
      'Malawi Department of Climate Change and Meteorological Services',
    image: 'assets/resources/covers/dccms.jpg',
    childResources: ['dccms_daily_forecast', 'dccms_twitter'],
  },
  appsAndWebsites: {
    _created: '2019-05-25T10:00:04.000Z',
    _modified: '2019-05-27T11:00:01.000Z',
    _key: 'appsAndWebsites',
    type: 'collection',
    title: 'Apps and Websites',
    description: 'Links to other useful apps and websites',
    image: 'assets/resources/covers/apps.png',
    childResources: ['6VjjF3yZJejFigwDIPr8', 'meteoBlue'],
  },
};
export default collections;
