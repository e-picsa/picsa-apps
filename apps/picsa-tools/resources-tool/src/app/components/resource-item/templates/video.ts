import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { RxDocument } from 'rxdb';

import { IResourceFile } from '../../../schemas';
import { ResourcesToolService } from '../../../services/resources-tool.service';

@Component({
  selector: 'resource-item-video',
  template: `
    <h2>{{ resource.title | translate }}</h2>
    <div style="position:relative">
      <picsa-video-player [source]="videoSource" #videoPlayer [thumbnail]="resource.cover?.image"> </picsa-video-player>
      <div class="download-overlay" [style.visibility]="showDownloadOverlay ? 'visible' : 'hidden'">
        <resource-download
          *ngIf="dbDoc"
          [dbDoc]="dbDoc"
          class="download-button"
          (downloadComplete)="loadVideo()"
        ></resource-download>
      </div>
    </div>

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
export class ResourceItemVideoComponent implements OnInit, OnDestroy {
  @Input() resource: IResourceFile;

  public dbDoc: RxDocument<IResourceFile>;
  public videoSource?: string;

  public showDownloadOverlay = false;

  constructor(private service: ResourcesToolService) {}

  async ngOnInit() {
    await this.service.ready();
    const dbDoc = await this.service.dbFiles.findOne(this.resource.id).exec();
    if (dbDoc) {
      this.dbDoc = dbDoc;
      this.loadVideo();
    }
  }

  async ngOnDestroy() {
    // ensure any created file attachment uris disposed of
    this.service.revokeFileAttachmentURIs([this.dbDoc.filename]);
  }

  public async loadVideo() {
    // avoid duplicate calls on initial init as downloadComplete emits
    if (!this.videoSource) {
      const videoSource = await this.service.getFileAttachmentURI(this.dbDoc);
      if (videoSource) {
        this.videoSource = videoSource;
        this.showDownloadOverlay = false;
      } else {
        this.showDownloadOverlay = true;
      }
    }
  }
}
