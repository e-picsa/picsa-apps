import { Injectable } from '@angular/core';
import { addRxPlugin, RxCollection } from 'rxdb';
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';

import { IVideoPlayback, videoPlayback } from '../features/video-player/schema/schema';
import { PicsaAsyncService } from './asyncService.service';
import { PicsaDatabase_V2_Service } from './core/db_v2';

addRxPlugin(RxDBUpdatePlugin);

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

  override async init() {
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
      // Upsert the document
      await this.collection.upsert(state);
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
