import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { VideoPlayerComponent } from './video-player.component';

@NgModule({
  imports: [CommonModule, MatButtonModule, MatIconModule],
  exports: [VideoPlayerComponent],
  declarations: [VideoPlayerComponent],
  providers: [],
})
/**
 * Provide a `<picsa-video-player>` component that plays videos on web or native device
 */
export class PicsaVideoPlayerModule {}
