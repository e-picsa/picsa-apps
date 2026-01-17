import { Component, computed, inject, input } from '@angular/core';
import { MatDivider } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { ConfigurationService } from '@picsa/configuration/src';
import { IPicsaVideo, IPicsaVideoData } from '@picsa/data/resources';
import { PicsaVideoPlayerModule } from '@picsa/shared/features';

import { FarmerStepVideoPlayerComponent } from './player/step-video-player';

@Component({
  selector: 'farmer-step-video',
  imports: [MatListModule, MatDivider, PicsaVideoPlayerModule, FarmerStepVideoPlayerComponent],
  templateUrl: './step-video.component.html',
  styleUrl: './step-video.component.scss',
})
export class FarmerStepVideoComponent {
  private configurationService = inject(ConfigurationService);

  public videos = input.required<IPicsaVideoData[]>();

  /**
   * Videos contain multiple child videos. Sort by most relevant to user
   * and filter out videos with no relevant child video resources
   * */
  public videosWithRankedChildren = computed(() => {
    // HACK - when identifying video to show user cannot rely solely on language_code as
    // that populates 'global_en' when different country used (should be zm_en)
    // So instead use country_code specified and language part of localeCode
    const { country_code: userCountry, language_code } = this.configurationService.userSettings();
    const [_, userLanguage] = language_code.split('_');

    return this.videos()
      .map((video) => ({ ...video, children: getRankedChildVideos(video, userCountry, userLanguage) }))
      .filter((video) => video.children.length > 0);
  });

  public viewMode = computed<'single' | 'playlist'>(() => (this.videos().length > 1 ? 'playlist' : 'single'));
}

/**
 * Rank available child video formats in order by user language settings
 * Returns undefined if no child video formats found that match either country or global language settings
 */
function getRankedChildVideos(video: IPicsaVideoData, userCountry: string, userLanguage: string) {
  return video.children
    .map((v) => ({ ...v, _rank: getVideoRank(userCountry, userLanguage, v) }))
    .filter(({ _rank }) => _rank > 0)
    .sort((a, b) => a._rank - b._rank);
}

function getVideoRank(userCountry: string, userLanguage: string, video: IPicsaVideo) {
  const [audio, subtitle] = video.locale_codes;
  if (!audio) {
    console.warn(video);
    console.error(`[Step Video] - Locale Code missing`);
    return -1;
  }
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
  // 7 - return all videos for country
  if (audioCountry === userCountry) return 7;
  return -1;
}
