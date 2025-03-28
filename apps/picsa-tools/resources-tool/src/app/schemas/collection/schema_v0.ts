import type { IPicsaCollectionCreator } from '@picsa/shared/services/core/db_v2';
import { RxJsonSchema } from 'rxdb';

import { IResourceBase_v0, SCHEMA_BASE_V0 } from '../base/schema_v0';

export interface IResourceCollection_v0 extends IResourceBase_v0 {
  type: 'collection';
  /** Specify if collection nested within parent */
  parentCollection?: string;
  /** IDs of child resources */
  childResources: {
    collections: string[];
    links: string[];
    files: string[];
  };
}

export const SCHEMA_V0: RxJsonSchema<IResourceCollection_v0> = {
  title: 'resources_tool_collections',
  version: 0,
  keyCompression: false,
  type: 'object',
  properties: {
    ...SCHEMA_BASE_V0.properties,
    parentCollection: { type: 'string' },
    childResources: {
      type: 'object',
      properties: {
        collections: { type: 'array' },
        links: { type: 'array' },
        files: { type: 'array' },
      },
    },
  },
  required: ['id'],
  primaryKey: 'id',
};

export const COLLECTION_V0: IPicsaCollectionCreator<IResourceCollection_v0> = {
  schema: SCHEMA_V0,
  isUserCollection: false,
  attachments: {},
};
