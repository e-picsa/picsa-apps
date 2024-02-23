import { Component, ElementRef, HostBinding, Input, OnDestroy } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { CapacitorVideoPlayer, CapacitorVideoPlayerPlugin, capVideoPlayerOptions } from 'capacitor-video-player';

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
})
export class VideoPlayerComponent implements OnDestroy {
  /** Optional override of player options */
  @Input() options: Partial<capVideoPlayerOptions> = {};
  /** Video source - can be string url or data blob */
  @Input() source?: string;
  /** Optional image shown as preview */
  @Input() thumbnail?: string;

  /** Specify whether should open overlay to play video (default inline) */
  @Input() playInModal = false;

  // Bind player id to host element to support element query when initialising player
  @HostBinding('attr.data-player-id') playerId = `videoPlayer_${generateID(5)}`;

  protected showPlayButton = true;

  public videoPlayer = CapacitorVideoPlayer as IVideoPlayer;

  private playerOptions: capVideoPlayerOptions;

  /** Track if player has been initialised */
  private initialised = false;

  /** Track any created object urls to dispose on destroy */
  private objectUrl: string;

  private pauseTime: number = 0;

  constructor(private elementRef: ElementRef<HTMLDivElement>) {}

  async ngOnDestroy() {
    await this.videoPlayer.stopAllPlayers();
    this.removeListeners();
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
    }
  }

  public async pauseVideo() {
    return this.videoPlayer.pause({ playerId: this.playerId });
  }

  public async playVideo() {
    // Remove thumbnail from future playback
    this.thumbnail = undefined;
    await this.videoPlayer.stopAllPlayers();
    if (Capacitor.isNativePlatform()) {
      this.initialised = false;
    }
    // Initialise player any time playback triggered in case url updated (e.g. downloaded after init)
    await this.initPlayer();
    this.videoPlayer.play({ playerId: this.playerId }).then(() => {
      if (this.pauseTime > 0) {
        setTimeout(() => {
          this.videoPlayer.setCurrentTime({ playerId: this.playerId, seektime: this.pauseTime });
        }, 500);
      }
    });
  }

  private async initPlayer() {
    if (this.initialised) return;
    if (!this.source) return;
    const url = this.convertSourceToUrl(this.source);
    const { clientWidth } = this.elementRef.nativeElement;
    // load player
    const defaultOptions: capVideoPlayerOptions = {
      mode: 'embedded',
      url,
      playerId: this.playerId,
      componentTag: `picsa-video-player[data-player-id="${this.playerId}"]`,
      exitOnEnd: false,
      // Use host element to calculate default player size
      width: clientWidth,
      height: Math.round((clientWidth * 9) / 16),
      displayMode: 'landscape',
    };
    if (Capacitor.isNativePlatform()) {
      defaultOptions.mode = 'fullscreen';
      defaultOptions.exitOnEnd = true;
    }
    // Merge default options with user override
    this.playerOptions = { ...defaultOptions, ...this.options };
    await this.videoPlayer.initPlayer(this.playerOptions);
    this.addListeners();
    this.initialised = true;
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

  /**
   * Add listener for play events
   * Use named functions to allow removal on destroy
   */
  private addListeners() {
    this.videoPlayer.addListener('jeepCapVideoPlayerReady', this.handlePlayerReady.bind(this));
    this.videoPlayer.addListener('jeepCapVideoPlayerPlay', this.handlePlayerPlay.bind(this));
    this.videoPlayer.addListener('jeepCapVideoPlayerPause', this.handlePlayerPause.bind(this));
    this.videoPlayer.addListener('jeepCapVideoPlayerEnded', this.handlePlayerEnded.bind(this));
    this.videoPlayer.addListener('jeepCapVideoPlayerExit', this.handlePlayerExit.bind(this));
  }

  /** Remove all event listeners */
  private removeListeners() {
    this.videoPlayer.removeListener('jeepCapVideoPlayerReady', this.handlePlayerReady);
    this.videoPlayer.removeListener('jeepCapVideoPlayerPlay', this.handlePlayerPlay);
    this.videoPlayer.removeListener('jeepCapVideoPlayerPause', this.handlePlayerPause);
    this.videoPlayer.removeListener('jeepCapVideoPlayerEnded', this.handlePlayerEnded);
    this.videoPlayer.removeListener('jeepCapVideoPlayerExit', this.handlePlayerExit);
  }
  private handlePlayerReady() {
    this.showPlayButton = true;
  }
  private handlePlayerPlay(e: { fromPlayerId: string }) {
    // Events can be emitted from any player, so only update play button of current player id
    if (e.fromPlayerId === this.playerId) {
      this.showPlayButton = false;
    }
  }

  private handlePlayerPause(e: { fromPlayerId: string; currentTime: number }) {
    if (e.fromPlayerId === this.playerId) {
      this.pauseTime = e.currentTime;
      this.showPlayButton = true;
    }
  }

  private handlePlayerEnded() {
    this.showPlayButton = true;
  }
  private async handlePlayerExit(e: { currentTime: number }) {
    this.showPlayButton = true;
    this.pauseTime = e.currentTime;
    // Ensure player does not stay stuck in landscape mode
    if (Capacitor.isNativePlatform()) {
      await ScreenOrientation.unlock();
    }
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
