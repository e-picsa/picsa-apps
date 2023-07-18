import type { IResourceApp, IResourceCollection, IResourceLink, IResourceFile } from '../../models';

const files: { [key: string]: IResourceFile } = {
  gap: {
    _key: 'gap',
    _created: '2019-09-25T10:00:04.000Z',
    _modified: '2019-09-27T11:00:01.000Z',
    title: 'Guide to Agriculture Production',
    description: 'And Natural Resource Management in Malawi',
    subtitle: '',
    type: 'file',
    image: 'assets/resources/covers/gap.jpg',
    url: 'https://firebasestorage.googleapis.com/v0/b/picsa-apps.appspot.com/o/crop-info%2FGAP_2021.pdf?alt=media&token=4832ad76-cf14-490f-8fba-73bd5845d440',
    filename: 'GAP_2021.pdf',
    mimetype: 'application/pdf',
    appCountries: ['mw'],
  },
  bmtm: {
    _key: 'bmtm',
    _created: '2019-09-25T10:00:04.000Z',
    _modified: '2019-09-27T11:00:01.000Z',
    title: 'Business Models Training Manual',
    description: 'For Linking Producers and Processors',
    subtitle: '',
    type: 'file',
    image: 'assets/resources/covers/bmtm.jpg',
    url: 'https://firebasestorage.googleapis.com/v0/b/picsa-apps.appspot.com/o/crop-info%2FBUSINESS%20MODELS%20TRAINING%20MANUAL.pdf?alt=media&token=e682f443-1163-4894-88a7-7ea9851512a8',
    filename: 'BUSINESS MODELS TRAINING MANUAL.pdf',
    mimetype: 'application/pdf',
    appCountries: ['mw'],
  },
};
const links: { [key: string]: IResourceLink } = {
  accessAg: {
    _key: 'accessAg',
    _created: '2019-09-25T10:00:04.000Z',
    _modified: '2019-09-27T11:00:01.000Z',
    title: 'Access Agriculture',
    description: 'Agricultural training videos in local languages',
    subtitle: '',
    type: 'link',
    image: 'assets/resources/covers/access-ag.jpg',
    url: 'https://www.accessagriculture.org',
  },
};
const apps: { [key: string]: IResourceApp } = {
  plantwise: {
    _key: 'plantwise',
    _created: '2019-09-25T10:00:04.000Z',
    _modified: '2019-09-27T11:00:01.000Z',
    title: 'Plantwise Factsheets Library',
    description: 'Library of clear, practical and safe advice for tackling crop problems',
    subtitle: '',
    type: 'app',
    image: 'assets/resources/covers/plantwise.webp',
    appId: 'org.cabi.pfff',
  },
  plantix: {
    _key: 'plantix',
    _created: '2019-09-25T10:00:04.000Z',
    _modified: '2019-09-27T11:00:01.000Z',
    title: 'Plantix',
    description: 'Crop diagnosis and information',
    subtitle: '',
    type: 'app',
    image: 'assets/resources/covers/plantix.webp',
    appId: 'com.peat.GartenBank',
  },
  zaulimi: {
    _key: 'zaulimi',
    _created: '2022-10-21T10:00:04.000Z',
    _modified: '2022-10-21T10:00:04.000Z',
    title: 'Zaulimi',
    description: 'Production and marketing information for crops, livestock and baobab.',
    subtitle: '',
    type: 'app',
    image: 'assets/resources/covers/zaulimi.webp',
    appId: 'mw.glide.zaulimi',
  },
  mlimi: {
    _key: 'mlimi',
    _created: '2019-09-25T10:00:04.000Z',
    _modified: '2019-09-27T11:00:01.000Z',
    title: 'Mlimi',
    description: 'Malawi crop and weather advisories',
    subtitle: '',
    type: 'app',
    image: 'assets/resources/covers/mlimi.webp',
    appId: 'org.farmradiomw.mlimi',
  },
  daes_v2: {
    _key: 'daes_v2',
    _created: '2019-09-25T10:00:04.000Z',
    _modified: '2019-09-27T11:00:01.000Z',
    title: 'DAES V2',
    description: 'Malawi agriculture and livestock information',
    subtitle: '',
    type: 'app',
    image: 'assets/resources/covers/daes_v2.webp',
    appId: 'com.zengonet.app',
  },
};

/** Main collection that hosts child resources */
const cropResources: IResourceCollection = {
  _created: '2019-05-25T10:00:04.000Z',
  _modified: '2019-05-27T11:00:01.000Z',
  _key: 'cropResources',
  type: 'collection',
  title: 'Crop, Pest & Disease',
  description: 'Resources to help care for crops',
  image: 'assets/resources/covers/crops.svg',
  priority: 7,
  childResources: [
    // TODO - cropInfoCollection in Picsa Resources
    'cropInfoCollection',
    ...Object.keys(files),
    ...Object.keys(links),
    ...Object.keys(apps),
  ],
};

export default {
  cropResources,
  ...files,
  ...links,
  ...apps,
};
