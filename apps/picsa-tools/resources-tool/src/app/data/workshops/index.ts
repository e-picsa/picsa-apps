import { IResourceCollection } from '../../models';
import mwSalima2022 from './mw-salima-2022';

const picsaWorkshops: IResourceCollection = {
  _created: '2022-09-20T10:00:04.000Z',
  _modified: '2022-09-20T11:00:01.000Z',
  _key: 'picsaWorkshops',
  priority: 9,
  type: 'collection',
  title: 'PICSA Workshops',
  description: 'Materials used in picsa workshops',
  image: 'assets/resources/covers/workshops.png',
  childResources: ['workshopSalima2022'],
};

export default { picsaWorkshops, ...mwSalima2022 };
