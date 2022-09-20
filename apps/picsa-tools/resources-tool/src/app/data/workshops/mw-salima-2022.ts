import {
  IResourceCollection,
  IResourceFile,
  IResourceLink,
} from '../../models';

const collections: { [id: string]: IResourceCollection } = {
  workshopSalima2022: {
    _created: '2022-09-20T10:00:04.000Z',
    _modified: '2022-09-20T11:00:01.000Z',
    _key: 'workshopSalima2022',
    type: 'collection',
    title: 'Salima 2022',
    description: 'Materials used in Salima picsa workshop 2022',
    image: 'assets/resources/covers/workshop-salima-2022.jpg',
    childResources: [],
    parentResource: 'picsaWorkshops',
  },
};
const links: { [id: string]: IResourceLink } = {
  feedbackform: {
    _created: '2022-09-20T10:00:04.000Z',
    _modified: '2022-09-20T11:00:01.000Z',
    _key: 'feedbackform',
    type: 'link',
    title: 'Reporting and Feedback Form',
    description: 'Materials used in Salima picsa workshop 2022',
    image: 'assets/resources/covers/workshop-salima-2022.jpg',
    url: 'https://ee.kobotoolbox.org/x/PGpldp9m',
    },
};
const files: { [id: string]: IResourceFile } = {};

export default { ...collections, ...links, ...files };
