import { ICountryCode } from '@picsa/data/deployments';
import { RxJsonSchema } from 'rxdb';

export interface IResourceBase_v0 {
  /** Unique identifier for file (recommend folder prefix + filenanme) */
  id: string;
  title: string;
  /** Differentiate between different base resource types */
  type: 'file' | 'collection' | 'link';
  description?: string;
  cover?: {
    image?: string;
    /** Specify if resource image should be contained (default) or stretched to cover */
    imageFit?: 'contain' | 'cover';
  };
  /** Restrict availability by country */
  filter?: {
    countries?: ICountryCode[];
  };
  /** Language of resource */
  language?: string;
  /** Custom keywords used for some filtering (manual) and in future could be used for search */
  keywords?: string[];
  /** Order of priority when shown in list (highest numbers shown first) */
  priority?: number;
  /** additional metadata populated for specific resource types */
  meta?: any;
}

export const SCHEMA_BASE_V0: RxJsonSchema<IResourceBase_v0> = {
  title: 'resource_base',
  version: 0,
  keyCompression: false,
  type: 'object',
  properties: {
    cover: { type: 'object', properties: { image: { type: 'string' }, imageFit: { type: 'string' } } },
    description: { type: 'string', default: '' },
    id: { type: 'string' },
    type: { type: 'string' },
    filter: { type: 'object', properties: { countries: { type: 'array' } } },
    keywords: { type: 'array', default: [] },
    language: { type: 'string', default: '' },
    priority: { type: 'number', default: 1.0 },
    title: { type: 'string' },
    meta: { type: 'object' },
  },
  required: ['id'],
  primaryKey: 'id',
};
