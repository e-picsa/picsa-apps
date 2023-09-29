import { IResourceCollection, IResourceLink } from '../../schemas';

const links: Record<string, IResourceLink> = {
  womenInExtension: {
    id: 'womenInExtension',
    title: 'Women in Extension',
    description: 'Access Agriculture Video',
    type: 'link',
    subtype: 'website',
    cover: { image: 'assets/resources/covers/access-ag.jpg' },
    url: 'https://www.accessagriculture.org/women-extension',
  },
  gfrasNelk: {
    id: 'gfrasNelk',
    title: 'GRAFS - New Extensionist Learning Kit NELK',
    description: 'Online learning modules',
    type: 'link',
    subtype: 'website',
    cover: { image: 'assets/resources/covers/gras-nelk.jpg' },
    url: 'https://www.g-fras.org/en/knowledge/new-extensionist-learning-kit-nelk.html#thematic-1-gender-in-advisory-services',
  },
};

const genderCollection: IResourceCollection = {
  id: 'genderCollection',
  title: 'Gender',
  description: 'Materials to help incorporate gender within extension services',
  type: 'collection',
  cover: { image: 'assets/resources/covers/gender-equality.svg' },
  childResources: {
    collections: [],
    files: [],
    links: Object.keys(links),
  },
};

export const GENDER_RESOURCES = { genderCollection, ...links };
