import { IResourceCollection, IResourceFile } from '../../models';

type IPicsaManualId =
  | 'picsa_manual'
  | 'picsa_manual_farmer'
  | 'picsa_manual_chichewa'
  | 'picsa_manual_chichewa_farmer'
  | 'picsa_manual_tumbuka'
  | 'picsa_manual_tajik';

/**
 * List of manuals available both within manual tool and resource collection
 * Exported standalone to also allow direct access from resources tool
 */
export const PICSA_MANUAL_RESOURCES: { [id in IPicsaManualId]: IResourceFile } = {
  picsa_manual: {
    _key: 'picsa_manual',
    _created: '2019-09-25T10:00:01.000Z',
    _modified: '2019-09-25T11:00:01.000Z',
    title: 'PICSA Manual (Extension)',
    language: 'english',
    mimetype: 'application/pdf',
    description: '',
    subtitle: '',
    filename: 'picsa-field-manual-en.pdf',
    type: 'file',
    url: 'https://firebasestorage.googleapis.com/v0/b/picsa-apps.appspot.com/o/picsa%2Fmanuals%2Fpicsa-manual.pdf?alt=media&token=8d5c21da-2252-44b7-8709-a3f12a593c2f',
    keywords: ['manual', 'extension'],
  },
  picsa_manual_farmer: {
    _key: 'picsa_manual_farmer',
    _created: '2019-09-25T10:00:01.000Z',
    _modified: '2019-09-25T11:00:01.000Z',
    title: 'PICSA Manual (Farmer)',
    language: 'english',
    mimetype: 'application/pdf',
    description: '',
    subtitle: '',
    filename: 'picsa-manual-farmer.pdf',
    type: 'file',
    url: 'https://firebasestorage.googleapis.com/v0/b/picsa-apps.appspot.com/o/picsa%2Fmanuals%2Fpicsa-manual-farmer.pdf?alt=media&token=92ddbd84-7ae8-44d5-ac27-5876e92fab37',
    keywords: ['manual', 'farmer'],
  },
  picsa_manual_chichewa: {
    _key: 'picsa_manual_chichewa',
    _created: '2019-09-25T10:00:02.000Z',
    _modified: '2019-09-27T15:00:03.000Z',
    title: 'Buku la PICSA (Extension)',
    mimetype: 'application/pdf',
    language: 'chichewa',
    description: '',
    subtitle: 'Extension',
    filename: 'picsa-manual-chichewa.pdf',
    type: 'file',
    url: 'https://firebasestorage.googleapis.com/v0/b/picsa-apps.appspot.com/o/picsa%2Fmanuals%2Fpicsa-manual-chichewa.pdf?alt=media&token=d03031db-9e83-4a0a-a5be-7c3d1d42f98b',
    appCountries: ['mw', 'zm'],
    keywords: ['manual', 'extension'],
  },
  picsa_manual_chichewa_farmer: {
    _key: 'picsa_manual_chichewa_farmer',
    _created: '2019-09-25T10:00:02.000Z',
    _modified: '2019-09-27T15:00:03.000Z',
    title: 'Buku la PICSA (Farmer)',
    mimetype: 'application/pdf',
    language: 'chichewa',
    description: '',
    subtitle: '',
    filename: 'picsa-manual-chichewa-farmer.pdf',
    type: 'file',
    url: 'https://firebasestorage.googleapis.com/v0/b/picsa-apps.appspot.com/o/picsa%2Fmanuals%2Fpicsa-manual-chichewa-farmer.pdf?alt=media&token=c43a2f2a-ae68-49b9-bb15-31ad788c48d5',
    appCountries: ['mw', 'zm'],
    keywords: ['manual', 'farmer'],
  },
  picsa_manual_tumbuka: {
    _key: 'picsa_manual_tumbuka',
    _created: '2019-09-25T10:00:03.000Z',
    _modified: '2019-09-27T15:00:05.000Z',
    title: 'Buku la PICSA',
    mimetype: 'application/pdf',
    description: '',
    language: 'tumbuka',
    subtitle: '',
    filename: 'picsa-field-manual-tumbuka.pdf',
    type: 'file',
    url: 'https://firebasestorage.googleapis.com/v0/b/picsa-apps.appspot.com/o/picsa%2Fmanuals%2Fpicsa-manual-tumbuka.pdf?alt=media&token=ccaa5881-2200-48de-8799-69179b8109e0',
    appCountries: ['mw', 'zm'],
    keywords: ['manual', 'extension'],
  },
  picsa_manual_tajik: {
    _key: 'picsa_manual_tajik',
    _created: '2022-10-05T10:00:03.000Z',
    _modified: '2022-10-05T15:00:05.000Z',
    title: 'ПИКСА (Забони тоҷикӣ)',
    mimetype: 'application/pdf',
    description: '',
    language: 'tajik',
    subtitle: '',
    filename: 'picsa_manual_tajik.pdf',
    type: 'file',
    url: 'https://firebasestorage.googleapis.com/v0/b/picsa-apps.appspot.com/o/picsa%2Fmanuals%2Fpicsa_manual_tajik.pdf?alt=media&token=b8669e3c-9eae-4443-b743-6b1881990d81',
    appCountries: ['tj'],
    keywords: ['manual', 'extension'],
  },
};

const picsa_manuals: IResourceCollection = {
  _created: '2019-09-25T10:00:04.000Z',
  _modified: '2019-09-27T11:00:01.000Z',
  _key: 'picsaManual',
  priority: 10.1,
  type: 'collection',
  title: 'PICSA Manual',
  description: 'PICSA training manuals available in a variety of languages',
  image: 'assets/resources/covers/picsa-field-manual.jpg',
  imageFit: 'cover',
  childResources: Object.keys(PICSA_MANUAL_RESOURCES),
};

export default { ...PICSA_MANUAL_RESOURCES, picsa_manuals };
