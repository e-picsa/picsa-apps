import { Component, Input, OnDestroy, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PicsaTranslateModule } from '@picsa/shared/modules';
import { SizeMBPipe } from '@picsa/shared/pipes/sizeMB';
import { RxDocument } from 'rxdb';
import { lastValueFrom, Subject, Subscription } from 'rxjs';

import { IResourceFile } from '../../schemas';
import { IDownloadStatus, ResourcesToolService } from '../../services/resources-tool.service';

@Component({
  selector: 'resource-download-multiple',
  templateUrl: './resource-download-multiple.component.html',
  styleUrl: './resource-download-multiple.component.scss',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    SizeMBPipe,
    PicsaTranslateModule,
    PicsaTranslateModule,
  ],
})
export class ResourceDownloadMultipleComponent implements OnDestroy {
  private _resources: IResourceFile[];
  private pendingDocs: RxDocument<IResourceFile>[] = [];

  downloadStatus = signal<IDownloadStatus>('pending');
  downloadProgress = 0;
  downloadCount = 0;
  totalSize = 0;
  totalCount = 0;

  private componentDestroyed$ = new Subject();
  private downloadSubscription?: Subscription;

  @Input() set resources(resources: IResourceFile[]) {
    this._resources = resources;
    this.totalCount = resources.length;
    this.getPendingDownloads();
  }

  constructor(private service: ResourcesToolService) {}

  ngOnDestroy(): void {
    this.componentDestroyed$.next(true);
    this.componentDestroyed$.complete();
  }

  /**
   * Iterate over list of input resources, checking which already have attachments downloaded
   * and generating summary of pending downloads with total size
   */
  public async getPendingDownloads() {
    let totalSize = 0;
    let totalCount = 0;
    let downloadCount = 0;
    const pendingDocs: RxDocument<IResourceFile>[] = [];
    for (const resource of this._resources) {
      const dbDoc = await this.service.dbFiles.findOne(resource.id).exec();
      if (dbDoc) {
        totalCount++;
        // check
        const attachment = dbDoc.getAttachment(dbDoc.filename);
        if (attachment) {
          downloadCount++;
        } else {
          pendingDocs.push(dbDoc);
          totalSize += dbDoc.size_kb;
        }
      }
    }
    this.totalCount = totalCount;
    this.totalSize = totalSize;
    this.downloadCount = downloadCount;
    this.pendingDocs = pendingDocs;
    this.downloadStatus.set(totalSize > 0 ? 'ready' : 'complete');
  }

  public async downloadAllResources() {
    // recalc sizes to ensure pending docs correct (in case of single file download)
    await this.getPendingDownloads();

    // handle all downloads
    this.downloadStatus.set('pending');

    for (const doc of this.pendingDocs) {
      await this.downloadNextResource(doc);
    }
    // refresh UI
    await this.getPendingDownloads();
    this.downloadStatus.set('complete');
    return;
  }

  /**
   * Trigger next download
   * Updates download progress and waits until download complete
   */
  private async downloadNextResource(doc: RxDocument<IResourceFile>) {
    // Only download if pending status given (will be set to 'ready' if cancelled)
    if (this.downloadStatus() === 'pending') {
      const { download$, progress$, status$ } = this.service.triggerResourceDownload(doc);
      this.downloadSubscription = download$;
      progress$.subscribe((progress) => (this.downloadProgress = progress));
      const endStatus = await lastValueFrom(status$);
      if (endStatus === 'complete') {
        this.downloadCount++;
      }
    }
  }
  public async cancelDownload() {
    // cancel active download
    if (this.downloadSubscription) {
      this.downloadSubscription.unsubscribe();
      this.downloadSubscription = undefined;
    }
    // change the download status which will prevent nextResourceDownload trigger
    this.downloadStatus.set('ready');
    this.downloadProgress = 0;
    await this.getPendingDownloads();
  }
}
