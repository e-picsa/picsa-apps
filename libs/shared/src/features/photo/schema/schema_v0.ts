/* eslint-disable @typescript-eslint/no-explicit-any */
import { generateID } from '@picsa/shared/services/core/db/db.service';
import { generateTimestamp } from '@picsa/shared/services/core/db_v2';
import { RxJsonSchema } from 'rxdb';

import type { IPicsaCollectionCreator } from '../../../services/core/db_v2/models/index';

const PHOTO_SCHEMA_VERSION = 0;

export interface IPhotoEntry_V0 {
  _created_at: string;
  /** Generated id consiting of `{album}/{name}` */
  id: string;
  /** subpath to store photo */
  album: string;
  /** name of photo (randomly generated if not specified) */
  name: string;
  /** additional metadata to include with photo */
  custom_meta?: any;
}

export const PHOTO_ENTRY_TEMPLATE_V0 = (album: string, name = generateID(), custom_meta?: any) => {
  const entry: IPhotoEntry_V0 = {
    _created_at: generateTimestamp(),
    id: `${album}/${name}`,
    album,
    name,
    custom_meta: {},
  };
  if (custom_meta) entry.custom_meta = custom_meta;
  return entry;
};

export const PHOTO_SCHEMA_V0: RxJsonSchema<IPhotoEntry_V0> = {
  title: 'photo storage schema',
  version: PHOTO_SCHEMA_VERSION,
  type: 'object',
  primaryKey: 'id',
  properties: {
    id: {
      type: 'string',
    },
    album: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
    _created_at: {
      type: 'string',
    },
    custom_meta: {
      type: 'object',
    },
  },
  required: ['id', '_created_at', 'album'],
  attachments: {},
};

export const PHOTO_COLLECTION_V0: IPicsaCollectionCreator<IPhotoEntry_V0> = {
  schema: PHOTO_SCHEMA_V0,
  isUserCollection: true,
};
