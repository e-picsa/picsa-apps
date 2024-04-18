import type { IPicsaCollectionCreator } from '@picsa/shared/services/core/db_v2/models/index';
import { RxJsonSchema } from 'rxdb';

export interface IVideoPlayback {
  videoId: string;
  currentTime: number;
  totalTime: number;
  playbackPercentage: number;
}

export const videoPlaybackSchema: RxJsonSchema<IVideoPlayback> = {
  title: 'video playback schema',
  version: 0,
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

export const videoPlayback: IPicsaCollectionCreator<IVideoPlayback> = {
  schema: videoPlaybackSchema,
  isUserCollection: true,
};
