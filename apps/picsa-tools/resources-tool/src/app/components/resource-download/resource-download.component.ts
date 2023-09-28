import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FileService } from '@picsa/shared/services/core/file.service';
import { RxAttachment, RxDocument } from 'rxdb';
import { Subject, Subscription, takeUntil } from 'rxjs';

import { IResourceFile } from '../../schemas';
import { ResourcesToolService } from '../../services/resources-tool.service';

@Component({
  selector: 'resource-download',
  templateUrl: './resource-download.component.html',
  styleUrls: ['./resource-download.component.scss'],
})
export class ResourceDownloadComponent implements OnInit, OnDestroy {
  public downloadStatus: 'ready' | 'pending' | 'complete' | 'error';
  public downloadProgress = 0;
  private download$?: Subscription;
  private componentDestroyed$ = new Subject();

  @Input() dbDoc: RxDocument<IResourceFile>;

  @Output() downloadComplete = new EventEmitter<RxAttachment<IResourceFile>>();

  constructor(private service: ResourcesToolService, private fileService: FileService) {}

  public get resource() {
    return this.dbDoc._data;
  }

  async ngOnInit() {
    // subscribe to doc attachment changes to confirm whether downloaded
    this.dbDoc.allAttachments$.pipe(takeUntil(this.componentDestroyed$)).subscribe((attachments) => {
      const attachment = attachments.find((a) => a.id === this.resource.filename);
      // TODO - check if update available
      if (attachment) {
        this.downloadStatus = 'complete';
        this.downloadComplete.next(attachment);
      } else {
        this.downloadStatus = 'ready';
      }
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
    await this.service.putFileAttachment(this.dbDoc, data);
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
