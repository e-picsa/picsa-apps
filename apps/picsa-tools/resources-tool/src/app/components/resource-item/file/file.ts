import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { _wait } from '@picsa/utils';
import { RxAttachment, RxDocument } from 'rxdb';

import { IResourceFile, IResourceLink } from '../../../schemas';
import { ResourcesToolService } from '../../../services/resources-tool.service';

@Component({
  selector: 'resource-item-file',
  templateUrl: 'file.html',
  styleUrls: ['file.scss'],
})
export class ResourceItemFileComponent implements OnInit, OnDestroy {
  @Input() resource: IResourceFile;

  /** Emit downloaded file updates */
  @Output() attachmentChange = new EventEmitter<{ attachment: RxAttachment<IResourceFile> | undefined; uri: string }>();

  public dbDoc: RxDocument<IResourceFile>;
  public attachment: RxAttachment<IResourceFile> | undefined;
  public fileURI: string;

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
    this.service.revokeFileAttachmentURIs([this.dbDoc.filename]);
  }

  /** When attachment state changed attempt to get URI to downloaded file resource */
  public async handleAttachmentChange(attachment: RxAttachment<IResourceFile> | undefined) {
    if (attachment) {
      // use neglible timeout due to avoid afterViewCheck change detection
      await _wait(0);
      this.attachment = attachment;
      const uri = await this.service.getFileAttachmentURI(this.dbDoc);
      if (uri) {
        this.fileURI = uri;
      }
    }
    this.attachmentChange.next({ attachment, uri: this.fileURI });
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
    this.service.openFileResource(this.fileURI, this.attachment!.type);
  }
}
