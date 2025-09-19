import { Component, computed, input, viewChild } from '@angular/core';
import { ResourceDownloadComponent } from '@picsa/resources/components';
import { IResourceFile } from '@picsa/resources/schemas';
import { PicsaVideoPlayerModule } from '@picsa/shared/features';
import { VideoPlayerComponent } from '@picsa/shared/features/video-player/video-player.component';

@Component({
  selector: 'farmer-step-video-player',
  templateUrl: 'step-video-player.html',
  styleUrl: 'step-video-player.scss',
  imports: [PicsaVideoPlayerModule, ResourceDownloadComponent],
})
export class FarmerStepVideoPlayerComponent {
  public video = input.required<IResourceFile>();

  public videoResource = computed(() => this.video());

  public playerComponent = viewChild<VideoPlayerComponent>('videoPlayer');
  public downloaderComponent = viewChild<ResourceDownloadComponent>('dl');

  public handleItemClick() {
    const dlComponent = this.downloaderComponent();
    const videoPlayer = this.playerComponent();
    if (dlComponent?.downloadStatus() === 'ready') {
      return dlComponent.downloadResource();
    }
    if (videoPlayer?.source()) {
      videoPlayer.playVideo();
    }
  }
}
