import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { IPicsaVideo } from '@picsa/data/resources';

@Component({
  selector: 'farmer-step-video-language-select',
  imports: [MatIcon],
  templateUrl: './step-video-language-select.component.html',
  styleUrl: './step-video-language-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepVideoLanguageSelectComponent {
  videoOptions = input.required<IPicsaVideo[]>();

  public options = computed(() => {
    console.log('language select', this.videoOptions());
    return this.videoOptions().map((video) => {
      const [audio_locale, subtitle_locale] = video.locale_codes;
      return { audio: 'test', subtitle: 'test', video, id: video.id };
    });
  });

  videoSelected = output<IPicsaVideo>();
}
