/* eslint-disable @typescript-eslint/no-explicit-any */
import { RxJsonSchema } from 'rxdb';

import type { IPicsaCollectionCreator } from '../../../services/core/db_v2/models/index';

const PHOTO_SCHEMA_VERSION = 0;

export interface IPhotoEntry_V0 {
  id: string;
  photoData: string;
  timestamp: number;
  activity: string;
  custom_meta?: any;
}

export const PHOTO_ENTRY_TEMPLATE_V0: (id: string, photoData: string, activity: string) => IPhotoEntry_V0 = (
  id,
  photoData,
  activity
) => ({
  id,
  photoData,
  timestamp: Date.now(),
  activity,
  custom_meta: {},
});

export const PHOTO_SCHEMA_V0: RxJsonSchema<IPhotoEntry_V0> = {
  title: 'photo storage schema',
  version: PHOTO_SCHEMA_VERSION,
  type: 'object',
  primaryKey: 'id',
  properties: {
    id: {
      type: 'string',
    },
    photoData: {
      type: 'string',
    },
    timestamp: {
      type: 'number',
    },
    activity: {
      type: 'string',
    },
    custom_meta: {
      type: 'object',
    },
  },
  required: ['id', 'photoData', 'timestamp', 'activity'],
  attachments: {},
};

export const PHOTO_COLLECTION_V0: IPicsaCollectionCreator<IPhotoEntry_V0> = {
  schema: PHOTO_SCHEMA_V0,
  isUserCollection: true,
};
