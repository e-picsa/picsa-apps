import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AudioService {
  private audio: HTMLAudioElement;

  constructor() {
    this.audio = new Audio();
  }

  playAudio(url: string): void {
    if (this.audio.src !== url) {
      this.audio.src = url;
    }
    this.audio.play();
  }

  pauseAudio(): void {
    this.audio.pause();
  }

  isPlaying(): boolean {
    return !this.audio.paused;
  }

  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
  }
}
