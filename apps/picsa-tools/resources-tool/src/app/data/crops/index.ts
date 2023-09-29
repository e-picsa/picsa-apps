import { IResourceCollection, IResourceFile, IResourceLink } from '../../schemas';

const files: { [key: string]: IResourceFile } = {
  gap: {
    id: 'gap',
    type: 'file',
    title: 'Guide to Agriculture Production',
    description: 'And Natural Resource Management in Malawi',
    cover: { image: 'assets/resources/covers/gap.jpg' },
    url: 'https://firebasestorage.googleapis.com/v0/b/picsa-apps.appspot.com/o/crop-info%2FGAP_2021.pdf?alt=media&token=4832ad76-cf14-490f-8fba-73bd5845d440',
    filename: 'GAP_2021.pdf',
    md5Checksum: 'ea0e86161b3eae185ff5bbce71975057',
    size_kb: 3645.5,
    mimetype: 'application/pdf',
    filter: { countries: ['mw'] },
  },
  bmtm: {
    id: 'bmtm',
    type: 'file',
    title: 'Business Models Training Manual',
    description: 'For Linking Producers and Processors',
    cover: { image: 'assets/resources/covers/bmtm.jpg' },
    url: 'https://firebasestorage.googleapis.com/v0/b/picsa-apps.appspot.com/o/crop-info%2FBUSINESS%20MODELS%20TRAINING%20MANUAL.pdf?alt=media&token=e682f443-1163-4894-88a7-7ea9851512a8',
    filename: 'BUSINESS MODELS TRAINING MANUAL.pdf',
    md5Checksum: '16fd9bf6d037d9b05607e562de090a82',
    size_kb: 1425.3,
    mimetype: 'application/pdf',
    filter: { countries: ['mw'] },
  },
};

const links: { [key: string]: IResourceLink } = {
  accessAg: {
    id: 'accessAg',
    type: 'link',
    title: 'Access Agriculture',
    description: 'Agricultural training videos in local languages',
    subtype: 'website',
    cover: { image: 'assets/resources/covers/access-ag.jpg' },
    url: 'https://www.accessagriculture.org',
  },
};

const apps: { [key: string]: IResourceLink } = {
  plantwise: {
    id: 'plantwise',
    type: 'link',
    subtype: 'play_store',
    title: 'Plantwise Factsheets Library',
    description: 'Library of clear, practical and safe advice for tackling crop problems',
    cover: { image: 'assets/resources/covers/plantwise.webp' },
    url: 'org.cabi.pfff',
  },
  plantix: {
    id: 'plantix',
    type: 'link',
    subtype: 'play_store',
    title: 'Plantix',
    description: 'Crop diagnosis and information',
    cover: { image: 'assets/resources/covers/plantix.webp' },
    url: 'com.peat.GartenBank',
  },
  zaulimi: {
    id: 'zaulimi',
    type: 'link',
    subtype: 'play_store',
    title: 'Zaulimi',
    description: 'Production and marketing information for crops, livestock and baobab.',
    cover: { image: 'assets/resources/covers/zaulimi.webp' },
    url: 'mw.glide.zaulimi',
  },
  mlimi: {
    id: 'mlimi',
    type: 'link',
    subtype: 'play_store',
    title: 'Mlimi',
    description: 'Malawi crop and weather advisories',
    cover: { image: 'assets/resources/covers/mlimi.webp' },
    url: 'org.farmradiomw.mlimi',
  },
  daes_v2: {
    id: 'daes_v2',
    type: 'link',
    subtype: 'play_store',
    title: 'DAES V2',
    description: 'Malawi agriculture and livestock information',
    cover: { image: 'assets/resources/covers/daes_v2.webp' },
    url: 'com.zengonet.app',
  },
};

/** Main collection that hosts child resources */
const cropResources: IResourceCollection = {
  id: 'cropResources',
  type: 'collection',
  title: 'Crop, Pest & Disease',
  description: 'Resources to help care for crops',
  cover: { image: 'assets/resources/covers/crops.svg' },
  priority: 7,
  childResources: {
    collections: [],
    files: Object.keys(files),
    links: [...Object.keys(links), ...Object.keys(apps)],
  },
};

export default {
  cropResources,
  ...files,
  ...links,
  ...apps,
};
