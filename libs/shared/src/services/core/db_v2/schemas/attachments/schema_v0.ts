import { RxJsonSchema } from 'rxdb';

import type { IPicsaCollectionCreator } from '../../models';

/** Populated properties following RXDB putAttachment method */
export interface IAttachment_v0 {
  id: string;
  /** web - base64 encoded string data stored in document */
  data?: string;
  /** native - uri to data */
  uri?: string;
  length: number;
  type: string;
  /** sha256 created by rxdb */
  digest?: string;
}

export const SCHEMA_V0: RxJsonSchema<IAttachment_v0> = {
  title: 'attachments',
  version: 0,
  keyCompression: false,
  type: 'object',
  properties: {
    id: { type: 'string' },
    data: { type: 'string' },
    uri: { type: 'string' },
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
