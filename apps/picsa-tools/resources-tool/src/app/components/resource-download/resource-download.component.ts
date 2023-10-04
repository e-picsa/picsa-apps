import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { FileService } from '@picsa/shared/services/core/file.service';
import { RxAttachment, RxDocument } from 'rxdb';
import { Subject, Subscription, takeUntil } from 'rxjs';

import { IResourceFile } from '../../schemas';
import { ResourcesToolService } from '../../services/resources-tool.service';

type IDownloadStatus = 'ready' | 'pending' | 'complete' | 'error';

@Component({
  selector: 'resource-download',
  templateUrl: './resource-download.component.html',
  styleUrls: ['./resource-download.component.scss'],
})
export class ResourceDownloadComponent implements OnDestroy {
  public downloadStatus: IDownloadStatus;
  public downloadProgress = 0;
  public attachment?: RxAttachment<IResourceFile>;

  private _dbDoc: RxDocument<IResourceFile>;
  private download$?: Subscription;
  private componentDestroyed$ = new Subject();

  @Input() styleVariant: 'primary' | 'white' = 'primary';

  @Input() size = 48;

  @Input() set dbDoc(dbDoc: RxDocument<IResourceFile>) {
    this._dbDoc = dbDoc;
    if (dbDoc) {
      this.subscribeToAttachmentChanges(dbDoc);
    }
  }

  @Input() hideOnComplete = false;

  /** Emit downloaded file updates */
  @Output() attachmentChange = new EventEmitter<RxAttachment<IResourceFile> | undefined>();

  constructor(private service: ResourcesToolService, private fileService: FileService) {}

  public get sizePx() {
    return `${this.size}px`;
  }

  public get resource() {
    return this._dbDoc._data;
  }

  private subscribeToAttachmentChanges(dbDoc: RxDocument<IResourceFile>) {
    // subscribe to doc attachment changes to confirm whether downloaded
    dbDoc.allAttachments$.pipe(takeUntil(this.componentDestroyed$)).subscribe((attachments) => {
      const attachment = attachments.find((a) => a.id === this.resource.filename);
      // TODO - check if update available
      this.downloadStatus = attachment ? 'complete' : 'ready';
      this.attachment = attachment;
      this.attachmentChange.next(attachment);
    });
  }

  ngOnDestroy() {
    this.componentDestroyed$.next(true);
    this.componentDestroyed$.complete();
  }

  public downloadResource() {
    this.downloadStatus = 'pending';
    this.downloadProgress = 0;
    let downloadData: Blob;
    this.download$ = this.fileService.downloadFile(this.resource.url, 'blob').subscribe({
      next: ({ progress, data }) => {
        this.downloadProgress = progress;
        // NOTE - might be called multiple times before completing so avoid persisting data here
        if (progress === 100) {
          downloadData = data as Blob;
        }
      },
      error: (error) => {
        this.downloadStatus = 'error';
        throw error;
      },
      complete: async () => {
        await this.persistDownload(downloadData);
      },
    });
  }

  private async persistDownload(data: Blob) {
    await this.service.putFileAttachment(this._dbDoc, data);
  }

  /** Cancel ongoing download */
  public cancelDownload() {
    this.downloadStatus = 'ready';
    if (this.download$) {
      this.download$.unsubscribe();
      this.download$ = undefined;
      this.downloadProgress = 0;
    }
  }
}
