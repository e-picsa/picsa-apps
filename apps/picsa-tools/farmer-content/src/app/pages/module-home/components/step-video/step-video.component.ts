import { ChangeDetectionStrategy, Component, computed, inject, input, viewChild, viewChildren } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDivider } from '@angular/material/divider';
import { MatIcon } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { ConfigurationService } from '@picsa/configuration/src';
import { IPicsaVideoData } from '@picsa/data/resources';
import { PicsaTranslateModule } from '@picsa/i18n';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { ResourcesToolService } from '@picsa/resources/services/resources-tool.service';

import { FarmerStepVideoPlayerComponent } from './player/step-video-player';
import { getRankedChildVideos } from './step-video.utils';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'farmer-step-video',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIcon,
    MatListModule,
    MatDivider,
    FarmerStepVideoPlayerComponent,
    PicsaTranslateModule,
  ],
  templateUrl: './step-video.component.html',
  styleUrl: './step-video.component.scss',
})
export class FarmerStepVideoComponent {
  private configurationService = inject(ConfigurationService);
  private resourcesToolService = inject(ResourcesToolService);

  public videos = input.required<IPicsaVideoData[]>();
  public stepTitle = input<string>();

  public singlePlayer = viewChild<FarmerStepVideoPlayerComponent>('singlePlayer');
  public playlistPlayers = viewChildren<FarmerStepVideoPlayerComponent>('player');

  /**
   * Videos contain multiple child videos. Sort by most relevant to user
   * and filter out videos with no relevant child video resources
   * */
  public videosWithRankedChildren = computed(() => {
    // HACK - when identifying video to show user cannot rely solely on language_code as
    // that populates 'global_en' when different country used (should be zm_en)
    // So instead use country_code specified and language part of localeCode
    const userSettings = this.configurationService.userSettings();
    const userCountry = userSettings?.country_code || 'global';
    const languageCode = userSettings?.language_code || 'global_en';
    const [, userLanguage = 'en'] = languageCode.split('_');

    return this.videos()
      .map((video) => ({ ...video, children: getRankedChildVideos(video, userCountry, userLanguage) }))
      .filter((video) => video.children.length > 0);
  });

  public viewMode = computed<'single' | 'playlist'>(() => (this.videos().length > 1 ? 'playlist' : 'single'));

  public isShareDisabled = computed(() => !this.singlePlayer()?.isDownloaded());

  public async shareActiveVideo(event?: Event) {
    event?.stopPropagation();
    if (this.isShareDisabled()) return;
    await this.singlePlayer()?.shareVideo();
  }

  public async sharePlaylistItem(event: Event, player: FarmerStepVideoPlayerComponent) {
    event.stopPropagation();
    if (!player.isDownloaded()) return;
    await player.shareVideo();
  }
}
