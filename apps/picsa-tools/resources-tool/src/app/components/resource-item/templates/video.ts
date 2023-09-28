import { Component, Input, OnInit } from '@angular/core';
import { IAttachment } from '@picsa/shared/services/core/db_v2/schemas/attachments';
import { base64ToBlob } from '@picsa/utils';
import { RxDocument } from 'rxdb';

import { IResourceVideo } from '../../../models';
import { IResourceFile } from '../../../schemas';
import { ResourcesToolService } from '../../../services/resources-tool.service';

@Component({
  selector: 'resource-item-video',
  template: `
    <h2>{{ resource.title | translate }}</h2>
    <div style="position:relative">
      <picsa-video-player [source]="videoSource" #videoPlayer [thumbnail]="resource.image"> </picsa-video-player>
      <div class="download-overlay" [style.visibility]="showDownloadOverlay ? 'visible' : 'hidden'">
        <resource-download
          *ngIf="dbDoc"
          [dbDoc]="dbDoc"
          class="download-button"
          (downloadComplete)="loadVideo()"
        ></resource-download>
      </div>
    </div>

    <p *ngIf="resource.subtitle">{{ resource.subtitle | translate }}</p>
    <p *ngIf="resource.description">{{ resource.description | translate }}</p>
  `,
  styles: [
    `
      .download-overlay {
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
        z-index: 3;
        background: #fbfbfb91;
        max-width: 480px;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .download-button {
        display: flex;
        background: white;
        color: var(--color-primary);
        border-radius: 8px;
        width: 64px;
        height: 64px;
        align-items: center;
        justify-content: center;
      }
    `,
  ],
})
export class ResourceItemVideoComponent implements OnInit {
  @Input() resource: IResourceVideo;

  public dbDoc: RxDocument<IResourceFile>;
  public videoSource: Blob | string;

  public showDownloadOverlay = false;

  constructor(private service: ResourcesToolService) {}

  async ngOnInit() {
    await this.service.ready();
    const dbDoc = await this.service.dbFileCollection.findOne(this.resource._key).exec();
    if (dbDoc) {
      this.dbDoc = dbDoc;
      this.loadVideo();
    }
  }

  public async loadVideo() {
    // avoid duplicate calls on initial init as downloadComplete emits
    if (!this.videoSource) {
      const dbAttachment = await this.service.getFileAttachment(this.dbDoc);
      if (dbAttachment) {
        this.videoSource = await this.convertFileToVideoSource(dbAttachment._data);
        this.showDownloadOverlay = false;
      } else {
        this.showDownloadOverlay = true;
      }
    }
  }
  private async convertFileToVideoSource(attachment: IAttachment): Promise<Blob | string> {
    // on web convert base64 data to blob
    if (attachment.data) {
      return base64ToBlob(attachment.data, attachment.type);
    }
    // on native simply return file resource uri
    if (attachment.uri) {
      return attachment.uri;
    }
    return '';
  }
}
