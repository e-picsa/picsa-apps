import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit, viewChild } from '@angular/core';
import { _wait } from '@picsa/utils';
import { RxDocument } from 'rxdb';

import { IResourceFile, IResourceLink } from '../../../schemas';
import { ResourcesToolService } from '../../../services/resources-tool.service';
import { ResourceDownloadComponent } from '../../resource-download/resource-download.component';
import { ResourceShareComponent } from '../../resource-share/resource-share.component';
import { ResourceItemLinkComponent } from '../link/link';
import { ResourceItemVideoComponent } from '../video';

@Component({
  selector: 'resource-item-file',
  templateUrl: 'file.html',
  styleUrls: ['file.scss'],
  imports: [ResourceShareComponent, ResourceDownloadComponent, ResourceItemLinkComponent, ResourceItemVideoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceItemFileComponent implements OnInit, OnDestroy {
  @Input() resource: IResourceFile;

  public dbDoc: RxDocument<IResourceFile>;

  private downloader = viewChild.required(ResourceDownloadComponent);

  constructor(private service: ResourcesToolService) {}

  async ngOnInit() {
    await this.service.ready();

    const dbDoc = await this.service.dbFiles.findOne(this.resource.id).exec();
    if (dbDoc) {
      this.dbDoc = dbDoc;
    }
  }

  async ngOnDestroy() {
    // ensure any created file attachment uris disposed of
    if (this.dbDoc) {
      this.service.revokeFileAttachmentURIs([this.dbDoc.filename]);
    }
  }

  /** Display file in resource link format */
  public get resourceLink() {
    const link: IResourceLink = {
      ...this.resource,
      subtype: 'internal',
      type: 'link',
    };
    return link;
  }

  /** Generic file opener */
  public async handleFileLinkClick(e: Event) {
    const fileURI = this.downloader().fileURI();
    if (fileURI) {
      this.service.openFileResource(fileURI, this.dbDoc!.type, this.resource.id);
    }
  }
}
