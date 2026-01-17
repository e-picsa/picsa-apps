import { inject, Injectable } from '@angular/core';
import { RxCollection } from 'rxdb';

import { PicsaAsyncService } from '../../services/asyncService.service';
import { PicsaDatabase_V2_Service } from '../../services/core/db_v2';
import * as Schema from './schema';

@Injectable({
  providedIn: 'root',
})
export class VideoPlayerService extends PicsaAsyncService {
  private dbService = inject(PicsaDatabase_V2_Service);
  private collection: RxCollection<Schema.IVideoPlayerEntry>;

  /** Keep cache of generated thumbnails */
  // public thumbnailCache = new Map<string, string>();

  override async init() {
    try {
      await this.dbService.ensureCollections({ video_player: Schema.COLLECTION });
      this.collection = this.dbService.db.collections.video_player as RxCollection<Schema.IVideoPlayerEntry>;
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  }

  async updateVideoState(state: Schema.IVideoPlayerEntry) {
    try {
      const videoPlayerDoc = await this.collection.findOne(state.videoId).exec();

      if (!videoPlayerDoc) {
        await this.collection.insert(state);
      } else {
        await videoPlayerDoc.incrementalPatch({
          currentTime: state.currentTime,
          totalTime: state.totalTime,
          playbackPercentage: state.playbackPercentage,
        });
      }
    } catch (error) {
      console.error('Failed to update video state:', error);
    }
  }

  async getVideoState(videoId: string) {
    try {
      return await this.collection.findOne(videoId).exec();
    } catch (error) {
      console.error('Failed to get video state:', error);
      return null;
    }
  }

  async saveThumbnail(videoId: string, thumbnail: string) {
    try {
      const videoPlayerDoc = await this.collection.findOne(videoId).exec();

      if (videoPlayerDoc) {
        await videoPlayerDoc.incrementalPatch({ thumbnail });
      } else {
        // If no existing document, we create one with thumbnail only
        await this.collection.insert({
          videoId,
          currentTime: 0,
          totalTime: 0,
          playbackPercentage: 0,
          thumbnail,
        });
      }
    } catch (error) {
      console.error('Failed to save thumbnail:', error);
    }
  }
}
