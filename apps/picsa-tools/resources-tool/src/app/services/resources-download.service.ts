import { inject, Injectable, signal } from '@angular/core';
import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { PicsaTranslateService } from '@picsa/i18n';
import { PicsaDatabaseAttachmentService } from '@picsa/shared/services/core/db_v2';
import { ErrorHandlerService } from '@picsa/shared/services/core/error-handler.service';
import { FileService } from '@picsa/shared/services/core/file.service';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
import { isIgnoredErrorMessage } from '@picsa/shared/services/core/sentry.service';
import { _wait } from '@picsa/utils';
import PQueue from 'p-queue';
import { RxAttachment, RxDocument } from 'rxdb';
import { Subscription } from 'rxjs';

import { IResourceFile } from '../schemas';
import { IDownloadStatus } from './resources-tool.service';

export type DownloadId = string;

const STRINGS = {
  DownloadFailed: translateMarker('Download Failed'),
  CheckConnection: translateMarker('Check internet connection and try again'),
};

export interface IDownloadOptions {
  suppressNotification?: boolean;
}

export interface DownloadEntry {
  _doc: RxDocument<IResourceFile>;

  // Signals only
  status: ReturnType<typeof signal<IDownloadStatus>>;
  progress: ReturnType<typeof signal<number>>; // 0..100
  attachment: ReturnType<typeof signal<RxAttachment<IResourceFile> | null>>;

  // Action
  /** Download will return doc with file attachment included, or null if download failed */
  download: (options?: IDownloadOptions) => Promise<RxDocument<IResourceFile> | null>;
  cancel: () => void;
  /**
   * @param convertFileSrc
   * Convert into usable src for rendering in webview. Typically required for files rendered in webview (images, pdf), but not for files passed to native handlers
   */
  uri: (convertNativeSrc?: boolean) => Promise<string | null>;

  subscription?: Subscription;
}

@Injectable({ providedIn: 'root' })
export class ResourcesDownloadService {
  // stored entries
  private map = new Map<string, DownloadEntry>();
  // stored uris
  private uris = new Map<string, string>();

  private fileService = inject(FileService);
  private attachmentService = inject(PicsaDatabaseAttachmentService);
  private errorHandler = inject(ErrorHandlerService);
  private notificationService = inject(PicsaNotificationService);
  private translateService = inject(PicsaTranslateService, { optional: true });

  public async register(doc: RxDocument<IResourceFile>) {
    const existing = this.map.get(doc.id);
    if (existing) return existing;

    // check existing attachment
    const attachment = this.getFileAttachment(doc);
    const status: IDownloadStatus = attachment ? 'complete' : 'ready';
    const progress = attachment ? 100 : 0;

    const entry: DownloadEntry = {
      _doc: doc,
      status: signal(status),
      progress: signal(progress),
      attachment: signal<RxAttachment<IResourceFile> | null>(attachment),
      download: (options?: IDownloadOptions) => this.download(doc, options),
      cancel: () => this.cancel(doc.id),
      uri: (convertNativeSrc = false) => this.getUri(doc.id, convertNativeSrc),
    };
    this.map.set(doc.id, entry);
    return entry;
  }

  public async queueMultiple(docs: RxDocument<IResourceFile>[], concurrency = 1) {
    const queue = new PQueue({ concurrency, autoStart: true });
    let hasNotifiedError = false;
    for (const doc of docs) {
      const entry = await this.register(doc);
      // set all entries to pending status while queing
      entry.status.set('pending');
      queue.add(async () => {
        // only download if hasn't been manually cancelled
        if (entry.status() === 'pending') {
          const result = await entry.download({ suppressNotification: true });
          if (!result && entry.status() === 'error' && !hasNotifiedError) {
            hasNotifiedError = true;
            this.showDownloadErrorNotification();
          }
          return result;
        }
        return doc;
      });
    }

    return queue;
  }

  public unregister(id?: string) {
    if (id) {
      const entry = this.map.get(id);
      if (entry) {
        const existingUri = this.uris.get(id);
        if (existingUri) {
          this.attachmentService.revokeFileAttachmentURIs([id]);
          this.uris.delete(id);
        }
        this.map.delete(id);
      }
    }
  }

  /** Start download */
  private async download(
    doc: RxDocument<IResourceFile>,
    options: IDownloadOptions = {},
  ): Promise<RxDocument<IResourceFile> | null> {
    const entry = await this.register(doc);

    const { progress, status } = entry;
    progress.set(0);
    status.set('pending');

    // Handle download, also passing back subscription so that component can cancel if required
    const { subscription, updates$ } = this.fileService.downloadFile(doc.url, 'blob');
    entry.subscription = subscription;

    const cleanUpSubscriptions = () => {
      entry.subscription?.unsubscribe();
      entry.subscription = undefined;
    };

    return new Promise((resolve) => {
      let downloadData: Blob | null = null;
      updates$.subscribe({
        next: ({ progress: dlProgress, data }) => {
          progress.set(dlProgress);
          if (data instanceof Blob) downloadData = data;
        },
        error: (error) => {
          cleanUpSubscriptions();
          status.set('error');
          if (this.isConnectionError(error)) {
            console.warn('[ResourcesDownload] Download failed due to connection', doc.url, error);
          } else {
            // Forward invalid storage links (e.g. 404/403/500) to ErrorHandler / Sentry
            void this.errorHandler.handleError(error);
          }
          if (!options.suppressNotification) {
            this.showDownloadErrorNotification();
          }
          resolve(null);
        },
        complete: async () => {
          try {
            if (!downloadData) {
              throw new Error('No download data on completion');
            }
            status.set('finalizing');
            // give small timeout to allow UI to update
            await _wait(100);
            // persist to document attachment and update entry doc reference
            const updatedDoc = await this.attachmentService.putAttachment(doc, doc.filename, downloadData);
            entry._doc = updatedDoc;
            const attachment = this.getFileAttachment(updatedDoc);
            if (attachment) {
              entry.attachment.set(attachment);
            }
            status.set('complete');
            resolve(updatedDoc);
          } catch (error) {
            status.set('error');
            void this.errorHandler.handleError(error);
            if (!options.suppressNotification) {
              this.showDownloadErrorNotification();
            }
            resolve(null);
          } finally {
            // Drop strong refs so GC can reclaim Blob
            downloadData = null;
            cleanUpSubscriptions();
          }
        },
      });
    });
  }

  private isConnectionError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const candidate = error as { status?: number; message?: string };
    if (candidate.status === 0) return true;
    return isIgnoredErrorMessage(candidate.message);
  }

  private showDownloadErrorNotification() {
    const title = this.translateService?.instant(STRINGS.DownloadFailed) ?? STRINGS.DownloadFailed;
    const detail = this.translateService?.instant(STRINGS.CheckConnection) ?? STRINGS.CheckConnection;
    this.notificationService.showErrorNotification(`${title}. ${detail}`);
  }

  /** Cancel ongoing download */
  private cancel(id: string) {
    const entry = this.map.get(id);
    if (entry) {
      const { subscription } = entry;
      if (subscription) {
        subscription.unsubscribe();
        entry.subscription = undefined;
      }
      entry.progress.set(0);
      entry.status.set('ready');
    }
  }

  private getFileAttachment(doc: RxDocument<IResourceFile>) {
    const name = doc.filename ?? doc.id;
    return doc.getAttachment(name);
  }

  private async getUri(id: string, convertFileSrc?: boolean) {
    const existing = this.uris.get(id);
    if (existing) {
      return existing;
    }
    const entry = this.map.get(id);
    if (!entry) return null;
    const { _doc } = entry;
    const filename = _doc.filename ?? _doc.id;
    const uri = await this.attachmentService.getFileAttachmentURI(_doc, filename, convertFileSrc);
    if (uri) {
      this.uris.set(id, uri);
      return uri;
    }
    return null;
  }
}
