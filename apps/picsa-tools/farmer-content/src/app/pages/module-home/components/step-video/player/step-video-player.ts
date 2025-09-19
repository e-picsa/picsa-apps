import { Component, computed, input, viewChild } from '@angular/core';
import { IPicsaVideoData, RESOURCE_VIDEO_HASHMAP } from '@picsa/data/resources';
import { ResourceDownloadComponent } from '@picsa/resources/components';
import { PicsaVideoPlayerModule } from '@picsa/shared/features';
import { VideoPlayerComponent } from '@picsa/shared/features/video-player/video-player.component';

/**
 * Temporary component to help migrate between legacy flat resource format
 * to newer content which contains nested videos and allows auto-select
 * video based on user's locale preference
 *
 * TODO - ideally all video resources should be refactored in a similar way
 * and support for child resources integrated into main resource components
 */
@Component({
  selector: 'farmer-step-video-player',
  templateUrl: 'step-video-player.html',
  styleUrl: 'step-video-player.scss',
  imports: [PicsaVideoPlayerModule, ResourceDownloadComponent],
})
export class FarmerStepVideoPlayerComponent {
  public video = input.required<IPicsaVideoData>();

  public videoResources = computed(() => this.toVideoResources(this.video()));

  public playerComponent = viewChild<VideoPlayerComponent>('videoPlayer');
  public downloaderComponent = viewChild<ResourceDownloadComponent>('dl');

  // Expose public click handler to allow programattic click from playlist
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

  private toVideoResources(video: IPicsaVideoData) {
    return video.children.map((v) => RESOURCE_VIDEO_HASHMAP[v.id]).filter(Boolean);
  }
}
