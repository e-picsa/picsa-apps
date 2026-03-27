import { inject, Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share, ShareOptions } from '@capacitor/share';
import { base64ToBlob } from '@picsa/utils';
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
    if (Capacitor.isNativePlatform()) {
      // On native use custom method to share from uri
      const uris = docs.map(({ uri }) => uri).filter((u): u is string => !!u);
      if (uris.length === 0) {
        throw new Error('No shareable files found');
      }
      return this.shareFromNativeUris(uris, opts);
    } else {
      // On web base64 data must be converted to files for sharing
      return this.shareFromWebBase64(docs, opts);
    }
  }

  /** Share uri path to file on native filesystem */
  public async shareFromNativeUris(uris: string[], opts: Omit<ShareOptions, 'files'> = {}) {
    // HACK - files can only be shared from the cache folder (unless specific permissions granted)
    // Copy to cache folder, share and delete from cache
    // https://capacitorjs.com/docs/v5/apis/share#android
    // https://capawesome.io/plugins/file-opener/#android

    const shareable: { cacheUri: string; title: string }[] = [];
    for (const uri of uris) {
      const cacheUri = await this.nativeStorageService.copyFileToCache(uri);

      if (cacheUri) {
        const title = uri.split('/').pop() as string;
        shareable.push({ cacheUri, title });
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
  private async shareFromWebBase64(docs: RxDocument<IAttachment>[], opts: Omit<ShareOptions, 'files'> = {}) {
    const files: File[] = [];
    for (const { data: base64Data, type, id } of docs) {
      if (base64Data) {
        const blob = await base64ToBlob(base64Data, type);
        const ext = type.split('/')[1] ?? 'bin';
        const baseName = id.split('/').pop() || 'attachment';
        const safeName = `${baseName.replace(/[/\\|:*?"<>]/g, '_')}.${ext}`;
        const file = new File([blob], safeName, { type });
        files.push(file);
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
