import { Component, Input } from '@angular/core';

import { VideoPlayerService } from '../video-player.service';

@Component({
  selector: 'picsa-video-thumbnail',
  templateUrl: './video-thumbnail.component.html',
  styleUrls: ['./video-thumbnail.component.scss'],
  standalone: false,
})
export class VideoThumbnailComponent {
  @Input() videoUrl?: string;

  @Input() thumbnail?: string;

  generatedThumbnail: string;

  constructor(private service: VideoPlayerService) {}

  async ngOnInit() {
    await this.service.ready();
    if (this.videoUrl && !this.thumbnail) {
      this.generatedThumbnail = await this.service.generateVideoThumbnail(this.videoUrl);
    }
  }
}
