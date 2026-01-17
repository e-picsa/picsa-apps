import { Component, Input, OnDestroy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { AudioService } from './audio-playback.service';

@Component({
  selector: 'picsa-audio-playback',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './audio-playback.component.html',
  styleUrls: ['./audio-playback.component.scss'],
})
export class AudioPlaybackComponent implements OnDestroy {
  @Input() audioUrl: string;
  isAudioPlaying = false;

  constructor(private audioService: AudioService) {}

  togglePlayback(): void {
    this.isAudioPlaying = !this.isAudioPlaying;
    if (this.audioService.isPlaying()) {
      this.audioService.pauseAudio();
    } else {
      this.audioService.playAudio(this.audioUrl);
    }
  }

  ngOnDestroy(): void {
    this.audioService.stop();
  }
}
