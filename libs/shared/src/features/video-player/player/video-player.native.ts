import { Component, effect, input } from '@angular/core';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { _wait } from '@picsa/utils';
import {
  CapacitorVideoPlayer,
  CapacitorVideoPlayerPlugin,
  capVideoListener,
  capVideoPlayerOptions,
  VideoEventName,
} from 'capacitor-video-player';

import { generateID } from '../../../services/core/db/db.service';
import { VideoPlayerBaseComponent } from './video-player.base';

interface IVideoPlayer extends CapacitorVideoPlayerPlugin {
  // TODO - confirm whether this actually is passed, or whether need to
  // manually retrieve after register and remove, e.g.
  // `const listener = await this.videoPlayer.addListener(...)`
  // `listener.remove()`
  removeListener: (event: VideoEventName, callback: (data: capVideoListener) => void) => void;
}

@Component({
  selector: 'picsa-video-player-native',
  template: ``,
})
export class VideoPlayerNativeComponent extends VideoPlayerBaseComponent {
  /** Override default player options */
  public playerOptions = input<capVideoPlayerOptions>();

  private playerId: string;

  private videoPlayer = CapacitorVideoPlayer as IVideoPlayer;

  private currentTime: number;
  private totalTime: number;

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
    try {
      // Ensure any previously playing videos have a chance to stop
      await this.videoPlayer.stopAllPlayers();
      this.removeListeners();
      await _wait(200);
    } catch (error) {
      // Silent fail - player might already be destroyed
    }
    // Create a new player id to fix issue where pausing, exiting, and playing same file breaks player
    this.playerId = `videoPlayer_${generateID(5)}`;

    // play needs to initialise every time on native
    await this.initPlayer();
    // register listeners each play (unregisters on exit)
    this.addListeners();
    await this.setPlayerInitialTime(this.currentTime || this.startTime() || 0);

    await this.videoPlayer.play({ playerId: this.playerId });
  }

  private async updatePlaybackProgress(currentTime: number | string) {
    // Some events like pause can emit string so ensure parsed as integer
    if (typeof currentTime === 'string') {
      currentTime = parseInt(currentTime);
    }
    this.currentTime = currentTime;
    // Initial playback can trigger pause event before total time has been calculated
    // so only emit after total time checked
    if (!this.totalTime) {
      const durationRes = await this.videoPlayer.getDuration({ playerId: this.playerId });
      this.totalTime = durationRes.value;
    }
    if (this.totalTime) {
      this.playbackProgress.emit({ currentTime: this.currentTime, totalTime: this.totalTime });
    }
  }

  /** Set the initial time for video player feedback */
  private async setPlayerInitialTime(seektime = 0) {
    // Hack - on android the seek time can only be set after confirmation the player is ready
    await this.waitForPlayerReady();
    await this.videoPlayer.setCurrentTime({ playerId: this.playerId, seektime });
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

  private async initPlayer(options: Partial<capVideoPlayerOptions> = {}) {
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
      // Do not enforce specific portrait or landscape orientation as video content mixed
      displayMode: 'all',
      bkmodeEnabled: false,
      pipEnabled: false,
      // Disable chromecast to prevent issue. Proper workaround could involve better video lifecycle management or patching package (see claude 4 tips)
      // Fatal Exception: java.lang.NullPointerException: Attempt to invoke virtual method 'void com.google.android.exoplayer2.ext.cast.CastPlayer.release()' on a null object reference
      // at com.jeep.plugin.capacitor.capacitorvideoplayer.FullscreenExoPlayerFragment.releasePlayer(FullscreenExoPlayerFragment.java:730)
      chromecast: false,
    };

    // // Embedded player options - Use host element to calculate default player size
    // const { clientWidth } = this.elementRef.nativeElement;
    // defaultOptions.width = clientWidth;
    // defaultOptions.height = Math.round((clientWidth * 9) / 16);

    // Merge default options with user override
    const mergedPlayerOptions = { ...defaultOptions, ...options };
    const res = await this.videoPlayer.initPlayer(mergedPlayerOptions);

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

  private async handlePlayerPause(currentTime: number, playerId: string) {
    console.log('[Video Player] pause', currentTime);
    if (playerId === this.playerId) {
      this.updatePlaybackProgress(currentTime);
    }
  }

  private async handlePlayerEnded(currentTime: number, playerId: string) {
    console.log('[Video Player] ended', currentTime);
    if (playerId === this.playerId) {
      this.updatePlaybackProgress(currentTime);
      this.removeListeners();
    }
  }

  private async handlePlayerExit(currentTime: number, playerId: string) {
    console.log('[Video Player] exit', currentTime, playerId);
    // HACK - player exit can get caught by multiple players (listeners do not seem to unregister correctly)
    // so include playerId
    if (playerId === this.playerId) {
      this.updatePlaybackProgress(currentTime);
      this.removeListeners();
    }
    // Ensure don't get stuck in landscape
    await ScreenOrientation.unlock();
  }

  private listeners: { event: VideoEventName; callback: (e: capVideoListener) => void }[] = [];

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
      this.handlePlayerPause(e.currentTime!, e.fromPlayerId!);
    };
    this.videoPlayer.addListener('jeepCapVideoPlayerPause', jeepCapVideoPlayerPause);
    this.listeners.push({ event: 'jeepCapVideoPlayerPause', callback: jeepCapVideoPlayerPause });

    // Ended
    const jeepCapVideoPlayerEnded = (e: capVideoListener) => {
      this.handlePlayerEnded(e.currentTime!, e.fromPlayerId!);
    };
    this.videoPlayer.addListener('jeepCapVideoPlayerEnded', jeepCapVideoPlayerEnded);
    this.listeners.push({ event: 'jeepCapVideoPlayerEnded', callback: jeepCapVideoPlayerEnded });

    // Exit - NOTE - different callback
    const playerId = this.playerId;
    const jeepCapVideoPlayerExit = (e: { dismiss?: boolean; currentTime: number }) => {
      this.handlePlayerExit(e.currentTime, playerId);
    };
    this.videoPlayer.addListener('jeepCapVideoPlayerExit', jeepCapVideoPlayerExit);
    this.listeners.push({ event: 'jeepCapVideoPlayerExit', callback: jeepCapVideoPlayerExit } as any);
  }

  /** Remove all event listeners */
  private removeListeners() {
    for (const { event, callback } of this.listeners) {
      this.videoPlayer.removeListener(event, callback);
    }
    this.listeners = [];
  }
}
