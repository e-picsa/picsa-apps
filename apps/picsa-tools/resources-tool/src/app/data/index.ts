import * as schemas from '../schemas';
import { IResourceBase } from '../schemas/base';
import CROPS from './crops';
import { GENDER_RESOURCES } from './gender';
import PICSA_RESOURCES from './picsa';

const byId: Record<string, IResourceBase> = {
  ...CROPS,
  ...GENDER_RESOURCES,
  ...PICSA_RESOURCES,
};

const typeExports: {
  collection: schemas.IResourceCollection[];
  file: schemas.IResourceFile[];
  link: schemas.IResourceLink[];
} = {
  collection: [],
  file: [],
  link: [],
};

// order by types
for (const resource of Object.values(byId)) {
  typeExports[resource.type].push(resource as any);
}

export const DB_COLLECTION_ENTRIES = typeExports.collection;
export const DB_FILE_ENTRIES = typeExports.file;
export const DB_LINK_ENTRIES = typeExports.link;
