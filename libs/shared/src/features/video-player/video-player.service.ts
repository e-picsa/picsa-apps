import { Injectable } from '@angular/core';
import { addRxPlugin, RxCollection } from 'rxdb';
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';

import { PicsaAsyncService } from '../../services/asyncService.service';
import { PicsaDatabase_V2_Service } from '../../services/core/db_v2';
import * as Schema from './schema';

addRxPlugin(RxDBUpdatePlugin);

@Injectable({
  providedIn: 'root',
})
export class VideoPlayerService extends PicsaAsyncService {
  private dbService: PicsaDatabase_V2_Service;
  private collection: RxCollection<Schema.IVideoPlayerEntry>;

  constructor(dbService: PicsaDatabase_V2_Service) {
    super();
    this.dbService = dbService;
  }

  override async init() {
    try {
      await this.dbService.ensureCollections({ [Schema.COLLECTION_NAME]: Schema.COLLECTION });
      this.collection = this.dbService.db.collections[Schema.COLLECTION_NAME] as RxCollection<Schema.IVideoPlayerEntry>;
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  }

  async updateVideoState(state: Schema.IVideoPlayerEntry) {
    try {
      const playback = await this.collection.findOne(state.videoId).exec();

      if (!playback) {
        await this.collection.insert(state);
      } else {
        await playback.update({
          $set: {
            currentTime: state.currentTime,
            totalTime: state.totalTime,
            playbackPercentage: state.playbackPercentage,
          },
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
}
