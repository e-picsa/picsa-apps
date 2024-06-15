import { HttpClient, HttpEventType } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, firstValueFrom, of, Subscription } from 'rxjs';

export interface IStorageFileEntry {
  md5Checksum: string;
  modifiedTime: string;
  relativePath: string;
  size_kb: number;
}

// format of contents.json file (as populated from utiltiy methods)
export type IStorageFilesHashmap = {
  [relativePath: string]: IStorageFileEntry;
};

@Injectable({ providedIn: 'root' })
export class FileService {
  constructor(private http: HttpClient) {}

  /**
   * Read a file from the local assets folder
   * @param assetPath - relative path to asset, omitting first /assets/ part
   * @returns asset contents if found, undefined if not
   */
  public async readAssetFile(assetPath: string, responseType: 'text' | 'blob' | 'arraybuffer' = 'text') {
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
    const contentsFile = await this.readAssetFile(`${assetFolderPath}/contents.json`);
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
  
  /** Observable method to download a file from url   */
  public downloadFile(url: string, responseType: 'blob' | 'base64' = 'base64', headers = {}) {
    // If downloading from local assets ignore cache
    if (!url.startsWith('http')) {
      headers = {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
        Expires: '0',
        ...headers,
      };
    }

    // subscribe and share updates
    let subscription = new Subscription();
    let progress = 0;
    let data: Blob | string;

    // share initial update with request and subscription objects to allow dl interrupt via unsubscribe method
    const updates$ = new BehaviorSubject<{
      progress: number;
      subscription: Subscription;
      data?: Blob | string;
    }>({ progress, subscription });
    subscription = this.http
      .get(url, {
        responseType: 'blob',
        reportProgress: true,
        headers,
        observe: 'events',
      })
      .subscribe({
        error: (err) => updates$.error(err),
        next: async (event) => {
          // handle progress update
          if (event.type === HttpEventType.DownloadProgress) {
            if (event.total) {
              progress = Math.round((100 * event.loaded) / event.total);
            }
          }
          // handle full response received
          if (event.type === HttpEventType.Response) {
            data = event.body as Blob;
          }
          updates$.next({ progress, subscription, data });
        },
        complete: async () => {
          if (responseType === 'base64') {
            data = await this.convertBlobToBase64(data as Blob);
          }
          updates$.next({ progress: 100, data, subscription });
          updates$.complete();
        },
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
}
