import { AfterViewInit, Component, Input, OnDestroy } from '@angular/core';
import { Capacitor } from '@capacitor/core';
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
  playerId: string;
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
export class VideoPlayerComponent implements AfterViewInit, OnDestroy {
  /** Optional override of player options */
  @Input() options: Partial<capVideoPlayerOptions> = {};
  /** Url of video to player */
  @Input() url?: string;
  /** Unique identifier used in case of multiple players*/
  protected playerId = `videoPlayer${generateID(5)}`;

  protected showPlayButton = false;

  public videoPlayer = CapacitorVideoPlayer as IVideoPlayer;

  private playerOptions: capVideoPlayerOptions;

  async ngAfterViewInit() {
    // Automatically init after page loaded so that preview can be generated
    this.initPlayer();
  }

  async ngOnDestroy() {
    await this.videoPlayer.stopAllPlayers();
    this.removeListeners();
  }

  public async playVideo() {
    await this.videoPlayer.play({ playerId: this.playerId });
  }

  private async initPlayer() {
    const defaultOptions: capVideoPlayerOptions = {
      mode: 'embedded',
      url: this.url,
      playerId: this.playerId,
      componentTag: 'picsa-video-player',
      exitOnEnd: false,
      width: 480,
      height: 270,
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
  private handlePlayerPlay() {
    this.showPlayButton = false;
  }
  private handlePlayerPause() {
    this.showPlayButton = true;
  }

  private handlePlayerEnded() {
    this.showPlayButton = true;
  }
  private handlePlayerExit() {
    this.showPlayButton = true;
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
