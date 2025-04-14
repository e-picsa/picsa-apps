import { Component, Input } from '@angular/core';

import { IResourceFile } from '../../schemas';

@Component({
  selector: 'resource-item-video',
  template: `
    @if(resource.title){
    <h2>{{ resource.title | translate }}</h2>
    }
    <picsa-video-player
      [source]="fileURI"
      #videoPlayer
      [thumbnail]="resource.cover?.image"
      [onlineVideoUrl]="onlineVideoUrl"
      [id]="resource.id"
    >
    </picsa-video-player>
    <p *ngIf="resource.description">{{ resource.description | translate }}</p>
  `,
  standalone: false,
})
export class ResourceItemVideoComponent {
  public videoSource: string;

  @Input() fileURI: string;

  @Input() resource: IResourceFile;

  @Input() onlineVideoUrl: string;
}
