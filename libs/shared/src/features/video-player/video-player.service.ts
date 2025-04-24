import { Injectable } from '@angular/core';
import { RxCollection } from 'rxdb';

import { PicsaAsyncService } from '../../services/asyncService.service';
import { PicsaDatabase_V2_Service } from '../../services/core/db_v2';
import * as Schema from './schema';

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

  private thumbnailCache: Map<string, string> = new Map();

  /**
   * Load a video url and capture thumbnail from video at specific time
   */
  public async generateVideoThumbnail(videoUrl: string, captureTime = 20): Promise<string> {
    const existingThumbnail = this.thumbnailCache.get(videoUrl);
    if (existingThumbnail) {
      return existingThumbnail;
    }
    try {
      return new Promise<string>((resolve, reject) => {
        const video = document.createElement('video');
        video.crossOrigin = 'anonymous';
        video.muted = true;
        video.playsInline = true;
        video.src = videoUrl;

        video.addEventListener(
          'loadedmetadata',
          () => {
            if (video.duration < captureTime) {
              captureTime = video.duration / 2;
            }
            video.currentTime = captureTime;
          },
          { once: true }
        );

        video.addEventListener(
          'seeked',
          () => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
              console.error('Unable to get canvas context.');
              return resolve('');
            }

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/webp');

            // free up memory
            if (videoUrl.startsWith('blob:')) {
              URL.revokeObjectURL(videoUrl);
            }
            this.thumbnailCache.set(videoUrl, dataUrl);

            resolve(dataUrl);
          },
          { once: true }
        );

        video.addEventListener(
          'error',
          (err) => {
            console.error('Error loading video:', err);

            if (videoUrl.startsWith('blob:')) {
              URL.revokeObjectURL(videoUrl);
            }
            // Return '' instead of rejecting
            resolve('');
          },
          { once: true }
        );

        video.load();
      });
    } catch (err) {
      console.error('Unexpected error generating thumbnail:', err);
      return '';
    }
  }
}
