import { Component, computed, effect, ElementRef, inject, OnInit, signal, viewChild } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { DomSanitizer } from '@angular/platform-browser';
import { firstValueFrom, map } from 'rxjs';

import { VideoPlayerBaseComponent } from './video-player.base';

@Component({
  selector: 'picsa-video-player-web',
  template: ` <video preload="auto" [src]="videoUrl()" #videoEl class="block w-full h-full object-cover"></video> `,
  styles: [
    `
      :host {
        display: contents;
      }
      // Ensure full-screen video maintains aspect ration on portrait videos (digi-skills)
      video {
        width: 100%;
        height: 100%;
        object-fit: contain;
        background-color: black;
      }
    `,
  ],
})
export class VideoPlayerWebComponent extends VideoPlayerBaseComponent implements OnInit {
  private sanitizer = inject(DomSanitizer);

  public videoUrl = computed(() => {
    const source = this.source();
    return this.sanitizer.bypassSecurityTrustUrl(source);
  });

  private playerLoaded$ = toObservable(this.playerLoaded);

  private isFullScreen = signal(false);

  private get videoEl() {
    return this.videoElRef().nativeElement;
  }

  private videoElRef = viewChild.required<ElementRef<HTMLVideoElement>>('videoEl');

  private registeredListeners: Partial<Record<keyof HTMLVideoElementEventMap, () => void>> = {};

  constructor() {
    super();
    // Add/Remove event listeners on creation
    effect((onCleanup) => {
      if (this.videoElRef().nativeElement) {
        this.addListeners();
        onCleanup(() => {
          this.removeListeners();
        });
      }
    });
    //
    effect(() => {
      const playerLoaded = this.playerLoaded();
      const fullScreen = this.isFullScreen();
      if (playerLoaded && !fullScreen) {
        this.pause();
      }
    });
  }

  async ngOnInit() {
    // Auto seek to placeholder time when player ready
    await firstValueFrom(this.playerLoaded$.pipe(map((v) => v === true)));
    this.videoEl.currentTime = this.startTime() || this.placeholderTime() || 0;
  }

  public async play() {
    // Start from 0s if placeholder time being used
    if (this.videoEl.currentTime === this.placeholderTime()) {
      this.videoEl.currentTime = 0;
    }
    this.videoEl.requestFullscreen();
    this.videoEl.play();
  }

  public async pause() {
    this.videoEl.pause();
  }

  private emitPlaybackTime(currentTime: number) {
    const totalTime = this.videoEl.duration;
    this.playbackProgress.emit({ currentTime, totalTime });
  }

  /***********************************************************************************************
   *                                    Events
   ***********************************************************************************************/

  private videoElEventMap: Partial<Record<keyof HTMLVideoElementEventMap, (e: Event) => void>> = {
    loadedmetadata: () => this.playerLoaded.set(true),
    pause: () =>
      // wait before exiting in case using seek bar
      // TODO - add better trackign of mousedown/touch to check if seeking...
      setTimeout(() => {
        if (this.videoEl.paused) {
          this.emitPlaybackTime(this.videoEl.currentTime);
          document.exitFullscreen();
        }
      }, 500),
    ended: () => {
      this.emitPlaybackTime(this.videoEl.duration);
      document.exitFullscreen();
    },
  };

  private addListeners() {
    // register video event listeners
    for (const [event, fn] of Object.entries(this.videoElEventMap)) {
      const cb = fn.bind(this);
      this.videoEl.addEventListener(event, cb);
      this.registeredListeners[event] = cb;
    }
    // register dom event listeners
    document.addEventListener('fullscreenchange', this.handleFullScreenChange.bind(this));
  }

  private removeListeners() {
    // remove video event listeners
    for (const [event, cb] of Object.entries(this.registeredListeners)) {
      this.videoEl.removeEventListener(event, cb);
    }
    // remove dom event listeners
    document.removeEventListener('fullscreenchange', this.handleFullScreenChange);
  }

  private handleFullScreenChange() {
    this.isFullScreen.set(document.fullscreenElement ? true : false);
  }
}
