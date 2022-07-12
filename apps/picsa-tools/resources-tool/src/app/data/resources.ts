import { IResource, IResourceGroup } from '../models';

/**
 * These resources are hard-coded into the app, and therefore should be made available in the
 * assets folder. Note, the order is specified via _created
 * To make changes, the _modified field should also be updated
 */

const grouped: IResourceGroup[] = [
  {
    _created: '2019-09-25T10:00:04.000Z',
    _modified: '2019-09-27T11:00:01.000Z',
    _key: 'picsaManual',
    type: 'group',
    title: 'PICSA Manual',
    description: 'PICSA training manuals available in a variety of languages',
    image: 'assets/resources/picsa-field-manual-cover.jpg',
    resources: [
      {
        _key: '4I4F36gD0MUef26HfPZG',
        _created: '2019-09-25T10:00:01.000Z',
        _modified: '2019-09-25T11:00:01.000Z',
        _isHardcoded: true,
        _isDownloaded: true,
        title: 'PICSA Manual',
        description: '',
        subtitle: '',
        filename: 'picsa-field-manual-en.pdf',
        type: 'file',
        image: 'assets/resources/picsa-field-manual-cover.jpg',
        weblink:
          'https://firebasestorage.googleapis.com/v0/b/picsa-apps.appspot.com/o/picsa-field-manual-en.pdf?alt=media&token=6e2f1601-80c8-4f56-9a3d-52789f08c303',
      },
      {
        _key: '9xqr6hxcWoVlsqydsNne',
        _created: '2019-09-25T10:00:02.000Z',
        _modified: '2019-09-27T15:00:03.000Z',
        _isHardcoded: true,
        _isDownloaded: true,
        title: 'Buku la PICSA',
        description: '',
        subtitle: 'Chichewa',
        filename: 'picsa-field-manual-chichewa.pdf',
        type: 'file',
        image: 'assets/resources/picsa-field-manual-cover-chichewa.jpg',
        weblink:
          'https://firebasestorage.googleapis.com/v0/b/extension-toolkit.appspot.com/o/Manuals%2Fpicsa-field-manual-chichewa.pdf?alt=media&token=7ab629a9-d2c1-4b37-8237-88825033708e',
      },
      {
        _key: 'lqsSRwYx3Lq1bFYG3lke',
        _created: '2019-09-25T10:00:03.000Z',
        _modified: '2019-09-27T15:00:05.000Z',
        _isHardcoded: true,
        _isDownloaded: true,
        title: 'Buku la PICSA',
        description: '',
        subtitle: 'Tumbuka',
        filename: 'picsa-field-manual-tumbuka.pdf',
        type: 'file',
        image: 'assets/resources/picsa-field-manual-cover-tumbuka.jpg',
        weblink:
          'https://firebasestorage.googleapis.com/v0/b/extension-toolkit.appspot.com/o/Manuals%2Fpicsa-field-manual-tumbuka.pdf?alt=media&token=31a885e7-d6fa-4903-a747-ed8f9f7168b3',
      },
    ],
  },
  {
    _created: '2019-09-25T10:00:04.000Z',
    _modified: '2019-09-27T11:00:01.000Z',
    _key: 'picsaTrainingVideo',
    type: 'group',
    title: 'PICSA Videos',
    description: 'Training videos to support PICSA',
    image: 'assets/resources/ram-refresher-cover.jpg',
    resources: [
      {
        _key: 'm6I8TfROsyr5Wp73BcAd',
        _created: '2019-09-25T10:00:05.000Z',
        _modified: '2019-09-25T11:00:01.000Z',
        title: 'RAM Refresher',
        description: '',
        subtitle: '',
        filename: 'ram-refresher.mp4',
        type: 'file',
        image: 'assets/resources/ram-refresher-cover.jpg',
        weblink:
          'https://firebasestorage.googleapis.com/v0/b/extension-toolkit.appspot.com/o/Resources%2Fram-refresher.mp4?alt=media&token=27939a71-0656-440b-8407-24877acaeede',
        // youtubeID: 'Kw5UznKvCN8',
      },
    ],
  },
];
const standalone: IResource[] = [
  {
    _key: '6VjjF3yZJejFigwDIPr8',
    _created: '2019-09-25T10:00:04.000Z',
    _modified: '2019-09-27T11:00:01.000Z',
    _isHardcoded: true,
    _isDownloaded: true,
    title: 'Potential Training Schedule',
    description: '',
    subtitle: '',
    filename: 'potential-PICSA-training-schedule.pdf',
    type: 'file',
    image: 'assets/resources/potential-PICSA-training-schedule-cover.png',
    weblink:
      'https://firebasestorage.googleapis.com/v0/b/extension-toolkit.appspot.com/o/Resources%2Fpotential-PICSA-training-schedule.pdf?alt=media&token=618737d1-949b-467a-9f28-1dcc35ce3c8c',
  },
];

const combined: IResource[] = ([] as IResource[]).concat(
  ...grouped.map((g) => g.resources),
  ...standalone
);

export default { grouped, standalone, combined };

// {
//   _key: '9Pkro1VYBUlwuNg5oHok',
//   _created: '2019-09-25T10:00:03.000Z',
//   _modified: '2019-09-25T11:00:01.000Z',
//   title: 'Crop Information',
//   subtitle: 'Chileka',
//   filename: 'crop-info-sheet-chileka.pdf',
//   type: 'pdf',
//   image: 'assets/resources/crop-info-sheet-chileka-cover.png',
//   group: 'Documents',
//   viewableBy: ['wfp-2017'],
//   weblink:
//     'https://firebasestorage.googleapis.com/v0/b/extension-toolkit.appspot.com/o/Resources%2Fcrop-info-sheet-chileka.pdf?alt=media&token=cb8a6243-1d37-43f6-a97c-a0a7bc0f11f2'
// },
// {
//   _key: 'Yx8927IVTGyM1C4njOIv',
//   _created: '2019-07-20T16:57:13.604Z',
//   _modified: '2019-07-20T16:57:13.604Z',
//   _deleted: true,
//   title: 'Seasonal Forecast',
//   subtitle: 'Mangochi 2017-2018',
//   filename: 'seasonal-forecast-mangochi-2017-2018.pdf',
//   type: 'pdf',
//   image: 'assets/resources/seasonal-forecast-mangochi-2017-2018.jpg',
//   group: 'Documents',
//   weblink:
//     'https://firebasestorage.googleapis.com/v0/b/extension-toolkit.appspot.com/o/Resources%2Fseasonal-forecast-mangochi-2017-2018.pdf?alt=media&token=c60180cd-8dcd-4d98-aa7e-48f37dc83849'
// }
