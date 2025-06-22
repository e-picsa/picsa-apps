import { Component, Input, OnDestroy, OnInit, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';

import { VideoPlayerService } from '../video-player.service';

const THUMBNAIL_WIDTH = 640;
const THUMBNAIL_HEIGHT = 360;

@Component({
  selector: 'picsa-video-thumbnail',
  templateUrl: './video-thumbnail.component.html',
  styleUrls: ['./video-thumbnail.component.scss'],
})
export class VideoThumbnailComponent implements OnInit, OnDestroy {
  @Input() videoUrl?: string;

  @Input() thumbnail?: string;

  @Input() videoId: string;

  generatedThumbnail = signal<string | undefined>(undefined);

  /** Thumbnail generation video element */
  private videoEl = signal<HTMLVideoElement | undefined>(undefined);

  constructor(private service: VideoPlayerService) {}

  // Load existing thumbnail (if exists), or create videoEl to generate thumbnail
  async ngOnInit() {
    await this.service.ready();

    if (this.videoUrl && !this.thumbnail) {
      const doc = await this.service.getVideoState(this.videoId);
      const existingThumbnail = doc?.thumbnail;

      if (existingThumbnail) {
        this.generatedThumbnail.set(existingThumbnail);
      } else {
        this.createPlaceholderVideoElement(this.videoUrl);
      }
    }
  }

  // Remove any generated elements on destroy
  async ngOnDestroy() {
    const videoEl = this.videoEl();
    if (videoEl) {
      videoEl.remove();
    }
  }

  private generateThumbnail(videoEl: HTMLVideoElement, retryCount = 0) {
    const image = this.getCurrentVideoFrameImage(videoEl);
    if (image) {
      this.generatedThumbnail.set(image);
      this.service.saveThumbnail(this.videoId, image);
    } else {
      // Attempt to regenerate at later timestamp in case current time
      // either failed to render or fails validation (blank screen)
      if (retryCount < 5) {
        retryCount++;
        videoEl.currentTime = videoEl.currentTime + 1;
        setTimeout(() => {
          this.generateThumbnail(videoEl, retryCount);
        }, 500);
      }
    }
  }

  private createPlaceholderVideoElement(videoUrl: string) {
    const video = document.createElement('video');
    video.width = THUMBNAIL_WIDTH;
    video.height = THUMBNAIL_HEIGHT;
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;
    video.src = videoUrl;
    video.preload = 'metadata';

    // Once video data loaded assign player to video Element for interaction
    video.addEventListener('loadedmetadata', () => {
      this.videoEl.set(video);
      const seekTime = Math.min(video.duration / 2, 20);
      video.currentTime = seekTime;
      // On native seek events do not fire consistently so just attempt to generate thumbnail after load
      if (Capacitor.isNativePlatform()) {
        setTimeout(() => {
          this.generateThumbnail(video);
        }, 50);
      }
    });
    // On web generate thumbnail when seek event triggered
    if (!Capacitor.isNativePlatform()) {
      video.addEventListener('seeked', () => this.generateThumbnail(video));
    }
  }

  private getCurrentVideoFrameImage(video: HTMLVideoElement) {
    const canvas = document.createElement('canvas');
    canvas.width = THUMBNAIL_WIDTH;
    canvas.height = THUMBNAIL_HEIGHT;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Unable to get canvas context.');
      return '';
    }

    ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight, 0, 0, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);
    const isValid = this.validateThumbnail(canvas);
    if (!isValid) {
      return undefined;
    }
    const dataUrl = canvas.toDataURL('image/webp');
    return dataUrl;
  }

  /**
   * Validates if a thumbnail contains actual image content rather than a blank or solid-colored frame.
   * Generated using Claude 3.7 Sonnet
   *  */
  private validateThumbnail(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Sample pixels (analyze a subset to save processing)
    const pixelCount = data.length / 4;
    const sampleSize = Math.min(1000, pixelCount);
    const step = Math.floor(pixelCount / sampleSize) * 4;

    let sumR = 0,
      sumG = 0,
      sumB = 0;
    let sumRSq = 0,
      sumGSq = 0,
      sumBSq = 0;
    let count = 0;

    for (let i = 0; i < data.length; i += step) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      sumR += r;
      sumG += g;
      sumB += b;

      sumRSq += r * r;
      sumGSq += g * g;
      sumBSq += b * b;

      count++;
    }

    // Calculate standard deviation for each channel
    const avgR = sumR / count;
    const avgG = sumG / count;
    const avgB = sumB / count;

    const varR = sumRSq / count - avgR * avgR;
    const varG = sumGSq / count - avgG * avgG;
    const varB = sumBSq / count - avgB * avgB;

    const stdDevR = Math.sqrt(varR);
    const stdDevG = Math.sqrt(varG);
    const stdDevB = Math.sqrt(varB);

    const avgStdDev = (stdDevR + stdDevG + stdDevB) / 3;

    // If standard deviation is too low, it's likely a blank or near-blank image
    return avgStdDev > 10; // Adjust threshold as needed
  }
}
