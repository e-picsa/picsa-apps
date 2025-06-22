import { RxJsonSchema } from 'rxdb';

import type { IPicsaCollectionCreator } from '../../../services/core/db_v2/models/index';
import { ENTRY_TEMPLATE_V0, IVideoPlayerEntry_V0, SCHEMA_V0 } from './schema_v0';

const SCHEMA_VERSION = 1;

// Extends V0 with a base64 thumbnail field.
export interface IVideoPlayerEntry_V1 extends IVideoPlayerEntry_V0 {
  thumbnail?: string;
}

export const ENTRY_TEMPLATE_V1: (videoId: string) => IVideoPlayerEntry_V1 = (videoId) => ({
  ...ENTRY_TEMPLATE_V0(videoId),
  thumbnail: '',
});

export const SCHEMA_V1: RxJsonSchema<IVideoPlayerEntry_V1> = {
  ...SCHEMA_V0,
  title: 'video playback schema v1',
  version: SCHEMA_VERSION,
  properties: {
    ...SCHEMA_V0.properties,
    thumbnail: {
      type: 'string',
    },
  },
};

// Migration strategy
export const MIGRATIONS_V1 = {
  1: async (oldDoc: IVideoPlayerEntry_V0): Promise<IVideoPlayerEntry_V1> => {
    return {
      ...oldDoc,
      thumbnail: '', //set a default empty string
    };
  },
};

// Final collection export for version 1.
export const COLLECTION_V1: IPicsaCollectionCreator<IVideoPlayerEntry_V1> = {
  schema: SCHEMA_V1,
  migrationStrategies: MIGRATIONS_V1,
  isUserCollection: true,
};
