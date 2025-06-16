import { Component, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AudioService } from './audio-playback.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'picsa-audio-playback',
  standalone: true,
  imports:[CommonModule, MatIconModule, MatButtonModule],
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
