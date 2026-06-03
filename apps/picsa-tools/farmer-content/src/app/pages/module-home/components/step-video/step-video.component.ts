import { CommonModule } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatDivider } from '@angular/material/divider';
import { MatIcon } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { ConfigurationService, IUserSettings } from '@picsa/configuration/src';
import { IPicsaVideo, IPicsaVideoData } from '@picsa/data/resources';
import { RESOURCE_VIDEO_HASHMAP } from '@picsa/data/resources';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { ResourceDownloadComponent } from '@picsa/resources/components';
import { PicsaVideoPlayerModule } from '@picsa/shared/features';
import { VideoPlayerComponent } from '@picsa/shared/features/video-player/video-player.component';

import { StepVideoLanguageSelectComponent } from '../step-video-language-select/step-video-language-select.component';

/**
 * Temporary component to help migrate between legacy flat resource format
 * to newer content which contains nested videos and allows auto-select
 * video based on user's locale preference
 *
 * TODO - ideally all video resources should be refactored in a similar way
 * and support for child resources integrated into main resource components
 */
@Component({
  selector: 'farmer-step-video',
  imports: [
    CommonModule,
    MatIcon,
    MatListModule,
    MatDivider,
    ResourceDownloadComponent,
    PicsaVideoPlayerModule,
    StepVideoLanguageSelectComponent,
  ],
  templateUrl: './step-video.component.html',
  styleUrl: './step-video.component.scss',
})
export class FarmerStepVideoComponent {
  /** */
  viewMode = input<'single' | 'playlist'>('single');

  video = input.required<IPicsaVideoData>();

  public rankedVideos = computed(() => this.rankVideos(this.video()));

  public selectedVideoResource = computed(() => {
    const [topRanked] = this.rankedVideos();
    if (topRanked) {
      return RESOURCE_VIDEO_HASHMAP[topRanked.id];
    }
    return undefined;
  });

  /** */
  public videoVariantOptions = computed(() => {
    return this.rankedVideos().map((v) => ({ label: v.locale_codes.join(','), value: v.id }));
  });

  constructor(
    public dialog: MatDialog,
    private configurationService: ConfigurationService,
  ) {}

  public handleItemClick(dlComponent: ResourceDownloadComponent, videoPlayer: VideoPlayerComponent) {
    if (dlComponent.downloadStatus() === 'ready') {
      return dlComponent.downloadResource();
    }
    if (videoPlayer.source()) {
      videoPlayer.playVideo();
    }
  }

  private rankVideos(video: IPicsaVideoData) {
    const userSettings = this.configurationService.userSettings();
    const ranked = getRankedChildVideos(video, userSettings);
    // Ensure only returning child videos that have mapped resource data
    // TODO - refactor to use video format and not resource format
    return ranked.filter((v) => Boolean(v) && RESOURCE_VIDEO_HASHMAP[v.id]);
  }
}

/**
 * Rank available child video formats in order by user language settings
 * Returns undefined if no child video formats found that match either country or global language settings
 */
function getRankedChildVideos(video: IPicsaVideoData, userSettings: IUserSettings) {
  // HACK - when identifying video to show user cannot rely solely on language_code as
  // that populates 'global_en' when different country used (should be zm_en)
  // So instead use country_code specified and language part of localeCode
  const { country_code: userCountry, language_code } = userSettings;
  const [_, userLanguage] = language_code.split('_');

  return video.children
    .map((v) => ({ ...v, _rank: getVideoRank(userCountry, userLanguage, v) }))
    .sort((a, b) => a._rank - b._rank);
}

function getVideoRank(userCountry: string, userLanguage: string, video: IPicsaVideo) {
  const [audio, subtitle] = video.locale_codes;
  const [audioCountry, audioLanguage] = audio.split('_');
  const subtitleLanguage = subtitle?.split('_')[1];

  // 1 - same country and audio
  if (audioCountry === userCountry && audioLanguage === userLanguage) return 1;
  // 2 - same country and user language subtitle
  if (audioCountry === userCountry && subtitleLanguage === userLanguage) return 2;
  // 3 - global video with user language audio
  if (audioCountry === 'global' && audioLanguage === userLanguage) return 3;
  // 4 - global video with user language subtitle
  if (audioCountry === 'global' && subtitleLanguage === userLanguage) return 4;
  // 5 - return all videos for global users
  if (userCountry === 'global') return 5;
  // 6 - return global fallback
  if (audioCountry === 'global' && audioLanguage === 'en') return 6;
  return -1;
}
