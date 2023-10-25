import { Injectable } from '@angular/core';
import { FileOpener } from '@awesome-cordova-plugins/file-opener/ngx';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import write_blob from 'capacitor-blob-writer';

import { PicsaAsyncService } from '../asyncService.service';

/**
 *
 * NOTE - the native storage service is designed to interact with the db-attachment service
 * so that file metadata can be persisted alongside write operations
 */
@Injectable({
  providedIn: 'root',
})
export class NativeStorageService extends PicsaAsyncService {
  cacheName = 'picsa_extension';
  private basePath: string;

  constructor(private fileOpener: FileOpener) {
    super();
  }

  public override async init() {
    console.log('[Native Storage] init');
    await this.ensureCacheDirectory();
    const { uri } = await Filesystem.getUri({
      directory: Directory.Data,
      path: this.cacheName,
    });
    this.basePath = uri;
    console.log('[Native Storage] init complete');
  }

  /** Open a file by a given storage path */
  public async openFile(storagePath: string, mimetype: string) {
    const filepath = `${this.basePath}/${storagePath}`;
    await this.fileOpener.open(filepath, mimetype);
  }

  /** Open a file by a given URI */
  public async openFileURI(uri: string, mimetype: string) {
    await this.fileOpener.open(uri, mimetype);
  }

  /************************************************************************************
   *  File Caching
   *
   *  A separate doc keeps a list of all cached files so that if
   *  the cache is ever deleted the doc will be too (and hence made aware cache empty)
   *
   *  The cache file is written after any storage writes, with the use of a behaviour
   *  subject to allow for debounced writes
   ************************************************************************************/

  /** Download from a url and store in cache */
  public async writeFile(data: Blob, relativePath: string) {
    if (!data) return null;
    // TODO - sanitize path

    const directory = Directory.Data;
    const path = `${this.cacheName}/${relativePath}`;
    const cachePath = await write_blob({
      directory,
      path,
      blob: data as Blob,
      recursive: true,
      fast_mode: true,
      on_fallback(error) {
        console.error('blobl write error', cachePath, error);
        throw error;
      },
    });
    const FileInfo = await Filesystem.stat({ path, directory });
    return FileInfo;
  }

  public async deleteFile(relativePath: string) {
    const directory = Directory.Data;
    const path = `${this.cacheName}/${relativePath}`;
    return Filesystem.deleteFile({ path, directory });
  }

  /************************************************************************************
   *  Helper methods
   ************************************************************************************/

  private async ensureCacheDirectory() {
    try {
      await Filesystem.readdir({
        directory: Directory.Data,
        path: this.cacheName,
      });
    } catch (error: any) {
      if (error.message === 'Directory does not exist') {
        await Filesystem.mkdir({
          directory: Directory.Data,
          path: this.cacheName,
          recursive: true,
        });
      } else {
        throw error;
      }
    }
  }

  /**
   * Convert storage entry to usable src
   * Required as devices can't show local file:/// images
   */
  public async convertToLocalUrl(relativePath: string) {
    const fileUrl = `${this.basePath}/${relativePath}`;
    return Capacitor.convertFileSrc(fileUrl);
  }
}
