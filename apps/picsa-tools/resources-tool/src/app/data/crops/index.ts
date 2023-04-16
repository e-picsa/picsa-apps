import type { IResourceApp, IResourceCollection, IResourceLink } from '../../models';

const links: { [key: string]: IResourceLink } = {
  accessAg: {
    _key: 'accessAg',
    _created: '2019-09-25T10:00:04.000Z',
    _modified: '2019-09-27T11:00:01.000Z',
    title: 'Access Agriculture',
    description:
      'Access Agriculture is a non-profit organisation that showcases agricultural training videos in local languages',
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
  zaulimi: {
    _key: 'zaulimi',
    _created: '2022-10-21T10:00:04.000Z',
    _modified: '2022-10-21T10:00:04.000Z',
    title: 'Zaulimi',
    description: 'Essential production and marketing information for selected crops, livestock and baobab.',
    subtitle: '',
    type: 'app',
    image: 'assets/resources/covers/zaulimi.webp',
    appId: 'mw.glide.zaulimi',
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
    ...Object.keys(links),
    ...Object.keys(apps),
  ],
};

export default {
  cropResources,
  ...links,
  ...apps,
};
