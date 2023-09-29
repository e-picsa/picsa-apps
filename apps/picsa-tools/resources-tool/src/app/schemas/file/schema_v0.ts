import { IPicsaCollectionCreator } from '@picsa/shared/services/core/db_v2';
import { RxJsonSchema } from 'rxdb';

import { IResourceBase_v0, SCHEMA_BASE_V0 } from '../base/schema_v0';

/** Supported resource file types */
type IResourceFileMimetype = 'video/mp4' | 'application/pdf';

export interface IResourceFile_v0 extends IResourceBase_v0 {
  type: 'file';
  /** Filename used to store attachment in db */
  filename: string;
  /** TODO - prefer sha256 to compare with rxdb digest */
  md5Checksum: string;
  mimetype: IResourceFileMimetype;
  size_kb: number;
  /** Link where file can be downloaded from */
  url: string;
}

export const SCHEMA_V0: RxJsonSchema<IResourceFile_v0> = {
  title: 'resource_file',
  version: 0,
  keyCompression: false,
  type: 'object',
  properties: {
    ...SCHEMA_BASE_V0.properties,
    filename: { type: 'string' },
    md5Checksum: { type: 'string' },
    mimetype: { type: 'string' },
    size_kb: { type: 'number' },
    url: { type: 'string' },
  },
  required: ['id'],
  primaryKey: 'id',
  attachments: {
    compression: undefined,
    encrypted: false,
  },
};

export const COLLECTION_V0: IPicsaCollectionCreator<IResourceFile_v0> = {
  schema: SCHEMA_V0,
  isUserCollection: false,
  attachments: {},
};
