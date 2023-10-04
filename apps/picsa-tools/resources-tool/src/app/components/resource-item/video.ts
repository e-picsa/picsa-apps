import { Component, Input } from '@angular/core';

import { IResourceFile } from '../../schemas';

@Component({
  selector: 'resource-item-video',
  template: `
    <h2>{{ resource.title | translate }}</h2>
    <picsa-video-player [source]="fileURI" #videoPlayer [thumbnail]="resource.cover?.image"> </picsa-video-player>
    <p *ngIf="resource.description">{{ resource.description | translate }}</p>
  `,
})
export class ResourceItemVideoComponent {
  public videoSource: string;

  @Input() fileURI: string;

  @Input() resource: IResourceFile;
}
