import { Component, Input, OnInit } from '@angular/core';
import { RxDocument } from 'rxdb';

import { IResourceVideo } from '../../../models';
import { IResourceFile } from '../../../schemas';
import { ResourcesToolService } from '../../../services/resources-tool.service';

@Component({
  selector: 'resource-item-video',
  template: `
    <h2>{{ resource.title | translate }}</h2>
    <div style="position:relative">
      <picsa-video-player [source]="videoData" #videoPlayer [thumbnail]="resource.image"> </picsa-video-player>
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
  public videoData: Blob;

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
    if (!this.videoData) {
      const dbAttachment = await this.service.getFileAttachment(this.dbDoc);
      if (dbAttachment) {
        this.videoData = dbAttachment;
        this.showDownloadOverlay = false;
      } else {
        this.showDownloadOverlay = true;
      }
    }
  }
}
