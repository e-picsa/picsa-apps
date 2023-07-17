import { IResourceCollection } from '../../models';
import { PICSA_MANUAL_RESOURCES } from '@picsa/manual/src/app/data/manual-resources';

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
