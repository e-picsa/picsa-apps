import { Component, Input } from '@angular/core';

import { IResourceVideo } from '../../models';
import { ResourceItemComponent } from './resource-item.component';
import { FileItemHandler } from './templates/file';

@Component({
  selector: 'resource-item-video',
  template: `
    <div>Video</div>
    <picsa-video-player [url]="resource.url" #videoPlayer (click)="videoPlayer.playVideo()"></picsa-video-player>
  `,
})
export class ResourceItemVideoComponent {
  @Input() resource: IResourceVideo;
}

export class VideoItemHandler extends FileItemHandler {
  constructor(component: ResourceItemComponent) {
    super(component);
  }

  public override handleDownloadComplete(): void {
    this.component.actionButton = undefined;
    // this.resource.url = this.component.store.getFileLocalLink(this.resource)
    // TODO - prompt auto open
  }
  public override handleResourceOpen(): void {
    //
  }
  public override handleInit(): void {
    if (this.resource._isDownloaded) {
      this.component.actionButton = undefined;
      // TODO - get fully qualified storage URI to play from
      // Possibly using convertToLocalUrl
    } else {
      this.component.actionButton = {
        icon: 'file_download',
      };
    }
  }
}
