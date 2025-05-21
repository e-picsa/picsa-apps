import { ChangeDetectionStrategy, Component, computed, effect, input } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { ConfigurationService } from '@picsa/configuration';
import { IPicsaVideoData, RESOURCE_VIDEO_HASHMAP } from '@picsa/data/resources';
import { ResourceDownloadComponent } from '@picsa/resources/components';
import { IResourceFile } from '@picsa/resources/schemas';
import { PicsaVideoPlayerModule } from '@picsa/shared/features';
import { VideoPlayerComponent } from '@picsa/shared/features/video-player/video-player.component';

import { getRankedChildVideos } from '../step-video/step-video.component';

@Component({
  selector: 'farmer-step-video-playlist',
  imports: [MatListModule, ResourceDownloadComponent, PicsaVideoPlayerModule],
  templateUrl: './step-video-playlist.component.html',
  styleUrl: './step-video-playlist.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FarmerStepVideoPlaylistComponent {
  videos = input.required<IPicsaVideoData[]>();

  public videoResources = computed(() => this.toVideoResources(this.videos()));

  constructor(private configurationService: ConfigurationService) {
    effect(() => {
      console.log('video resource', this.videoResources());
    });
  }

  public handleItemClick(
    videoResource: IResourceFile,
    dlComponent: ResourceDownloadComponent,
    videoPlayer: VideoPlayerComponent
  ) {
    if (dlComponent.downloadStatus() === 'ready') {
      return dlComponent.downloadResource();
    }
    if (videoPlayer.source()) {
      videoPlayer.playVideo();
    }
  }

  private toVideoResources(videos: IPicsaVideoData[]) {
    const userSettings = this.configurationService.userSettings();
    return videos
      .map((video) => getRankedChildVideos(video, userSettings))
      .map(([topRanked]) => RESOURCE_VIDEO_HASHMAP[topRanked?.id])
      .filter((resource) => resource !== undefined);
  }
}
