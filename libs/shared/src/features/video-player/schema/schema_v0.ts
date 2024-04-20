import { RxJsonSchema } from 'rxdb';

import type { IPicsaCollectionCreator } from '../../../services/core/db_v2/models/index';

const SCHEMA_VERSION = 0;

export interface IVideoPlayerEntry_V0 {
  videoId: string;
  currentTime: number;
  totalTime: number;
  playbackPercentage: number;
}

export const ENTRY_TEMPLATE_V0: (videoId: string) => IVideoPlayerEntry_V0 = (videoId) => ({
  videoId,
  currentTime: 0,
  totalTime: 0,
  playbackPercentage: 0,
});

export const SCHEMA_V0: RxJsonSchema<IVideoPlayerEntry_V0> = {
  title: 'video playback schema',
  version: SCHEMA_VERSION,
  type: 'object',
  primaryKey: 'videoId',
  properties: {
    videoId: {
      type: 'string',
    },
    currentTime: {
      type: 'number',
    },
    totalTime: {
      type: 'number',
    },
    playbackPercentage: {
      type: 'number',
    },
  },
  required: ['videoId', 'currentTime', 'totalTime', 'playbackPercentage'],
};

export const COLLECTION_V0: IPicsaCollectionCreator<IVideoPlayerEntry_V0> = {
  schema: SCHEMA_V0,
  isUserCollection: true,
};
