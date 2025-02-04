import { Component, Input } from '@angular/core';

import { IResourceFile } from '../../schemas';

@Component({
  selector: 'resource-item-video',
  template: `
    @if(resource.title){
    <h2>{{ resource.title | translate }}</h2>
    }
    <picsa-video-player [source]="fileURI" #videoPlayer [thumbnail]="resource.cover?.image" [id]="resource.id">
    </picsa-video-player>
    <p *ngIf="resource.description">{{ resource.description | translate }}</p>
    <mat-form-field style="width: 80%; margin:3px 0 0 3px" class="no-hint" data-tour-id="resource-item-video">
      <mat-label>{{ 'Language' | translate }}</mat-label>
      <mat-select [(value)]="resource.language">
        <mat-option *ngFor="let option of resource.languages" [value]="option">{{ option }}</mat-option>
      </mat-select>
    </mat-form-field>
  `,
  standalone: false,
})
export class ResourceItemVideoComponent {
  public videoSource: string;

  @Input() fileURI: string;

  @Input() resource: IResourceFile;
}
