import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { ConfigurationService } from '@picsa/configuration/src';
import { ILocaleCode } from '@picsa/data';
import { IPicsaVideo, IPicsaVideoData } from '@picsa/data/resources';
import { PICSA_FARMER_VIDEO_RESOURCES_HASHMAP } from '@picsa/data/resources';
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
  standalone: true,
  imports: [CommonModule, ResourcesComponentsModule],
  templateUrl: './step-video.component.html',
  styleUrl: './step-video.component.scss',
})
export class FarmerStepVideoComponent {
  videoData = input.required<IPicsaVideoData>();

  videoResource = computed(() => {
    const { language_code } = this.configurationService.userSettings();
    const availableVideos = this.videoData().children;
    const video = this.selectDefaultVideo(language_code, availableVideos);
    // HACK - lookup resource entry which should be given by same id
    const resource = PICSA_FARMER_VIDEO_RESOURCES_HASHMAP[video.id];
    return resource;
  });

  constructor(private configurationService: ConfigurationService) {}

  private selectDefaultVideo(locale_code: ILocaleCode, videos: IPicsaVideo[]) {
    // prioritise video in same locale
    const localeVideo = videos.find((v) => v.locale_codes.includes(locale_code));
    if (localeVideo) return localeVideo;

    // TODO - fallback video to same language different locale
    // TODO - track preference for video size (when supported in future, currently all 360p)

    // default fallback to first video entry
    return videos[0];
  }
}
