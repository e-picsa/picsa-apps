import { Subscription } from 'rxjs';

import { IResourceFile } from '../../../models';
import { ResourceItemComponent } from '../resource-item.component';

/**
 * File Item is the base for any downloadable asset (e.g. pdf, video) and can be extended as required
 * Default behaviour will be to open app in native application (or new tab in case of web)
 * */
export class FileItemHandler {
  private download$?: Subscription;

  constructor(public component: ResourceItemComponent) {
    component.handleResourceClick = (e) => this.handleClick(e);
    this.resource._isDownloaded = this.component.store.isFileDownloaded(this.resource);

    this.handleInit();
  }

  public get resource() {
    return this.component.resource as IResourceFile;
  }

  public handleInit() {
    this.component.actionButton = {
      icon: this.resource._isDownloaded ? 'open_in_new' : 'file_download',
    }; // TODO show file download size alongside download icon
  }

  public handleDownloadComplete() {
    this.component.actionButton = { icon: 'open_in_new' };
    if (this.component.openAfterDownload) {
      this.component.store.openFileResource(this.resource);
    }
  }
  public handleResourceOpen() {
    this.component.store.openFileResource(this.resource);
  }

  private async handleClick(e: Event) {
    e.stopPropagation();
    if (this.download$) {
      return this.cancelDownload();
    }
    if (!this.resource._isDownloaded) {
      this.handleResourceDownload();
    } else {
      this.handleResourceOpen();
    }
  }
  /** Cancel ongoing download */
  private cancelDownload() {
    if (this.download$) {
      this.download$.unsubscribe();
      this.download$ = undefined;
      this.component.downloadProgress = undefined;
      this.component.actionButton = { icon: 'file_download' };
    }
  }

  private handleResourceDownload() {
    this.component.actionButton = undefined;
    this.component.downloadProgress = 0;
    this.component.store.downloadResource(this.resource).subscribe({
      next: ({ progress, subscription }) => {
        this.download$ = subscription;
        this.component.downloadProgress = progress;
      },
      error: (err) => {
        console.error(err);
        this.component.downloadProgress = undefined;
        this.component.actionButton = { icon: 'file_download' };
        // TODO - show error message
        throw err;
      },
      complete: () => {
        this.component.downloadProgress = undefined;
        this.component.downloadComplete.emit(this.resource);
        this.resource._isDownloaded = true;
        this.handleDownloadComplete();
      },
    });
  }
}
