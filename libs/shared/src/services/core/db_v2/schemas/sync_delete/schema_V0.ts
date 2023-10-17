import { RxJsonSchema } from 'rxdb';

import type { IPicsaCollectionCreator } from '../../models';

/** Track local deletions to remove from server */
export interface ISyncDelete_V0 {
  id: string;
  collectionName: string;
  documentId: string;
}

export const SCHEMA_V0: RxJsonSchema<ISyncDelete_V0> = {
  title: 'sync_delete',
  version: 0,
  keyCompression: false,
  type: 'object',
  properties: {
    id: { type: 'string' },
    collectionName: { type: 'string' },
    documentId: { type: 'string' },
  },
  primaryKey: 'id',
};

export const COLLECTION_V0: IPicsaCollectionCreator<ISyncDelete_V0> = {
  schema: SCHEMA_V0,
  isUserCollection: false,
};
