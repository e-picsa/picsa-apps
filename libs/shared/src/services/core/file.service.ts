import { HttpClient, HttpEventType } from '@angular/common/http';
import { inject,Injectable } from '@angular/core';
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
  private http = inject(HttpClient);

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
        .pipe(catchError((err) => of(undefined))),
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
  public downloadFile(
    url: string,
    responseType: 'blob' | 'base64' = 'base64',
    headers: Record<string, string> = {},
  ): {
    subscription: Subscription;
    updates$: BehaviorSubject<{ progress: number; data?: Blob | string }>;
  } {
    if (!url.startsWith('http')) {
      headers = {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
        Expires: '0',
        ...headers,
      };
    }

    let progress = 0;
    let data: Blob | string | undefined;

    const updates$ = new BehaviorSubject<{ progress: number; data?: Blob | string }>({ progress });

    const subscription = this.http
      .get(url, {
        responseType: 'blob',
        reportProgress: true,
        headers,
        observe: 'events',
      })
      .subscribe({
        next: (event) => {
          if (event.type === HttpEventType.DownloadProgress && event.total) {
            progress = Math.round((100 * event.loaded) / event.total);
          }
          if (event.type === HttpEventType.Response) {
            data = event.body as Blob;
          }
          updates$.next({ progress, data });
        },
        error: (err) => {
          try {
            updates$.error(err);
          } finally {
            subscription.unsubscribe();
          }
        },
        complete: async () => {
          try {
            if (responseType === 'base64' && data instanceof Blob) {
              data = await this.convertBlobToBase64(data);
            }
            updates$.next({ progress: 100, data });
            updates$.complete();
          } finally {
            subscription.unsubscribe();
          }
        },
      });

    return { subscription, updates$ };
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
