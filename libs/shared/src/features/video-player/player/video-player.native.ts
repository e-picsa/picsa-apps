import { Component, effect, input } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { CapacitorVideoPlayer, CapacitorVideoPlayerPlugin, capVideoPlayerOptions } from 'capacitor-video-player';

import { VideoPlayerBaseComponent } from './video-player.base';

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
  selector: 'picsa-video-player-native',
  template: ``,
})
export class VideoPlayerNativeComponent extends VideoPlayerBaseComponent {
  public playerId = input.required<string>();

  private videoPlayer = CapacitorVideoPlayer as IVideoPlayer;

  private playerOptions: capVideoPlayerOptions;

  /** Track if player has been initialised */
  private initialised = false;

  constructor() {
    super();
    effect((onCleanup) => {
      onCleanup(async () => {
        await this.videoPlayer.stopAllPlayers();
        this.removeListeners();
      });
    });
  }

  public async play() {
    // Stop playback from any other players
    await this.videoPlayer.stopAllPlayers();

    // if (!this.initialised) {
    await this.initPlayer();
    // }

    await this.videoPlayer.play({ playerId: this.playerId() });
  }

  private async updatePlaybackProgress() {
    const { value: currentTime } = await this.videoPlayer.getCurrentTime({ playerId: this.playerId() });
    const { value: totalTime } = await this.videoPlayer.getDuration({ playerId: this.playerId() });

    this.playbackProgress.emit({ currentTime, totalTime });
  }

  /** Set the initial time for video player feedback */
  private async setPlayerInitialTime(seektime = 0) {
    // Hack - on android the seek time can only be set after confirmation the player is ready
    await this.waitForPlayerReady();
    await this.videoPlayer.setCurrentTime({ playerId: this.playerId(), seektime });
  }

  /**
   * Detect when player ready event has been fired
   * Used on android when triggering a full screen video
   */
  private async waitForPlayerReady() {
    return new Promise((resolve) => {
      const playerReadyCalback = (e: capVideoListener) => {
        if (e.fromPlayerId === this.playerId()) {
          this.videoPlayer.removeListener('jeepCapVideoPlayerReady', playerReadyCalback);
          resolve(true);
        }
      };
      this.videoPlayer.addListener('jeepCapVideoPlayerReady', playerReadyCalback);
    });
  }

  private async initPlayer(options: Partial<capVideoPlayerOptions> = {}) {
    const source = this.source();
    if (!source) return;
    const url = this.convertSourceToUrl(source);

    // load player
    const defaultOptions: capVideoPlayerOptions = {
      mode: 'fullscreen',
      exitOnEnd: true,
      url,
      playerId: this.playerId(),
      componentTag: `picsa-video-player[data-player-id="${this.playerId()}"]`,
      displayMode: 'landscape',
      bkmodeEnabled: false,
      pipEnabled: false,
    };

    // // Embedded player options - Use host element to calculate default player size
    // const { clientWidth } = this.elementRef.nativeElement;
    // defaultOptions.width = clientWidth;
    // defaultOptions.height = Math.round((clientWidth * 9) / 16);

    // Merge default options with user override
    this.playerOptions = { ...defaultOptions, ...options };
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

    if (source.startsWith('assets')) {
      source = `public/${source}`;
    }

    return source;
  }

  /*********************************************************************************
   *                                  Events
   * Various play start/stop events can be listened to, with player id and time returned
   * Currently mostly just used for toggling play button display
   *********************************************************************************/

  private handlePlayerReady() {
    this.playerLoaded.set(true);
    // console.log('[Video Player] ready');
  }
  private handlePlayerPlay() {
    // console.log('[Video Player] play');
  }

  private async handlePlayerPause(currentTime: number) {
    console.log('[Video Player] pause', currentTime);
    await this.updatePlaybackProgress();
  }

  private async handlePlayerEnded(currentTime: number) {
    console.log('[Video Player] ended', currentTime);

    await this.updatePlaybackProgress();
  }

  private async handlePlayerExit() {
    console.log('[Video Player] exit');
    // HACK - player exit event not bound to specific player instance so do not update video state
    // this means that progress state cannot be saved if user exits video without first pausing
    // (this only applies to fullscreen videos played on native devices)

    // Ensure player does not stay stuck in landscape mode

    await ScreenOrientation.unlock();
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
      if (e.fromPlayerId === this.playerId()) {
        this.handlePlayerReady();
      }
    };
    this.videoPlayer.addListener('jeepCapVideoPlayerReady', jeepCapVideoPlayerReady);
    this.listeners.push({ event: 'jeepCapVideoPlayerReady', callback: jeepCapVideoPlayerReady });

    // Play
    const jeepCapVideoPlayerPlay = (e: capVideoListener) => {
      if (e.fromPlayerId === this.playerId()) {
        this.handlePlayerPlay();
      }
    };
    this.videoPlayer.addListener('jeepCapVideoPlayerPlay', jeepCapVideoPlayerPlay);
    this.listeners.push({ event: 'jeepCapVideoPlayerPlay', callback: jeepCapVideoPlayerPlay });

    // Pause
    const jeepCapVideoPlayerPause = (e: capVideoListener) => {
      if (e.fromPlayerId === this.playerId()) {
        this.handlePlayerPause(e.currentTime);
      }
    };
    this.videoPlayer.addListener('jeepCapVideoPlayerPause', jeepCapVideoPlayerPause);
    this.listeners.push({ event: 'jeepCapVideoPlayerPause', callback: jeepCapVideoPlayerPause });

    // Ended
    const jeepCapVideoPlayerEnded = (e: capVideoListener) => {
      if (e.fromPlayerId === this.playerId()) {
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
