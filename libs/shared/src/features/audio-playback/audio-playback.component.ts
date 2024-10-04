import { Component, ViewChild, ElementRef, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AudioService } from './audio-playback.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'picsa-audio-playback',
  standalone: true,
  imports:[CommonModule, MatIconModule],
  templateUrl: './audio-playback.component.html',
  styleUrls: ['./audio-playback.component.scss'],
})
export class AudioPlaybackComponent implements OnDestroy {
  @Input() audioUrl: string;
  isAudioPlaying = false;

  constructor(private audioService: AudioService) {}

  togglePlayback(): void {
    if (this.audioService.isPlaying()) {
      this.audioService.pauseAudio();
      this.isAudioPlaying = true;
    } else {
      this.audioService.playAudio(this.audioUrl);
      this.isAudioPlaying = false;
    }
  }

  isPlaying(): boolean {
    return this.audioService.isPlaying();
  }

  ngOnDestroy(): void {
    this.audioService.stop();
  }
}
