import { IResourceCollection } from '../../models';
import mwSalima2022 from './mw-salima-2022';
import zmChipata2022 from './zm-chipata-2022';

const cropInfoSheets: IResourceCollection = {
  _key: 'cropInfoSheets',
  _created: '2019-09-25T10:00:04.000Z',
  _modified: '2019-09-27T11:00:01.000Z',
  title: 'Crop Information Sheets',
  description: '',
  subtitle: '',
  type: 'collection',
  image: 'assets/resources/covers/spreadsheet.svg',
  parentResource: 'cropResources',
  childResources: [
    'crop_info_chipata',
    'crop_info_petauke',
    'crop_info_kasungu',
    'crop_info_nkhotakota',
  ],
};
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
  // NOTE zmChipata resources not included in collection but bundled into crop resources page
  // TODO - could likely be cleaned up in the future
};

export default {
  picsaWorkshops,
  cropInfoSheets,
  ...mwSalima2022,
  ...zmChipata2022,
};
