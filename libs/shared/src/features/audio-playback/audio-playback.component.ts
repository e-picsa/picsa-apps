import { Component, Input } from '@angular/core';

import { AudioService } from './audio-playback.service';

@Component({
  selector: 'picsa-audio-playback',
  standalone: true,
  templateUrl: './audio-playback.component.html',
  styleUrls: ['./audio-playback.component.scss'],
})
export class AudioPlaybackComponent {
  @Input() audioUrl: string;

  constructor(private audioService: AudioService) {}

  togglePlayback(): void {
    if (this.audioService.isPlaying()) {
      this.audioService.pauseAudio();
    } else {
      this.audioService.playAudio(this.audioUrl);
    }
  }

  isPlaying(): boolean {
    return this.audioService.isPlaying();
  }
}
