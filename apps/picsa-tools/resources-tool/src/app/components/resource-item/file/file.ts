import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { _wait } from '@picsa/utils';
import { RxAttachment, RxDocument } from 'rxdb';

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
})
export class ResourceItemFileComponent implements OnInit, OnDestroy {
  @Input() resource: IResourceFile;

  /** Emit downloaded file updates */
  @Output() attachmentChange = new EventEmitter<{ attachment: RxAttachment<IResourceFile> | undefined; uri: string }>();

  public dbDoc: RxDocument<IResourceFile>;
  public attachment: RxAttachment<IResourceFile> | undefined;
  public fileURI: string;
  public onlineVideoUrl: string;
  constructor(private service: ResourcesToolService, private cdr: ChangeDetectorRef) {}

  async ngOnInit() {
    await this.service.ready();

    const dbDoc = await this.service.dbFiles.findOne(this.resource.id).exec();
    if (dbDoc) {
      this.dbDoc = dbDoc;
      //use online video thumbnail url
      this.onlineVideoUrl = dbDoc._data.url;
    }
  }

  async ngOnDestroy() {
    // ensure any created file attachment uris disposed of
    if (this.dbDoc) {
      this.service.revokeFileAttachmentURIs([this.dbDoc.filename]);
    }
  }

  /** When attachment state changed attempt to get URI to downloaded file resource */
  public async handleAttachmentChange(attachment: RxAttachment<IResourceFile> | undefined) {
    if (attachment) {
      // use neglible timeout due to avoid afterViewCheck change detection
      await _wait(0);
      this.attachment = attachment;
      // avoiding converting to web url as will usually be opened natively (e.g. external open, native video)
      const convertNativeSrc = false;
      const uri = await this.service.getFileAttachmentURI(this.dbDoc, convertNativeSrc);
      if (uri) {
        this.fileURI = uri;
      }
    }
    this.attachmentChange.next({ attachment, uri: this.fileURI });
    this.cdr.markForCheck();
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
    this.service.openFileResource(this.fileURI, this.attachment!.type, this.resource.id);
  }
}
