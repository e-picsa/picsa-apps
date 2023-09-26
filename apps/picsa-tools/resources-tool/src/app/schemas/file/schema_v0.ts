import { IPicsaCollectionCreator } from '@picsa/shared/services/core/db_v2';
import { RxJsonSchema } from 'rxdb';

/** Supported resource file types */
export type IResourceFileType = 'video/mp4' | 'application/pdf';

export interface IResourceFile_v0 {
  /** Unique identifier for file (recommend folder prefix + filenanme) */
  id: string;
  /** Filename used to store attachment in db */
  filename: string;
  cover?: {
    image?: string;
    /** Specify if resource image should be contained (default) or stretched to cover */
    imageFit?: 'contain' | 'cover';
  };
  description?: string;
  /** Track progress of file resource download */
  downloaded?: boolean;
  /** Restrict availability by country */
  filter?: {
    countries?: string[];
  };
  /** Language of resource */
  language?: string;
  /** Custom keywords used for some filtering (manual) and in future could be used for search */
  keywords?: string[];
  md5Checksum: string;
  mimetype: IResourceFileType;
  /** Order of priority when shown in list (highest numbers shown first) */
  priority: number;
  size_kb: number;
  title: string;
  /** Link where file can be downloaded from */
  url: string;
}

export const SCHEMA_V0: RxJsonSchema<IResourceFile_v0> = {
  title: 'resource_file',
  version: 0,
  keyCompression: false,
  type: 'object',
  properties: {
    cover: { type: 'object', properties: { image: { type: 'string' }, imageFit: { type: 'string' } } },
    downloaded: { type: 'boolean', default: false },
    description: { type: 'string', default: '' },
    id: { type: 'string' },
    filename: { type: 'string' },
    filter: { type: 'object', properties: { countries: { type: 'array' } } },
    keywords: { type: 'array', default: [] },
    language: { type: 'string', default: 'gb_en' },
    md5Checksum: { type: 'string' },
    mimetype: { type: 'string' },
    priority: { type: 'number', default: 1.0 },
    size_kb: { type: 'number' },
    title: { type: 'string' },
    url: { type: 'string' },
  },
  required: ['id', 'md5Checksum', 'size_kb', 'title', 'mimetype', 'url'],
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
