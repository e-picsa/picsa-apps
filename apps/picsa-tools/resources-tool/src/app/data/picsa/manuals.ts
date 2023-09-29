import { IResourceCollection, IResourceFile } from '../../schemas';

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
    id: 'picsa_manual',
    type: 'file',
    title: 'PICSA Manual (Extension)',
    language: 'english',
    mimetype: 'application/pdf',
    description: '',
    filename: 'picsa-field-manual-en.pdf',
    url: 'https://firebasestorage.googleapis.com/v0/b/picsa-apps.appspot.com/o/picsa%2Fmanuals%2Fpicsa-manual.pdf?alt=media&token=8d5c21da-2252-44b7-8709-a3f12a593c2f',
    md5Checksum: 'ee548d6d7be566890f836d6e4cab24f7',
    size_kb: 1439.1,
    keywords: ['manual', 'extension'],
    priority: 1.1,
  },
  picsa_manual_farmer: {
    id: 'picsa_manual_farmer',
    type: 'file',
    title: 'PICSA Manual (Farmer)',
    language: 'english',
    mimetype: 'application/pdf',
    description: '',
    filename: 'picsa-manual-farmer.pdf',
    url: 'https://firebasestorage.googleapis.com/v0/b/picsa-apps.appspot.com/o/picsa%2Fmanuals%2Fpicsa-manual-farmer.pdf?alt=media&token=92ddbd84-7ae8-44d5-ac27-5876e92fab37',
    md5Checksum: '7d191f7148a023ac812daa0a2dd2826c',
    size_kb: 1183.5,
    keywords: ['manual', 'farmer'],
    priority: 1,
  },
  picsa_manual_chichewa: {
    id: 'picsa_manual_chichewa',
    type: 'file',
    title: 'Buku la PICSA (Extension)',
    mimetype: 'application/pdf',
    language: 'chichewa',
    description: '',
    filename: 'picsa-manual-chichewa.pdf',
    url: 'https://firebasestorage.googleapis.com/v0/b/picsa-apps.appspot.com/o/picsa%2Fmanuals%2Fpicsa-manual-chichewa.pdf?alt=media&token=d03031db-9e83-4a0a-a5be-7c3d1d42f98b',
    size_kb: 1999.8,
    md5Checksum: '80d3b08815a41c1124aab095b3fd4b8f',
    filter: {
      countries: ['mw', 'zm'],
    },
    keywords: ['manual', 'extension'],
    priority: 1,
  },
  picsa_manual_chichewa_farmer: {
    id: 'picsa_manual_chichewa_farmer',
    type: 'file',
    title: 'Buku la PICSA (Farmer)',
    mimetype: 'application/pdf',
    language: 'chichewa',
    description: '',
    filename: 'picsa-manual-chichewa-farmer.pdf',
    url: 'https://firebasestorage.googleapis.com/v0/b/picsa-apps.appspot.com/o/picsa%2Fmanuals%2Fpicsa-manual-chichewa-farmer.pdf?alt=media&token=c43a2f2a-ae68-49b9-bb15-31ad788c48d5',
    size_kb: 4331,
    md5Checksum: '21916722d4cbfc6e27ea15fb2f03145a',
    filter: {
      countries: ['mw', 'zm'],
    },
    keywords: ['manual', 'farmer'],
    priority: 1,
  },
  picsa_manual_tumbuka: {
    id: 'picsa_manual_tumbuka',
    type: 'file',
    title: 'Buku la PICSA',
    mimetype: 'application/pdf',
    description: '',
    language: 'tumbuka',
    filename: 'picsa-field-manual-tumbuka.pdf',
    url: 'https://firebasestorage.googleapis.com/v0/b/picsa-apps.appspot.com/o/picsa%2Fmanuals%2Fpicsa-manual-tumbuka.pdf?alt=media&token=ccaa5881-2200-48de-8799-69179b8109e0',
    size_kb: 1954.6,
    md5Checksum: '39f969656877f0dc19ae392d7db8178c',
    filter: { countries: ['mw', 'zm'] },
    keywords: ['manual', 'extension'],
    priority: 1,
  },
  picsa_manual_tajik: {
    id: 'picsa_manual_tajik',
    type: 'file',
    title: 'ПИКСА (Забони тоҷикӣ)',
    mimetype: 'application/pdf',
    description: '',
    language: 'tajik',
    filename: 'picsa_manual_tajik.pdf',
    url: 'https://firebasestorage.googleapis.com/v0/b/picsa-apps.appspot.com/o/picsa%2Fmanuals%2Fpicsa_manual_tajik.pdf?alt=media&token=b8669e3c-9eae-4443-b743-6b1881990d81',
    md5Checksum: '46d27ff52886ebfe67a15dd726a49a3f',
    size_kb: 2610.8,
    filter: { countries: ['tj'] },
    keywords: ['manual', 'extension'],
    priority: 1,
  },
};

const picsa_manuals: IResourceCollection = {
  id: 'picsaManual',
  type: 'collection',
  priority: 10.1,
  title: 'PICSA Manual',
  description: 'PICSA training manuals available in a variety of languages',
  cover: {
    image: 'assets/resources/covers/picsa-field-manual.jpg',
    imageFit: 'cover',
  },

  childResources: {
    files: Object.keys(PICSA_MANUAL_RESOURCES),
  },
};

export default { ...PICSA_MANUAL_RESOURCES, picsa_manuals };
