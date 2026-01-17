import { Component, effect, HostBinding, inject,Input, input, signal, viewChild } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { capVideoPlayerOptions } from 'capacitor-video-player';

import { AnalyticsService } from '../../services/core/analytics.service';
import type { IVideoPlayerProgressEvent } from './player/video-player.base';
import { VideoPlayerNativeComponent } from './player/video-player.native';
import { VideoPlayerWebComponent } from './player/video-player.web';
import { VideoPlayerService } from './video-player.service';

@Component({
  selector: 'picsa-video-player',
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.scss'],
  standalone: false,
})
export class VideoPlayerComponent {
  private analyticsService = inject(AnalyticsService);
  private playerService = inject(VideoPlayerService);

  public isNative = Capacitor.isNativePlatform();

  public startTime: number;

  /** Optional override of player options */
  @Input() options: Partial<capVideoPlayerOptions> = {};

  /** Unique video id, used for analytics and handling multiple videos */
  @Input() id: string;

  /** Video source - can be string url or data blob */
  source = input<string | undefined | null>();

  /** Optional image shown as preview */
  @Input() thumbnail?: string;

  /** Optional online video url - used to generate thumbnail */
  @Input() onlineVideoUrl?: string;

  // Bind player id to host element to support element query when initialising player
  @HostBinding('attr.data-player-id') get playerId() {
    if (!this.id) {
      console.warn('No id provided to <picsa-video-player> component');
      this.id = `videoPlayer_${generateID(5)}`;
    }
    return this.id;
  }

  public playbackPercentage = signal<number>(0);

  private webPlayer = viewChild<VideoPlayerWebComponent>('webPlayer');

  private nativePlayer = viewChild<VideoPlayerNativeComponent>('nativePlayer');

  protected showThumbnail = signal(true);

  constructor() {
    effect((onCleanup) => {
      const source = this.source();
      onCleanup(() => {
        // TODO - confirm if parent already cleaning up
        if (source) {
          URL.revokeObjectURL(source);
        }
      });
    });
  }

  async ngOnInit() {
    await this.playerService.ready();
    await this.loadVideoState();
  }

  public async handlePlaybackProgressChanged(e: IVideoPlayerProgressEvent) {
    const { currentTime, totalTime } = e;
    const playbackPercentage = (currentTime / totalTime) * 100;
    this.playbackPercentage.set(playbackPercentage);
    await this.playerService.updateVideoState({ videoId: this.playerId, currentTime, playbackPercentage, totalTime });
  }

  private async loadVideoState() {
    const videoState = await this.playerService.getVideoState(this.playerId);
    this.startTime = videoState?.currentTime || 0;
    this.playbackPercentage.set(videoState?.playbackPercentage || 0);
  }

  public async playVideo() {
    // Remove thumbnail from future playback
    this.showThumbnail.set(false);

    if (this.isNative) {
      this.nativePlayer()?.play();
    } else {
      this.webPlayer()?.play();
    }

    // Track video play event
    this.analyticsService.trackVideoPlay(this.playerId);
  }
}

// HACK - adapted from db method
function generateID(length = 20, chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
  let autoId = '';
  for (let i = 0; i < length; i++) {
    autoId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return autoId;
}
