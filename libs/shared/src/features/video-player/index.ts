import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { VideoPlayerComponent } from './video-player.component';
import { VideoThumbnailComponent } from './video-thumbnail/video-thumbnail.component';

@NgModule({
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressBarModule],
  exports: [VideoPlayerComponent],
  declarations: [VideoPlayerComponent, VideoThumbnailComponent],
  providers: [],
})
/**
 * Provide a `<picsa-video-player>` component that plays videos on web or native device
 */
export class PicsaVideoPlayerModule {}
