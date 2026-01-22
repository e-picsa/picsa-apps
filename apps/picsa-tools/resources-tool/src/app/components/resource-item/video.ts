import { Component, Input } from '@angular/core';
import { PicsaTranslateModule } from '@picsa/i18n';
import { PicsaVideoPlayerModule } from '@picsa/shared/features';

import { IResourceFile } from '../../schemas';

@Component({
  selector: 'resource-item-video',
  template: `
    @if (resource.title) {
      <h2>{{ resource.title | translate }}</h2>
    }
    <picsa-video-player
      [source]="fileURI"
      #videoPlayer
      [thumbnail]="resource.cover?.image"
      [onlineVideoUrl]="resource.url"
      [id]="resource.id"
    >
    </picsa-video-player>
    @if (resource.description) {
      <p>{{ resource.description | translate }}</p>
    }
  `,
  imports: [PicsaVideoPlayerModule, PicsaTranslateModule],
})
export class ResourceItemVideoComponent {
  public videoSource: string;

  @Input() fileURI: string | null;

  @Input() resource: IResourceFile;
}
