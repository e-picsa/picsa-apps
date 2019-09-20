import { Injectable } from '@angular/core';
import { File } from '@ionic-native/file/ngx';
import { FileOpener } from '@ionic-native/file-opener/ngx';
import {
  FileTransfer,
  FileTransferObject
} from '@ionic-native/file-transfer/ngx';
import { Platform } from '@ionic/angular';
import MIMETYPES from '../../data/mimetypes';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PicsaFileService {
  platforms: any;
  isCordova: boolean;
  appDir: string;
  externalDir: string;
  externalBackupDir: string;
  dir: IPicsaDirectory;

  constructor(
    public platform: Platform,
    private file: File,
    private fileOpener: FileOpener,
    private transfer: FileTransfer
  ) {
    // want to keep functions out of constructor as sometimes initialise before
    // cordova ready. Better to call init function after platform ready
  }
  init() {
    console.log('file service init', this.fileOpener);
    this.checkPlatform();
    if (this.isCordova) {
      this.mobileInit();
    }
  }
  async mobileInit() {
    console.log('mobile init');
    this.dir = {
      app: this.file.applicationDirectory,
      storage: this.file.externalApplicationStorageDirectory,
      public: this.file.externalRootDirectory
    };
    await this.ensurePicsaDirectory('storage');
    await this.ensurePicsaDirectory('public');
  }
  checkPlatform() {
    console.log('checking platform');
    this.platforms = this.platform.platforms();
    this.isCordova = this.platform.is('cordova');
  }
  // given a basepath check if subfolder 'picsa' exists. If not create
  async ensurePicsaDirectory(base: IPicsaDirectoryBase) {
    console.log(`ensuring [${base}] directory`);
    const path = this.dir[base];
    try {
      await this.file.checkDir(path, 'picsa');
      console.log(`[${base}] directory exists`);
    } catch (error) {
      console.log(`creating folder [${path}/picsa]`);
      await this.createDirectory(path, 'picsa', false);
    }
  }
  downloadFile(url: string, filename: string) {
    const fileTransfer: FileTransferObject = this.transfer.create();
    return new Observable<ProgressEvent>(observer => {
      fileTransfer.onProgress(p => observer.next(p));
      fileTransfer.download(url, this.dir.storage + filename).then(file => {
        observer.complete();
      });
    });
  }

  /**
   * list directory contents for specified path
   * @param base - specify base directory, for app public or storage directory
   * @param dir - folder path, can contain subfolders
   */
  async listDirectory(base: IPicsaDirectoryBase, dir: string) {
    console.log('file', this.file);
    console.log(`listing [${dir}]`);
    try {
      const files = await this.file.listDir(this.dir[base], dir);
      return files;
    } catch (error) {
      throw new Error(JSON.stringify(error));
    }
  }
  async createDirectory(path: string, name: string, replace: boolean) {
    try {
      await this.file.createDir(path, name, replace);
      return path;
    } catch (error) {
      return new Error(`${name} directory could not be created`);
    }
  }

  // create files in external picsa directory
  // optionally can use backupStorage location to make independent of app
  async createFile(
    filename: string,
    data: any,
    replace: boolean,
    backupStorage: boolean
  ) {
    try {
      const fileBase = backupStorage
        ? this.file.externalRootDirectory
        : this.file.externalApplicationStorageDirectory;
      console.log('creating file', filename, fileBase);
      await this.file.createFile(fileBase, `picsa/${filename}`, replace);
      console.log('file created succesfully');
      if (typeof data != 'string') {
        data = JSON.stringify(data);
      }
      console.log('writing file data', data);
      await this.file.writeFile(fileBase, `picsa/${filename}`, data, {
        replace: true
      });
      console.log(filename, 'written successfully');
      // return filepath
      return `${fileBase}picsa/${filename}`;
    } catch (error) {
      console.log('could not create or write file', error);
      throw new Error('could not create file');
    }
  }

  // read files from the external picsa directory
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

  async openFileCordova(storagePath: string) {
    const filePath = `${this.dir.storage}/${storagePath}`;
    const mimetype = this._getMimetype(filePath);
    console.log('opening file', filePath, mimetype);
    this.fileOpener.open(filePath, mimetype);
  }

  _getMimetype(filename: string) {
    const fileNameSplit = filename.split('.');
    const extension: string = fileNameSplit[fileNameSplit.length - 1];
    return MIMETYPES[extension];
  }
}

type IPicsaDirectoryBase = 'app' | 'public' | 'storage';

/**
 * @param app applicationDirectory: readonly android assets directory
 * @param storage externalApplicationStorageDirectory: external files specific to app (good for downloaded assets)
 * @param public externalRootDirectory: external files general, good for persisting beyond uninstall
 */
type IPicsaDirectory = { [key in IPicsaDirectoryBase]: string };

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
