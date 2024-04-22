import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { FileService } from '@picsa/shared/services/core/file.service';
import { RxAttachment } from 'rxdb';
import { Subject, Subscription } from 'rxjs';

import { IResourceFile } from '../../schemas';

type IDownloadStatus = 'ready' | 'pending' | 'complete' | 'error';

@Component({
  selector: 'resource-download-multiple',
  templateUrl: './resource-download-multiple.component.html',
  styleUrl: './resource-download-multiple.component.scss',
})
export class ResourceDownloadMultipleComponent implements OnDestroy {
  private _resources: IResourceFile[];
  public attachment?: RxAttachment<IResourceFile>;

  downloadStatus: IDownloadStatus = 'ready';
  downloadProgress = 0;
  totalSize = 0;

  private componentDestroyed$ = new Subject();
  private downloadSubscription?: Subscription;

  @Output() downloadCompleted = new EventEmitter<void>();

  @Input() styleVariant: 'primary' | 'white' = 'primary';

  @Input() size = 48;

  @Input() hideOnComplete = false;

  @Input() set resources(resources: IResourceFile[]) {
    this._resources = resources;
    this.calculateTotalSize(resources);
  }

  constructor(private fileService: FileService) {}

  ngOnDestroy(): void {
    this.componentDestroyed$.next(true);
    this.componentDestroyed$.complete();
  }

  public calculateTotalSize(resources: IResourceFile[]): void {
    this.totalSize = resources.reduce((acc, doc) => acc + doc.size_kb, 0);
  }

  public downloadAllResources(): void {
    this.downloadStatus = 'pending';
    this.downloadProgress = 0;

    const downloadQueue = [...this._resources];
    const downloadNext = () => {
      if (downloadQueue.length === 0) {
        this.downloadStatus = 'complete';
        this.downloadCompleted.emit();
        return;
      }

      const resource = downloadQueue.shift();
      if (resource) {
        this.fileService.downloadFile(resource.url, 'blob').subscribe({
          next: ({ progress }) => {
            this.downloadProgress = progress;
          },
          error: (error) => {
            this.downloadStatus = 'error';
            console.error(error);
          },
          complete: () => {
            downloadNext();
          },
        });
      }
    };

    downloadNext();
  }

  public cancelDownload(): void {
    if (this.downloadSubscription) {
      this.downloadSubscription.unsubscribe();
      this.downloadSubscription = undefined;
    }
    this.downloadStatus = 'ready';
    this.downloadProgress = 0;
  }
}
