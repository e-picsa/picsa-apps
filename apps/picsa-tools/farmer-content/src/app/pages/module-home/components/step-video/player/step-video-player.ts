import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { ILocaleDataEntry, LOCALES_DATA_HASHMAP } from '@picsa/data';
import { IPicsaVideoData, RESOURCE_VIDEO_HASHMAP } from '@picsa/data/resources';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { ResourceDownloadComponent } from '@picsa/resources/components';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { ResourcesToolService } from '@picsa/resources/services/resources-tool.service';
import { PicsaVideoPlayerComponent } from '@picsa/shared/features/video-player';

/**
 * Temporary component to help migrate between legacy flat resource format
 * to newer content which contains nested videos and allows auto-select
 * video based on user's locale preference
 *
 * Includes additonal language select option
 *
 * TODO - ideally all video resources should be refactored in a similar way
 * and support for child resources integrated into main resource components
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'farmer-step-video-player',
  templateUrl: 'step-video-player.html',
  styleUrl: 'step-video-player.scss',
  imports: [ResourceDownloadComponent, MatIcon, MatButtonModule, MatMenuModule, PicsaVideoPlayerComponent],
})
export class FarmerStepVideoPlayerComponent {
  private readonly resourcesToolService = inject(ResourcesToolService);

  public video = input.required<IPicsaVideoData>();
  public videoUri = signal<string | undefined>(undefined);
  public downloadStatus = signal<string | undefined>(undefined);

  public isDownloaded = computed(
    () => this.downloadStatus() === 'complete' || this.downloaderComponent()?.downloadStatus() === 'complete',
  );

  public videoLanguageOptions = computed(() =>
    this.video()
      .children.map(({ locale_codes }) => LOCALES_DATA_HASHMAP[locale_codes[0]])
      .filter(Boolean),
  );

  public videoLanguageSelected = signal<ILocaleDataEntry | undefined>(undefined);

  public videoResource = computed(() => {
    const languageSelected = this.videoLanguageSelected();
    if (languageSelected) {
      const targetVideo = this.video().children.find((v) => v.locale_codes[0] === languageSelected.id);
      if (targetVideo) {
        return RESOURCE_VIDEO_HASHMAP[targetVideo.id];
      }
    }
    return undefined;
  });

  constructor() {
    effect(() => {
      const [languageDefaultOption] = this.videoLanguageOptions();
      this.videoLanguageSelected.set(languageDefaultOption);
    });
    effect(() => {
      this.videoResource();
      this.downloadStatus.set(undefined);
    });
  }

  public async handleDlStatusChange(downloader: ResourceDownloadComponent) {
    const status = downloader.downloadStatus();
    this.downloadStatus.set(status);
    if (status === 'complete') {
      const uri = await downloader.uri(false);
      if (uri) {
        this.videoUri.set(uri);
      }
    } else {
      this.videoUri.set(undefined);
    }
  }

  public playerComponent = viewChild<PicsaVideoPlayerComponent>('videoPlayer');
  public downloaderComponent = viewChild<ResourceDownloadComponent>('dl');

  // Expose public click handler to allow programattic click from playlist
  public async handleItemClick(e: Event) {
    if ((e?.target as HTMLElement)?.closest('button')) {
      return;
    }
    const dlComponent = this.downloaderComponent();
    const videoPlayer = this.playerComponent();
    if (dlComponent?.downloadStatus() === 'ready') {
      dlComponent.download(e);
      return;
    }
    if (videoPlayer?.source()) {
      videoPlayer.playVideo();
    }
  }

  public async shareVideo() {
    if (!this.isDownloaded()) return;
    const resource = this.videoResource();
    if (!resource) return;
    await this.resourcesToolService.shareResource(resource);
  }
}
