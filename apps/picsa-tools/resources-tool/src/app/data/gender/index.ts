import { IResourceCollection, IResourceFile, IResourceLink } from '../../models';

const links: Record<string, IResourceLink> = {
  womenInExtension: {
    _key: 'womenInExtension',
    _created: '2019-10-21T10:00:04.000Z',
    _modified: '2019-10-21T11:00:01.000Z',
    title: 'Women in Extension',
    description: 'Access Agriculture Video',
    type: 'link',
    image: 'assets/resources/covers/access-ag.jpg',
    url: 'https://www.accessagriculture.org/women-extension',
  },
  gfrasNelk: {
    _key: 'gfrasNelk',
    _created: '2019-10-21T10:00:04.000Z',
    _modified: '2019-10-21T11:00:01.000Z',
    title: 'GRAFS - New Extensionist Learning Kit NELK',
    description: 'Online learning modules',
    type: 'link',
    image: 'assets/resources/covers/gras-nelk.jpg',
    url: 'https://www.g-fras.org/en/knowledge/new-extensionist-learning-kit-nelk.html#thematic-1-gender-in-advisory-services',
  },
};
const files: Record<string, IResourceFile> = {};

const genderCollection: IResourceCollection = {
  _key: 'genderCollection',
  _created: '2019-10-21T10:00:04.000Z',
  _modified: '2019-10-21T11:00:01.000Z',
  title: 'Gender',
  description: 'Materials to help incorporate gender within extension services',
  type: 'collection',
  image: 'assets/resources/covers/gender-equality.svg',
  childResources: [...Object.keys(links), ...Object.keys(files)],
};

export const GENDER_RESOURCES = { genderCollection, ...links, ...files };
