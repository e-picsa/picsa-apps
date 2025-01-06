import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { ConfigurationService } from '@picsa/configuration/src';
import { IPicsaVideo, IPicsaVideoData } from '@picsa/data/resources';
import { RESOURCE_VIDEO_HASHMAP } from '@picsa/data/resources';
import { ResourcesComponentsModule } from '@picsa/resources/src/app/components/components.module';

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
  imports: [CommonModule, ResourcesComponentsModule],
  templateUrl: './step-video.component.html',
  styleUrl: './step-video.component.scss',
})
export class FarmerStepVideoComponent {
  videoData = input.required<IPicsaVideoData>();

  videoResource = computed(() => {
    // HACK - when identifying video to show user cannot rely solely on language_code as
    // that populates 'global_en' when different country used (should be zm_en)
    // So instead use country_code specified and language part of localeCode
    const { country_code: userCountry, language_code } = this.configurationService.userSettings();
    const [_, userLanguage] = language_code.split('_');
    const availableVideos = this.videoData().children;
    // HACK - select best video recommendation. TODO - show toggle options in future
    const [video] = this.filterAvailableVideos(userCountry, userLanguage, availableVideos);
    if (video) {
      // HACK - lookup resource entry which should be given by same id
      const resource = RESOURCE_VIDEO_HASHMAP[video.id];
      return resource;
    }
    return undefined;
  });

  constructor(private configurationService: ConfigurationService) {}

  private filterAvailableVideos(userCountry: string, userLanguage: string, videos: IPicsaVideo[] = []) {
    const rankedVideos = videos
      .map((v) => ({ ...v, _rank: getVideoRank(userCountry, userLanguage, v) }))
      .filter(({ _rank }) => _rank > 0)
      .sort((a, b) => a._rank - b._rank);

    // default fallback to first video entry
    return rankedVideos;
  }
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
