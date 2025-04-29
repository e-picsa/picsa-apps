import { Component, Input, OnInit, signal } from '@angular/core';

import { VideoPlayerService } from '../video-player.service';

@Component({
  selector: 'picsa-video-thumbnail',
  templateUrl: './video-thumbnail.component.html',
  styleUrls: ['./video-thumbnail.component.scss'],
})
export class VideoThumbnailComponent implements OnInit {
  @Input() videoUrl?: string;

  @Input() thumbnail?: string;

  generatedThumbnail = signal<string | undefined>(undefined);

  constructor(private service: VideoPlayerService) {}

  async ngOnInit() {
    await this.service.ready();
    if (this.videoUrl && !this.thumbnail) {
      const thumbnail = await this.service.generateVideoThumbnail(this.videoUrl);
      this.generatedThumbnail.set(thumbnail);
    }
  }
}
