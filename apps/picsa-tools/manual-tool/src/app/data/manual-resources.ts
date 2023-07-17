import type { IResourceFile } from '@picsa/resources/src/app/models';

type IPicsaManualId = 'picsa_manual' | 'picsa_manual_chichewa' | 'picsa_manual_tumbuka' | 'picsa_manual_tajik';

/**
 * List of manuals available both within manual tool and resource collection
 */
export const PICSA_MANUAL_RESOURCES: { [id in IPicsaManualId]: IResourceFile } = {
  picsa_manual: {
    _key: 'picsa_manual',
    _created: '2019-09-25T10:00:01.000Z',
    _modified: '2019-09-25T11:00:01.000Z',
    title: 'PICSA Manual (English)',
    language: 'eng',
    mimetype: 'application/pdf',
    description: '',
    subtitle: '',
    filename: 'picsa-field-manual-en.pdf',
    type: 'file',
    url: 'https://firebasestorage.googleapis.com/v0/b/picsa-apps.appspot.com/o/picsa%2Fmanuals%2Fpicsa-manual.pdf?alt=media&token=8d5c21da-2252-44b7-8709-a3f12a593c2f',
  },
  picsa_manual_chichewa: {
    _key: 'picsa_manual_chichewa',
    _created: '2019-09-25T10:00:02.000Z',
    _modified: '2019-09-27T15:00:03.000Z',
    title: 'Buku la PICSA (Chichewa)',
    mimetype: 'application/pdf',
    language: 'nya',
    description: '',
    subtitle: 'Chichewa',
    filename: 'picsa-field-manual-chichewa.pdf',
    type: 'file',
    url: 'https://firebasestorage.googleapis.com/v0/b/picsa-apps.appspot.com/o/picsa%2Fmanuals%2Fpicsa-manual-chichewa.pdf?alt=media&token=d03031db-9e83-4a0a-a5be-7c3d1d42f98b',
    appLocalisations: ['mw_ny', 'zm_ny'],
  },
  picsa_manual_tumbuka: {
    _key: 'picsa_manual_tumbuka',
    _created: '2019-09-25T10:00:03.000Z',
    _modified: '2019-09-27T15:00:05.000Z',
    title: 'Buku la PICSA (Tumbuka)',
    mimetype: 'application/pdf',
    description: '',
    language: 'tum',
    subtitle: 'Tumbuka',
    filename: 'picsa-field-manual-tumbuka.pdf',
    type: 'file',
    url: 'https://firebasestorage.googleapis.com/v0/b/picsa-apps.appspot.com/o/picsa%2Fmanuals%2Fpicsa-manual-tumbuka.pdf?alt=media&token=ccaa5881-2200-48de-8799-69179b8109e0',
    appLocalisations: ['mw', 'zm'],
  },
  picsa_manual_tajik: {
    _key: 'picsa_manual_tajik',
    _created: '2022-10-05T10:00:03.000Z',
    _modified: '2022-10-05T15:00:05.000Z',
    title: 'ПИКСА (Забони тоҷикӣ)',
    mimetype: 'application/pdf',
    description: '',
    language: 'tj',
    subtitle: '',
    filename: 'picsa_manual_tajik.pdf',
    type: 'file',
    url: 'https://firebasestorage.googleapis.com/v0/b/picsa-apps.appspot.com/o/picsa%2Fmanuals%2Fpicsa_manual_tajik.pdf?alt=media&token=b8669e3c-9eae-4443-b743-6b1881990d81',
    appLocalisations: ['tj_tg'],
  },
};
