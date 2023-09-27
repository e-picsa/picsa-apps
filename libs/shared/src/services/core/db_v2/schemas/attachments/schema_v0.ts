import { IPicsaCollectionCreator } from '@picsa/shared/services/core/db_v2';
import { RxJsonSchema } from 'rxdb';

/** Populated properties following RXDB putAttachment method */
export interface IAttachment_v0 {
  id: string;
  data: string;
  length: number;
  type: string;
  digest?: string;
}

export const SCHEMA_V0: RxJsonSchema<IAttachment_v0> = {
  title: 'attachments',
  version: 0,
  keyCompression: false,
  type: 'object',
  properties: {
    id: { type: 'string' },
    /** Base64 encoded string */
    data: { type: 'string' },
    length: { type: 'integer' },
    type: { type: 'string' },
    digest: { type: 'string' },
  },
  primaryKey: 'id',
};

export const COLLECTION_V0: IPicsaCollectionCreator<IAttachment_v0> = {
  schema: SCHEMA_V0,
  isUserCollection: false,
};
