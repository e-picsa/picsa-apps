import { IResourceCollection, IResourceFile } from '../../models';

const files: { [id: string]: IResourceFile } = {};

/** DEPRECATED CC 2023-07-03 (use tool instead) */
const cropInfoCollection: IResourceCollection = {
  _key: 'cropInfoCollection',
  _created: '2019-09-25T10:00:04.000Z',
  _modified: '2019-09-27T11:00:01.000Z',
  title: 'Crop Information Sheets',
  description: '',
  subtitle: '',
  type: 'collection',
  image: 'assets/resources/covers/spreadsheet.svg',
  parentResource: 'cropResources',
  childResources: Object.keys(files),
};
export default { ...files };
