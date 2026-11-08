import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnDestroy,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
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
  private service = inject(ResourcesToolService);

  readonly resource = input.required<IResourceFile>();

  public dbDoc = signal<RxDocument<IResourceFile> | null>(null);
  public fileUri = signal<string | null>(null);

  private downloader = viewChild(ResourceDownloadComponent);

  async ngOnInit() {
    await this.service.ready();

    const dbDoc = await this.service.dbFiles.findOne(this.resource().id).exec();
    this.dbDoc.set(dbDoc);
  }

  async ngOnDestroy() {
    const dbDoc = this.dbDoc();
    // ensure any created file attachment uris disposed of
    if (dbDoc) {
      this.service.revokeFileAttachmentURIs([dbDoc.filename]);
    }
  }

  /** Display file in resource link format with full file metadata preserved */
  readonly resourceLink = computed<any>(() => ({
    ...this.resource(),
    rawType: 'file',
    subtype: 'internal',
    type: 'link',
    fileSubtype: this.resource().subtype,
    size_kb: this.resource().size_kb,
    mimetype: this.resource().mimetype,
  }));

  /** Generic file opener or download trigger */
  public async handleFileLinkClick() {
    const uri = await this.downloader()?.uri();
    let doc = this.dbDoc();
    if (!doc) {
      await this.service.ready();
      doc = await this.service.dbFiles.findOne(this.resource().id).exec();
      if (doc) this.dbDoc.set(doc);
    }
    if (uri && doc) {
      this.service.openFileResource(uri, doc.type, this.resource().id);
    } else {
      this.downloader()?.download(new Event('click'));
    }
  }

  public handleActionClick(e: Event, status?: string) {
    if (status !== 'complete') {
      e.stopImmediatePropagation();
    }
  }

  public async handleDownloadStatusChange(dl: ResourceDownloadComponent) {
    if (dl.downloadStatus() === 'complete') {
      const uri = await dl.uri(false);
      if (uri) {
        this.fileUri.set(uri);
        return;
      }
    }
    this.fileUri.set(null);
  }
}
