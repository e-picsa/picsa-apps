import { Injectable } from '@angular/core';
import { RxCollection } from 'rxdb';

import { IVideoPlayback, videoPlayback } from '../features/video-player/schema/schema';
import { PicsaAsyncService } from './asyncService.service';
import { PicsaDatabase_V2_Service } from './core/db_v2';

@Injectable({
  providedIn: 'root',
})
export class VideoPlayerService extends PicsaAsyncService {
  private dbService: PicsaDatabase_V2_Service;
  private collection: RxCollection<IVideoPlayback>;

  constructor(dbService: PicsaDatabase_V2_Service) {
    super();
    this.dbService = dbService;
  }

  async init() {
    try {
      await this.dbService.ensureCollections({
        'video-playback': videoPlayback,
      });
      this.collection = this.dbService.db.collections['video-playback'] as RxCollection<IVideoPlayback>;
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  }

  async updateVideoState(state: IVideoPlayback) {
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
