import { Component, input, output, signal } from '@angular/core';

export interface IVideoPlayerProgressEvent {
  currentTime: number;
  totalTime: number;
}

@Component({ template: `` })
export class VideoPlayerBaseComponent {
  /** Video source (data object url) */
  public source = input.required<string>();
  /** Timestamp to start playback from */
  public startTime = input<number>();
  /** Timestamp to set placeholder thumbnail to */
  public placeholderTime = input<number>();

  public playerLoaded = signal(false);

  public playbackProgress = output<IVideoPlayerProgressEvent>();
}
