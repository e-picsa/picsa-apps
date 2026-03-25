import { Component, effect, input } from '@angular/core';
import { PluginListenerHandle } from '@capacitor/core';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { _wait } from '@picsa/utils';
import { CapacitorVideoPlayer, capVideoListener, capVideoPlayerOptions } from 'capacitor-video-player';

import { generateID } from '../../../services/core/db/db.service';
import { VideoPlayerBaseComponent } from './video-player.base';

@Component({
  selector: 'picsa-video-player-native',
  template: ``,
})
export class VideoPlayerNativeComponent extends VideoPlayerBaseComponent {
  /** Override default player options */
  public playerOptions = input<capVideoPlayerOptions>();

  private playerId: string;

  private videoPlayer = CapacitorVideoPlayer;

  private currentTime: number;
  private totalTime: number;

  private playerReadyResolve: (() => void) | null = null;

  private listenerHandles: PluginListenerHandle[] = [];

  constructor() {
    super();
    effect((onCleanup) => {
      onCleanup(async () => {
        await this.videoPlayer.stopAllPlayers();
        await this.removeListeners();
      });
    });
  }

  public async play() {
    // Stop playback from any other players
    try {
      await this.videoPlayer.stopAllPlayers();
      await this.removeListeners();
      await _wait(200);
    } catch (error) {
      // Silent fail - player might already be destroyed
    }
    // Create a new player id to fix issue where pausing, exiting, and playing same file breaks player
    this.playerId = `videoPlayer_${generateID(5)}`;

    // Register listeners BEFORE initPlayer so we can't miss the ready event
    await this.addListeners();

    // Capture the ready promise before init triggers the event
    const readyPromise = this.waitForPlayerReady();

    // play needs to initialise every time on native
    await this.initPlayer();

    // Wait for ready, then seek
    await readyPromise;

    const seektime = this.currentTime || this.startTime() || 0;
    if (seektime > 0) {
      await this.videoPlayer.setCurrentTime({
        playerId: this.playerId,
        seektime,
      });
    }

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
      const durationRes = await this.videoPlayer.getDuration({
        playerId: this.playerId,
      });
      this.totalTime = durationRes.value;
    }
    if (this.totalTime) {
      this.playbackProgress.emit({
        currentTime: this.currentTime,
        totalTime: this.totalTime,
      });
    }
  }

  /**
   * Detect when player ready event has been fired.
   * Resolved by handlePlayerReady() via the shared listener in addListeners().
   */
  private waitForPlayerReady(): Promise<void> {
    return new Promise((resolve) => {
      this.playerReadyResolve = resolve;
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
    if (this.playerReadyResolve) {
      this.playerReadyResolve();
      this.playerReadyResolve = null;
    }
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
      await this.removeListeners();
    }
  }

  private async handlePlayerExit(currentTime: number, playerId: string) {
    console.log('[Video Player] exit', currentTime, playerId);
    // HACK - player exit can get caught by multiple players (listeners do not seem to unregister correctly)
    // so include playerId
    if (playerId === this.playerId) {
      this.updatePlaybackProgress(currentTime);
      await this.removeListeners();
    }
    await ScreenOrientation.unlock();
  }

  /**
   * Add listener for play events.
   * Each addListener call returns a PluginListenerHandle which is stored
   * so it can be properly removed later via handle.remove().
   */
  private async addListeners() {
    // Ensure no previous listeners remain
    await this.removeListeners();

    // Ready
    const readyHandle = await this.videoPlayer.addListener('jeepCapVideoPlayerReady', (e: capVideoListener) => {
      if (e.fromPlayerId === this.playerId) {
        this.handlePlayerReady();
      }
    });
    this.listenerHandles.push(readyHandle);

    // Play
    const playHandle = await this.videoPlayer.addListener('jeepCapVideoPlayerPlay', (e: capVideoListener) => {
      if (e.fromPlayerId === this.playerId) {
        this.handlePlayerPlay();
      }
    });
    this.listenerHandles.push(playHandle);

    // Pause
    const pauseHandle = await this.videoPlayer.addListener('jeepCapVideoPlayerPause', (e: capVideoListener) => {
      this.handlePlayerPause(e.currentTime!, e.fromPlayerId!);
    });
    this.listenerHandles.push(pauseHandle);

    // Ended
    const endedHandle = await this.videoPlayer.addListener('jeepCapVideoPlayerEnded', (e: capVideoListener) => {
      this.handlePlayerEnded(e.currentTime!, e.fromPlayerId!);
    });
    this.listenerHandles.push(endedHandle);

    // Exit - NOTE - different callback shape
    const playerId = this.playerId;
    const exitHandle = await this.videoPlayer.addListener(
      'jeepCapVideoPlayerExit',
      (e: { dismiss?: boolean; currentTime: number }) => {
        this.handlePlayerExit(e.currentTime, playerId);
      },
    );
    this.listenerHandles.push(exitHandle);
  }

  /** Remove all event listeners via their stored handles */
  private async removeListeners() {
    const handles = this.listenerHandles;
    this.listenerHandles = [];
    this.playerReadyResolve = null;
    await Promise.all(handles.map((h) => h.remove()));
  }
}
