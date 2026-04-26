import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PicsaTranslateModule } from '@picsa/i18n';
import { PicsaVideoPlayerComponent } from '@picsa/shared/features/video-player';

import { IResourceFile } from '../../schemas';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'resource-item-video',
  template: `
    @if (resource().title; as title) {
      <h2>{{ title | translate }}</h2>
    }
    <picsa-video-player
      [source]="fileURI()"
      #videoPlayer
      [thumbnail]="resource().cover?.image"
      [onlineVideoUrl]="resource().url"
      [id]="resource().id"
    >
    </picsa-video-player>
    @if (resource().description; as description) {
      <p>{{ description | translate }}</p>
    }
  `,
  imports: [PicsaVideoPlayerComponent, PicsaTranslateModule],
})
export class ResourceItemVideoComponent {
  fileURI = input<string | null>(null);

  resource = input.required<IResourceFile>();
}
