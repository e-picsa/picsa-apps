import { Injectable } from '@angular/core';
import { FileOpener } from '@awesome-cordova-plugins/file-opener/ngx';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { catchError, debounceTime } from 'rxjs/operators';
import { BehaviorSubject, firstValueFrom, Observable, of } from 'rxjs';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { APP_VERSION } from '@picsa/environments';
import write_blob from 'capacitor-blob-writer';

interface IStorageFileEntry {
  md5Checksum?: string;
  modifiedTime: string;
  relativePath: string;
  size_kb: number;
}
interface IDownloadEntry {
  relativePath: string;
  downloadUrl: string;
}
// format of contents.json file (as populated from utiltiy methods)
export type IStorageFilesHashmap = {
  [relativePath: string]: IStorageFileEntry;
};

@Injectable({
  providedIn: 'root',
})
// storage service only used on cordova, otherwise service-worker handles
export class NativeStorageService {
  cacheName = 'picsa_extension';
  private basePath: string;

  /** List of all files present in cacheName folder (as well as app version) */
  private cachedFilesList: IStorageFilesHashmap = {
    _version: APP_VERSION as any,
  };
  // use subject to debounce writes to file that keeps log of cached files
  private cachedFilesUpdated$: BehaviorSubject<any> = new BehaviorSubject(true);

  constructor(private fileOpener: FileOpener, private http: HttpClient) {}

  public async init() {
    console.log('[Native Storage] init');
    const { uri } = await Filesystem.getUri({
      directory: Directory.Data,
      path: this.cacheName,
    });
    this.basePath = uri;
    await this.ensureCacheDirectory();
    this.cachedFilesList = await this.loadFileList(Directory.Data);
    console.log('[Native Storage] cachedFiles', this.cachedFilesList);
    this.cachedFilesUpdated$.pipe(debounceTime(5000)).subscribe(async () => {
      await this.writeCacheListToFile();
    });
    this.cachedFilesUpdated$.next(true);
    console.log('[Native Storage] init complete');
  }

  public async openFile(storagePath: string, mimetype: string) {
    const filepath = `${this.basePath}/${storagePath}`;
    await this.fileOpener.open(filepath, mimetype);
  }

  /**
   * Read a file from the local assets folder
   * @param assetPath - relative path to asset, omitting first /assets/ part
   * @returns asset contents if found, undefined if not
   */
  public async readAssetFile(
    assetPath: string,
    responseType: 'text' | 'blob' | 'arraybuffer' = 'text'
  ) {
    const fileContents = await firstValueFrom(
      this.http
        .get(`assets/${assetPath}`, {
          responseType: responseType as any,
        })
        .pipe(catchError((err) => of(undefined)))
    );
    return fileContents as any;
  }

  /** Read the contents.json file from an asset folder and return contents */
  public async readAssetContents(assetFolderPath: string) {
    let contents: IStorageFilesHashmap = {};
    const contentsFile = await this.readAssetFile(
      `${assetFolderPath}/contents.json`
    );
    if (contentsFile) {
      contents = JSON.parse(contentsFile) as any;
      // map files to include relative asset folder
      Object.entries(contents).forEach(([key, value]) => {
        value.relativePath = `${assetFolderPath}/${value.relativePath}`;
        contents[key] = value;
      });
    }
    return contents;
  }

  /** get a subset of all cached files by path prefix */
  public getCacheFilesByPath(prefix: string) {
    const cachedFiles: IStorageFilesHashmap = {};
    Object.entries(this.cachedFilesList).forEach(([key, value]) => {
      if (key.startsWith(prefix)) {
        cachedFiles[key] = value;
      }
    });
    return cachedFiles;
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

  /** TODO - include/separate out method to remove any old caches*/
  public async clearCache(): Promise<void> {}

  public checkFileCached(entry: IStorageFileEntry) {
    const cachedEntry = this.cachedFilesList[entry.relativePath];
    if (!cachedEntry) {
      return false;
    }
    // assume same if names same and file same (no easy way to check md5 of local)
    return cachedEntry.size_kb === entry.size_kb;
  }

  /** Download from a url and store in cache */
  public downloadToCache(fileMeta: IDownloadEntry) {
    const cacheUpdate = {};
    const progress$ = new Observable<{
      progress: number;
      meta?: any;
      error?: any;
    }>((observer) => {
      this.downloadFile(fileMeta.downloadUrl, 'blob').subscribe({
        error: (err) => {
          console.log('[Native Storgage] download error', fileMeta);
          console.error(err);
          observer.error(err);
          observer.complete();
        },
        next: async ({ progress, data }) => {
          observer.next({ progress });
          if (progress === 100 && data) {
            const meta = await write_blob({
              directory: Directory.Data,
              path: `${this.cacheName}/${fileMeta.relativePath}`,
              blob: data as Blob,
              recursive: true,
              fast_mode: true,
              on_fallback(error) {
                console.error(error);
                observer.error(error);
                observer.next({ progress, meta, error });
                observer.complete();
              },
            });
            cacheUpdate[fileMeta.relativePath] = true;
            this.cachedFilesList = {
              ...this.cachedFilesList,
              ...cacheUpdate,
            };
            this.cachedFilesUpdated$.next(true);
            observer.next({ progress, meta });
            observer.complete();
          }
        },
      });
    });

    return progress$;
  }

  private async loadFileList(
    directory: Directory,
    path = '',
    filesHashmap: IStorageFilesHashmap = {}
  ) {
    const cacheFolderPath = `${this.cacheName}/${path}`;
    const { files } = await Filesystem.readdir({
      directory,
      path: cacheFolderPath,
    });
    for (const file of files) {
      const { mtime, name, size, type, uri } = file;
      const relativePath: string = path ? `${path}/${name}` : name;
      if (type === 'directory') {
        filesHashmap = await this.loadFileList(
          directory,
          relativePath,
          filesHashmap
        );
      } else {
        const entry: IStorageFileEntry = {
          modifiedTime: new Date(mtime).toISOString(),
          relativePath,
          size_kb: Math.round(size / 102.4) / 10,
        };
        filesHashmap[relativePath] = entry;
      }
    }
    return filesHashmap;
  }

  private async writeCacheListToFile() {
    await Filesystem.writeFile({
      directory: Directory.Data,
      path: `${this.cacheName}/cachedFiles.json`,
      data: JSON.stringify(this.cachedFilesList),
      recursive: true,
      encoding: Encoding.UTF8,
    });
  }

  /************************************************************************************
   *  Helper methods
   ************************************************************************************/

  private downloadFile(
    url: string,
    responseType: 'blob' | 'base64' = 'base64',
    headers = {}
  ) {
    const updates$ = new BehaviorSubject({ progress: 0, data: null as any });
    // If downloading from local assets ignore cache
    if (!url.startsWith('http')) {
      headers = {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
        Expires: '0',
        ...headers,
      };
    }
    this.http
      .get(url, {
        responseType: 'blob',
        reportProgress: true,
        headers,
        observe: 'events',
      })
      .subscribe(async (event) => {
        if (event.type === HttpEventType.DownloadProgress) {
          const progress = Math.round((100 * event.loaded) / event.total!);
          updates$.next({ progress, data: null });
        } else if (event.type === HttpEventType.Response) {
          if (responseType === 'blob') {
            console.log('[Download Files] success', url);
            updates$.next({ progress: 100, data: event.body as Blob });
          } else {
            const base64 = await this.convertBlobToBase64(event.body as Blob);
            updates$.next({ progress: 100, data: base64 });
          }
          updates$.complete();
        }
      });
    return updates$;
  }

  private convertBlobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  }

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

  // html templates can't show local file:/// images, so convert using cordova webview
  private async convertToLocalUrl(entry: IStorageFileEntry) {
    const fileUrl = `${this.basePath}/${entry.relativePath}`;
    return Capacitor.convertFileSrc(fileUrl);
  }
}
