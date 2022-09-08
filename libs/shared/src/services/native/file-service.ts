import { Injectable } from '@angular/core';
import { File } from '@awesome-cordova-plugins/file/ngx';
import { FileOpener } from '@awesome-cordova-plugins/file-opener/ngx';
import {
  FileTransfer,
  FileTransferObject,
} from '@awesome-cordova-plugins/file-transfer/ngx';
import { Platform } from '@ionic/angular';
import MIMETYPES from '../../data/mimetypes';
import { Observable, BehaviorSubject } from 'rxjs';
import { takeWhile } from 'rxjs/operators';
import { APP_VERSION } from '@picsa/environments';

declare const cordova: any;

@Injectable({ providedIn: 'root' })
export class PicsaFileService {
  appDir: string;
  externalDir: string;
  externalBackupDir: string;
  dir: IDirectory;
  private ready$ = new BehaviorSubject(false);
  constructor(
    public platform: Platform,
    private file: File,
    private fileOpener: FileOpener,
    private transfer: FileTransfer
  ) {
    this._init();
  }

  /**********************************************************************************
   *      Initialisation
   *********************************************************************************/
  /**
   * Promise used to ensure file service has been initialised before use
   * Should be checked when interacting for the first time
   */
  ready() {
    return new Promise((resolve) => {
      this.ready$.pipe(takeWhile((v) => v === false)).subscribe(
        () => null,
        () => null,
        () => {
          console.log('platform ready');
          resolve(true);
        }
      );
    });
  }

  /**
   * Wait for platform, detect if cordova, create storage directory shorthand
   * and inform subscription function
   */
  private _init() {
    console.log('file service init');
    this.platform.ready().then(() => {
      if (this.platform.is('cordova')) {
        this.dir = {
          app: this.file.applicationDirectory,
          storage: this.file.externalApplicationStorageDirectory,
          public: this.file.externalRootDirectory,
        };
      }
      this.ready$.next(true);
    });
  }

  /**
   * Given a base path ensure a folder exists, returning it's contents
   * @param base
   * @param folder
   */
  async ensureDirectory(base: IDirectoryBase, folder = '') {
    const baseDir = this.dir[base];
    console.log('ensuring directory', base, folder);
    try {
      const contents = await this.listDirectory(base, folder);
      console.log(`[File Folder Contents] ${base}${folder}:`, contents);
      return contents;
    } catch (error) {
      console.log(`[${base}${folder}] dir does not exists, creating`);
      try {
        await this.file.createDir(baseDir, folder, true);
        console.log(`${baseDir}${folder} exists`);
        return [];
      } catch (error) {
        console.error('could not create directory', `${baseDir}${folder}`);
        throw error;
      }
    }
  }
  downloadToStorage(
    url: string,
    folder: IStorageFolder = 'resources',
    filename: string
  ) {
    const fileTransfer: FileTransferObject = this.transfer.create();
    return new Observable<ProgressEvent>((observer) => {
      fileTransfer.onProgress((p) => observer.next(p));
      fileTransfer
        .download(url, `${this.dir.storage}${folder}/${filename}`)
        .then((file) => {
          observer.complete();
        });
    });
  }
  /**
   * Copy a file from the android app www/assets folder to corresponding
   * app storage folder
   */
  async copyAssetFile(folderpath: string, fileName: string) {
    console.log('copying asset file', folderpath, fileName);
    const basePath = `www/assets/${folderpath}`;
    const assetsPath = `${basePath}/${fileName}`;
    const entry = await this.file.copyFile(
      this.dir.app,
      assetsPath,
      this.dir.storage,
      `${folderpath}/${fileName}`
    );
    console.log('file copied successfully', entry);
  }

  /**
   * list directory contents for specified path
   * @param base - specify base directory, for app public or storage directory
   * @param dir - folder path, can contain subfolders
   */
  async listDirectory(base: IDirectoryBase, dir: string) {
    console.log(`[File List] ${dir}`);
    // eslint-disable-next-line no-useless-catch
    try {
      const files = await this.file.listDir(this.dir[base], dir);
      return files;
    } catch (error) {
      throw error;
    }
  }

  // create files in external directory
  // optionally can use backupStorage location to make independent of app
  async writeFile(
    base: IDirectoryBase,
    folder: IPublicFolder | IStorageFolder = 'picsa',
    filename: string,
    data: any
  ) {
    console.log('write file', base, folder, filename);
    await this.ensureDirectory(base, folder);
    console.log('directory exists, creating file', filename);
    try {
      await this.file.createFile(this.dir[base], `${folder}/${filename}`, true);
      console.log('file created succesfully');
      if (typeof data != 'string') {
        data = JSON.stringify(data);
      }
      console.log('writing file data', data);
      await this.file.writeFile(base, `${folder}/${filename}`, data, {
        replace: true,
      });
      console.log(filename, 'written successfully');
      // return filepath
    } catch (error) {
      throw new Error('could not create file');
    }
  }

  // read files from the external directory
  async readTextFile(filename: string, backupStorage?: boolean) {
    const fileBase = backupStorage
      ? this.file.externalRootDirectory
      : this.file.externalApplicationStorageDirectory;
    console.log('reading file', fileBase, `picsa/${filename}`);
    try {
      const fileTxt = await this.file.readAsText(fileBase, `picsa/${filename}`);
      console.log('file read', fileTxt);
      return fileTxt;
    } catch (error) {
      console.error('could not read file', error);
      return null;
    }
  }

  /**
   *
   * @param directoryBase - indicate whether the resource can be found within hardcoded app
   * asset files, app storage, or public folder   *
   * @param storagePath - the relative filepath from the base directory
   */
  async openFileCordova(directoryBase: IDirectoryBase, storagePath: string) {
    const filePath = `${this.dir[directoryBase]}${storagePath}`;
    const mimetype = this._getMimetype(filePath);
    try {
      this.fileOpener.open(filePath, mimetype);
    } catch (error) {
      console.error('failed to open', filePath);
      throw error;
    }
  }

  /**
   * Experimental method to copy the source app apk for sharing
   * Uses https://www.npmjs.com/package/cordova-plugin-codeplay-share-own-apk
   *
   */
  async shareAppApk() {
    const plugins = cordova.plugins;
    if (!plugins.codeplay_shareapk) {
      console.error('cordova plugin codeplay_shareapk not installed');
      return;
    }
    return new Promise((resolve, reject) => {
      plugins.codeplay_shareapk.isSupport(
        (success: boolean) => {
          console.log('plugin supported', success);
          plugins.codeplay_shareapk.openShare(
            'Share the PICSA App',
            `picsa-app-${APP_VERSION.number}`,
            (shareSuccess) => {
              console.log('share success', shareSuccess);
            },
            (shareError) => {
              console.error('share error', shareError);
            }
          );
          resolve(true);
        },
        (error: any) => {
          console.error('codeplay_shareapk plugin not supported', error);
          reject('plugin not supported');
        }
      );
    });
  }

  /**********************************************************************************
   *      Helper Methods
   *********************************************************************************/

  _getMimetype(filename: string) {
    const fileNameSplit = filename.split('.');
    const extension: string = fileNameSplit[fileNameSplit.length - 1];
    return MIMETYPES[extension];
  }
}

/**********************************************************************************
 *      Interfaces
 *********************************************************************************/

type IPublicFolder = 'picsa';
type IStorageFolder = 'resources';
type IDirectoryBase = 'app' | 'public' | 'storage';

/**
 * @param app applicationDirectory: readonly android assets directory - node to get www assets require /www/assets
 * @param storage externalApplicationStorageDirectory: external files specific to app (good for downloaded assets)
 * @param public externalRootDirectory: external files general, good for persisting beyond uninstall
 */
type IDirectory = { [key in IDirectoryBase]: string };

/*
Device Path	                 cordova.file.*	                      AndroidExtraFileSystems	      r/w?  persistent?   OS clears   private

file:///android_asset/	     applicationDirectory	                assets	                      r	    N/A	          N/A	          Yes

/data/data/<app-id>/	       applicationStorageDirectory	        -	                            r/w	  N/A           N/A	          Yes
  cache	                     cacheDirectory	                      cache	                        r/w	  Yes	          Yes*	        Yes
  files	                     dataDirectory	                      files	                        r/w	  Yes	          No	          Yes
    Documents		                                                  documents	                    r/w	  Yes	          No	          Yes

<sdcard>/	                   externalRootDirectory	              sdcard	                      r/w	  Yes	          No	          No
  Android/data/<app-id>/	   externalApplicationStorageDirectory	  -	                          r/w	  Yes	          No          	No
  cache	                     externalCacheDirectory	              cache-external	              r/w	  Yes	          No**	        No
  files	                     externalDataDirectory	              files-external	              r/w	  Yes	          No	          No

*/
