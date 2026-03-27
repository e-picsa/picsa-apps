import { inject, Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share, ShareOptions } from '@capacitor/share';
import { base64ToBlob } from '@picsa/utils/data';
import { getExtensionForMime } from '@picsa/utils/mimetypes';
import { RxDocument } from 'rxdb';

import { NativeStorageService } from '../native';
import { IAttachment } from './db_v2/schemas/attachments';

const SHARE_OPTION_DEFAULTS: ShareOptions = {
  files: [],
  title: '',
  dialogTitle: 'Share',
  text: 'Shared from E-PICSA App',
};

/** Best-effort delay before cleaning cache. No reliable signal exists for share completion. */
const CACHE_CLEANUP_DELAY_MS = 60_000;

@Injectable({ providedIn: 'root' })
export class ShareService {
  private nativeStorageService = inject(NativeStorageService);

  /**
   * Most services share downloaded files as attachments in specific
   * attachments db table. Share all files from attachments
   */
  public async shareFromAttachments(docs: RxDocument<IAttachment>[], opts: Omit<ShareOptions, 'files'> = {}) {
    return Capacitor.isNativePlatform()
      ? this.shareFromAttachmentsNative(docs, opts)
      : this.shareFromAttachmentsWeb(docs, opts);
  }

  /** Share uri path to file on native filesystem */
  private async shareFromAttachmentsNative(docs: RxDocument<IAttachment>[], opts: Omit<ShareOptions, 'files'> = {}) {
    // HACK - files can only be shared from the cache folder (unless specific permissions granted)
    // Copy to cache folder, share and delete from cache
    // https://capacitorjs.com/docs/v5/apis/share#android
    // https://capawesome.io/plugins/file-opener/#android

    const shareable: { cacheUri: string; title: string }[] = [];
    for (const doc of docs) {
      const { uri, type } = doc._data;
      if (type && uri) {
        // Ensure file extension included
        let targetFilename = uri.split('/').pop() as string;
        const targetExt = getExtensionForMime(type);
        if (!targetExt) {
          console.warn('Doc does not include mimetype, auto-populating');
          break;
        }
        if (!targetFilename.endsWith(targetExt)) {
          targetFilename += `${targetExt}`;
        }

        // Populate to cache for sharing
        const cacheUri = await this.nativeStorageService.copyFileToCache(uri, targetFilename);
        if (cacheUri) {
          const title = uri.split('/').pop() as string;
          shareable.push({ cacheUri, title });
        }
      }
    }
    if (shareable.length === 0) {
      throw new Error('No shareable files found');
    }

    const files = shareable.map(({ cacheUri }) => cacheUri);
    const title = opts.title || shareable.length === 1 ? shareable[0].title : `${shareable.length} Files`;
    await Share.share({ ...SHARE_OPTION_DEFAULTS, ...opts, title, files });

    // NOTE - sharing callback will return after delegating task (e.g. open whatsapp to share),
    // so do not delete cache file immediately as no guarantee target task completed

    setTimeout(async () => {
      for (const { cacheUri } of shareable) {
        try {
          await Filesystem.deleteFile({
            path: cacheUri,
            directory: Directory.Cache,
          });
        } catch (e) {
          console.warn('Failed to clean up cache file:', cacheUri, e);
        }
      }
    }, CACHE_CLEANUP_DELAY_MS);
  }

  /** Convert base64 data to file and share */
  private async shareFromAttachmentsWeb(docs: RxDocument<IAttachment>[], opts: Omit<ShareOptions, 'files'> = {}) {
    const files: File[] = [];
    for (const { data: base64Data, type, id } of docs) {
      if (base64Data) {
        const ext = getExtensionForMime(type);
        if (ext) {
          const blob = await base64ToBlob(base64Data, type);
          const baseName = id.split('/').pop() || 'attachment';
          const safeName = `${baseName.replace(/[/\\|:*?"<>]/g, '_')}.${ext}`;
          const file = new File([blob], safeName, { type });
          files.push(file);
        } else {
          console.warn('Failed to determine extension type from type', { type, id });
        }
      }
    }
    if (files.length === 0) {
      throw new Error('No shareable files found');
    }
    if (!navigator.canShare?.({ files })) {
      throw new Error('File sharing not supported');
    }
    return navigator.share({ ...SHARE_OPTION_DEFAULTS, ...opts, files });
  }
}
