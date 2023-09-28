import { IPicsaCollectionCreator } from '@picsa/shared/services/core/db_v2';
import { RxJsonSchema } from 'rxdb';

/** Supported resource file types */
export type IResourceFileType = 'video/mp4' | 'application/pdf';

export interface IResourceFile_v0 {
  /** Unique identifier for file (recommend folder prefix + filenanme) */
  id: string;
  cover?: {
    image?: string;
    /** Specify if resource image should be contained (default) or stretched to cover */
    imageFit?: 'contain' | 'cover';
  };
  description?: string;
  /** Restrict availability by country */
  filter?: {
    countries?: string[];
  };
  /** Language of resource */
  language?: string;
  /** Custom keywords used for some filtering (manual) and in future could be used for search */
  keywords?: string[];
  /** Filename used to store attachment in db */
  filename: string;
  /** TODO - prefer sha256 to compare with rxdb digest */
  md5Checksum: string;
  mimetype: IResourceFileType;
  size_kb: number;
  /** Link where file can be downloaded from */
  url: string;
  /** Order of priority when shown in list (highest numbers shown first) */
  priority: number;
  title: string;
}

export const SCHEMA_V0: RxJsonSchema<IResourceFile_v0> = {
  title: 'resource_file',
  version: 0,
  keyCompression: false,
  type: 'object',
  properties: {
    cover: { type: 'object', properties: { image: { type: 'string' }, imageFit: { type: 'string' } } },
    description: { type: 'string', default: '' },
    id: { type: 'string' },
    filename: { type: 'string' },
    md5Checksum: { type: 'string' },
    mimetype: { type: 'string' },
    size_kb: { type: 'number' },
    url: { type: 'string' },
    filter: { type: 'object', properties: { countries: { type: 'array' } } },
    keywords: { type: 'array', default: [] },
    language: { type: 'string', default: 'gb_en' },

    priority: { type: 'number', default: 1.0 },

    title: { type: 'string' },
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
