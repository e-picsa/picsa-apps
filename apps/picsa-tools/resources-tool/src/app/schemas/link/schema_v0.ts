import { IPicsaCollectionCreator } from '@picsa/shared/services/core/db_v2';
import { RxJsonSchema } from 'rxdb';

import { IResourceBase_v0, SCHEMA_BASE_V0 } from '../base/schema_v0';

export interface IResourceLink extends IResourceBase_v0 {
  type: 'link';
  subtype: 'play_store' | 'website' | 'youtube' | 'whatsapp' | 'facebook';
  url: string;
}

export const SCHEMA_V0: RxJsonSchema<IResourceLink> = {
  title: 'resource_file',
  version: 0,
  keyCompression: false,
  type: 'object',
  properties: {
    ...SCHEMA_BASE_V0.properties,
    subtype: { type: 'string' },
    url: { type: 'string' },
  },
  required: ['id'],
  primaryKey: 'id',
};

export const COLLECTION_V0: IPicsaCollectionCreator<IResourceLink> = {
  schema: SCHEMA_V0,
  isUserCollection: false,
};
