import { inject, Injectable, signal } from '@angular/core';
import { PicsaDatabaseAttachmentService } from '@picsa/shared/services/core/db_v2';
import { FileService } from '@picsa/shared/services/core/file.service';
import { _wait } from '@picsa/utils';
import PQueue from 'p-queue';
import { RxAttachment, RxDocument } from 'rxdb';
import { Subscription } from 'rxjs';

import { IResourceFile } from '../schemas';
import { IDownloadStatus } from './resources-tool.service';

export type DownloadId = string;

export interface DownloadEntry {
  _doc: RxDocument<IResourceFile>;

  // Signals only
  status: ReturnType<typeof signal<IDownloadStatus>>;
  progress: ReturnType<typeof signal<number>>; // 0..100
  attachment: ReturnType<typeof signal<RxAttachment<IResourceFile> | null>>;

  // Action
  /** Download will return doc with file attachment included */
  download: () => Promise<RxDocument<IResourceFile>>;
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
      download: () => this.download(doc),
      cancel: () => this.cancel(doc.id),
      uri: (convertNativeSrc = false) => this.getUri(doc.id, convertNativeSrc),
    };
    this.map.set(doc.id, entry);
    return entry;
  }

  public async downloadMultiple(docs: RxDocument<IResourceFile>[], concurrency = 1) {
    const queue = new PQueue({ concurrency });
    const tasks = docs.map(async (doc) => {
      const entry = await this.register(doc);
      // set all entries to pending status while queing
      entry.status.set('pending');
      return queue.add(async () => {
        // only download if hasn't been manually cancelled
        if (entry.status() === 'pending') {
          return entry.download();
        }
        return doc;
      });
    });
    return Promise.allSettled(tasks);
  }

  public unregister(id?: string) {
    if (id) {
      const entry = this.map.get(id);
      if (entry) {
        const existingUri = this.uris.get(id);
        if (existingUri) {
          URL.revokeObjectURL(existingUri);
          this.uris.delete(id);
        }
        this.map.delete(id);
      }
    }
  }

  /** Start download */
  private async download(doc: RxDocument<IResourceFile>): Promise<RxDocument<IResourceFile>> {
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

    return new Promise((resolve, reject) => {
      let downloadData: Blob | null = null;
      updates$.subscribe({
        next: ({ progress: dlProgress, data }) => {
          progress.set(dlProgress);
          if (data instanceof Blob) downloadData = data;
        },
        error: (error) => {
          cleanUpSubscriptions();
          status.set('error');
          console.error(error);

          reject(error);
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
            reject(error);
          } finally {
            // Drop strong refs so GC can reclaim Blob
            downloadData = null;
            cleanUpSubscriptions();
          }
        },
      });
    });
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
    return this.attachmentService.getFileAttachmentURI(_doc, filename, convertFileSrc);
  }
}
