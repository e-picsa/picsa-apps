import { Component, ElementRef, HostBinding, Input, input, OnDestroy, signal, viewChild } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { CapacitorVideoPlayer, CapacitorVideoPlayerPlugin, capVideoPlayerOptions } from 'capacitor-video-player';

import { AnalyticsService } from '../../services/core/analytics.service';
import { IVideoPlayerWebPlaybackTimeEvent, VideoPlayerWebComponent } from './player/video-player.web';
import { VideoPlayerService } from './video-player.service';

// Fix listeners missing from type
// https://github.com/jepiqueau/capacitor-video-player/blob/master/docs/API.md#listeners
type IVideoEvent =
  | 'jeepCapVideoPlayerReady'
  | 'jeepCapVideoPlayerPlay'
  | 'jeepCapVideoPlayerPause'
  | 'jeepCapVideoPlayerEnded'
  | 'jeepCapVideoPlayerExit';
interface capVideoListener {
  fromPlayerId: string;
  currentTime: number;
}
interface IVideoPlayer extends CapacitorVideoPlayerPlugin {
  addListener: (event: IVideoEvent, callback: (data: capVideoListener) => void) => void;
  removeListener: (event: IVideoEvent, callback: (data: capVideoListener) => void) => void;
}

@Component({
  selector: 'picsa-video-player',
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.scss'],
  standalone: false,
})
export class VideoPlayerComponent implements OnDestroy {
  public isNative = Capacitor.isNativePlatform();

  public startTime: number;

  /** Optional override of player options */
  @Input() options: Partial<capVideoPlayerOptions> = {};

  /** Unique video id, used for analytics and handling multiple videos */
  @Input() id: string;

  /** Video source - can be string url or data blob */
  source = input<string | undefined>();

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

  private webPlayer = viewChild<VideoPlayerWebComponent>('webPlayer');

  protected showPlayButton = true;

  protected showThumbnail = signal(true);

  public videoPlayer = CapacitorVideoPlayer as IVideoPlayer;

  private playerOptions: capVideoPlayerOptions;

  /** Track if player has been initialised */
  private initialised = false;

  /** Track any created object urls to dispose on destroy */
  private objectUrl: string;

  totalTime: number;

  playbackPercentage = signal<number>(0);

  constructor(
    private analyticsService: AnalyticsService,
    private playerService: VideoPlayerService,
    private elementRef: ElementRef
  ) {}

  public async handlePlaybackProgressChanged(e: IVideoPlayerWebPlaybackTimeEvent) {
    const { currentTime, percentage: playbackPercentage, totalTime } = e;
    this.playbackPercentage.set(playbackPercentage);
    await this.playerService.updateVideoState({ videoId: this.playerId, currentTime, playbackPercentage, totalTime });
  }

  async ngOnInit() {
    await this.playerService.ready();
    await this.loadVideoState();
  }

  private async loadVideoState() {
    const videoState = await this.playerService.getVideoState(this.playerId);
    this.startTime = videoState?.currentTime || 0;
    this.playbackPercentage.set(videoState?.playbackPercentage || 0);
  }

  async ngOnDestroy() {
    await this.videoPlayer.stopAllPlayers();
    this.removeListeners();
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
    }
  }

  private async saveVideoState() {
    // // Getting the total time of the video
    // const currenttime = await this.videoPlayer.getCurrentTime({ playerId: this.playerId });
    // const totalTimeResult = await this.videoPlayer.getDuration({ playerId: this.playerId });
    // this.totalTime = totalTimeResult.value || this.totalTime || 1;
    // // Calculating the playback percentage
    // this.playbackPercentage = (currenttime.value / this.totalTime) * 100;
    // // Saving the video state
    // const videoState = {
    //   videoId: this.playerId,
    //   currentTime: this.pauseTime,
    //   totalTime: this.totalTime,
    //   playbackPercentage: this.playbackPercentage,
    // };
    // await this.playerService.updateVideoState(videoState);
  }

  public async playVideo() {
    // Remove thumbnail from future playback
    this.showThumbnail.set(false);

    if (this.isNative) {
      //
    } else {
      console.log('webPlayer', this.webPlayer());
      this.webPlayer()?.play();
    }

    return;

    // Stop playback from any other players
    await this.videoPlayer.stopAllPlayers();
    // Track video play event
    this.analyticsService.trackVideoPlay(this.playerId);

    // if (!this.initialised) {
    await this.initPlayer();
    // }

    await this.videoPlayer.play({ playerId: this.playerId });
  }

  /** Set the initial time for video player feedback */
  private async setPlayerInitialTime(seektime = 0) {
    if (Capacitor.isNativePlatform()) {
      // Hack - on android the seek time can only be set after confirmation the player is ready
      await this.waitForPlayerReady();
      await this.videoPlayer.setCurrentTime({ playerId: this.playerId, seektime });
    } else {
      // HACK - on web the setCurrentTime method does not work unless video already running
      // so manually detect video element and set time
      const videoEl = this.getWebVideoEl();
      if (videoEl) {
        videoEl.currentTime = seektime;
      }
    }
  }
  private getWebVideoEl() {
    return this.elementRef.nativeElement.querySelector('video') as HTMLVideoElement;
  }

  /**
   * Detect when player ready event has been fired
   * Used on android when triggering a full screen video
   */
  private async waitForPlayerReady() {
    return new Promise((resolve) => {
      const playerReadyCalback = (e: capVideoListener) => {
        if (e.fromPlayerId === this.playerId) {
          this.videoPlayer.removeListener('jeepCapVideoPlayerReady', playerReadyCalback);
          resolve(true);
        }
      };
      this.videoPlayer.addListener('jeepCapVideoPlayerReady', playerReadyCalback);
    });
  }

  private async initPlayer() {
    const source = this.source();
    if (!source) return;
    const url = this.convertSourceToUrl(source);

    // load player
    const defaultOptions: capVideoPlayerOptions = {
      mode: 'fullscreen',
      exitOnEnd: true,
      url,
      playerId: this.playerId,
      componentTag: `picsa-video-player[data-player-id="${this.playerId}"]`,
      displayMode: 'landscape',
      bkmodeEnabled: false,
      pipEnabled: false,
    };

    // // Embedded player options - Use host element to calculate default player size
    // const { clientWidth } = this.elementRef.nativeElement;
    // defaultOptions.width = clientWidth;
    // defaultOptions.height = Math.round((clientWidth * 9) / 16);

    // Merge default options with user override
    this.playerOptions = { ...defaultOptions, ...this.options };
    const res = await this.videoPlayer.initPlayer(this.playerOptions);
    this.addListeners();
    // HACK - on web play only needs to initialise once but on Android needs to init every playback
    if (!Capacitor.isNativePlatform()) {
      this.initialised = true;
    }
    return res;
  }

  /** Video player requires url source, handle conversion from blob or internal asset url */
  private convertSourceToUrl(source: string) {
    // NOTE - android local assets require 'public' prefix
    // https://github.com/jepiqueau/capacitor-video-player/blob/master/docs/API.md#from-asset
    if (Capacitor.isNativePlatform()) {
      if (source.startsWith('assets')) {
        source = `public/${source}`;
      }
    }

    return source;
  }

  /*********************************************************************************
   *                                  Events
   * Various play start/stop events can be listened to, with player id and time returned
   * Currently mostly just used for toggling play button display
   *********************************************************************************/

  private handlePlayerReady() {
    // console.log('[Video Player] ready');
    this.showPlayButton = true;
  }
  private handlePlayerPlay() {
    // console.log('[Video Player] play');

    this.showPlayButton = false;
  }

  private async handlePlayerPause(currentTime: number) {
    console.log('[Video Player] pause', currentTime);
    this.showPlayButton = true;
    await this.saveVideoState();
  }

  private async handlePlayerEnded(currentTime: number) {
    console.log('[Video Player] ended', currentTime);
    this.showPlayButton = true;

    await this.saveVideoState();
  }

  private async handlePlayerExit() {
    console.log('[Video Player] exit');
    // HACK - player exit event not bound to specific player instance so do not update video state
    // this means that progress state cannot be saved if user exits video without first pausing
    // (this only applies to fullscreen videos played on native devices)

    // Ensure player does not stay stuck in landscape mode
    if (Capacitor.isNativePlatform()) {
      await ScreenOrientation.unlock();
    }
    this.showPlayButton = true;
  }

  private listeners: { event: IVideoEvent; callback: (e: capVideoListener) => void }[] = [];

  /**
   * Add listener for play events
   * Use named functions to allow removal on destroy
   *
   * Events can be emitted from any player, so only all events only trigger callback
   * when matching player ID
   */
  private addListeners() {
    // Ensure no previous listeners remain (on android listeners need to be registered every time playback starts)
    this.removeListeners();

    // Ready
    const jeepCapVideoPlayerReady = (e: capVideoListener) => {
      if (e.fromPlayerId === this.playerId) {
        this.handlePlayerReady();
      }
    };
    this.videoPlayer.addListener('jeepCapVideoPlayerReady', jeepCapVideoPlayerReady);
    this.listeners.push({ event: 'jeepCapVideoPlayerReady', callback: jeepCapVideoPlayerReady });

    // Play
    const jeepCapVideoPlayerPlay = (e: capVideoListener) => {
      if (e.fromPlayerId === this.playerId) {
        this.handlePlayerPlay();
      }
    };
    this.videoPlayer.addListener('jeepCapVideoPlayerPlay', jeepCapVideoPlayerPlay);
    this.listeners.push({ event: 'jeepCapVideoPlayerPlay', callback: jeepCapVideoPlayerPlay });

    // Pause
    const jeepCapVideoPlayerPause = (e: capVideoListener) => {
      if (e.fromPlayerId === this.playerId) {
        this.handlePlayerPause(e.currentTime);
      }
    };
    this.videoPlayer.addListener('jeepCapVideoPlayerPause', jeepCapVideoPlayerPause);
    this.listeners.push({ event: 'jeepCapVideoPlayerPause', callback: jeepCapVideoPlayerPause });

    // Ended
    const jeepCapVideoPlayerEnded = (e: capVideoListener) => {
      if (e.fromPlayerId === this.playerId) {
        this.handlePlayerEnded(e.currentTime);
      }
    };
    this.videoPlayer.addListener('jeepCapVideoPlayerEnded', jeepCapVideoPlayerEnded);
    this.listeners.push({ event: 'jeepCapVideoPlayerEnded', callback: jeepCapVideoPlayerEnded });

    // Exit - NOTE - different callback
    const jeepCapVideoPlayerExit = (e: { dismiss?: boolean; currentTime: number }) => {
      this.handlePlayerExit();
    };
    this.videoPlayer.addListener('jeepCapVideoPlayerExit', jeepCapVideoPlayerExit);
    this.listeners.push({ event: 'jeepCapVideoPlayerExit', callback: jeepCapVideoPlayerExit });
  }

  /** Remove all event listeners */
  private removeListeners() {
    for (const { event, callback } of this.listeners) {
      this.videoPlayer.removeListener(event, callback);
    }
    this.listeners = [];
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
