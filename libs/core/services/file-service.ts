import { Injectable } from "@angular/core";
import { File } from "@ionic-native/file/ngx";
import { FileOpener } from "@ionic-native/file-opener/ngx";
import { Platform } from "@ionic/angular";
import mimetypes from "./mimetypes";

@Injectable({ providedIn: "root" })
export class FileService {
  platforms: any;
  isCordova: boolean;
  appDir: string;
  externalDir: string;
  externalBackupDir: string;

  constructor(
    public platform: Platform,
    private file: File,
    private fileOpener: FileOpener
  ) {
    // want to keep functions out of constructor as sometimes initialise before
    // cordova ready. Better to call init function after platform ready
  }
  init() {
    this.checkPlatform();
    if (this.isCordova) {
      this.mobileInit();
    }
  }
  async mobileInit() {
    console.log("platform mobile, cordova enabled");
    console.log("file plugin", this.file);
    this.appDir = this.file.applicationDirectory;
    this.externalDir = await this.checkFileDirectoryExists();
    this.externalBackupDir = await this.checkFileDirectoryExists(true);
  }
  checkPlatform() {
    console.log("checking platform");
    this.platforms = this.platform.platforms();
    this.isCordova = this.platform.is("cordova");
  }
  async checkFileDirectoryExists(backup?: boolean) {
    console.log("checking file directory");
    const basePath = backup
      ? this.file.externalApplicationStorageDirectory
      : this.file.externalRootDirectory;
    try {
      await this.file.checkDir(basePath, "picsa");
      return this.file.externalApplicationStorageDirectory;
    } catch (error) {
      console.log("picsa directory does not exist, creating");
      await this.createDirectory(basePath, "picsa", false);
    }
  }

  // list directory contents for specified path
  async listDirectory(dir, path) {
    console.log("listing", path);
    try {
      const files = await this.file.listDir(dir, path);
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
      console.log("creating file", filename, fileBase);
      await this.file.createFile(fileBase, `picsa/${filename}`, replace);
      console.log("file created succesfully");
      if (typeof data != "string") {
        data = JSON.stringify(data);
      }
      console.log("writing file data", data);
      await this.file.writeFile(fileBase, `picsa/${filename}`, data, {
        replace: true
      });
      console.log(filename, "written successfully");
      // return filepath
      return `${fileBase}picsa/${filename}`;
    } catch (error) {
      console.log("could not create or write file", error);
      throw new Error("could not create file");
    }
  }

  // read files from the external picsa directory
  async readTextFile(filename: string, backupStorage?: boolean) {
    const fileBase = backupStorage
      ? this.file.externalRootDirectory
      : this.file.externalApplicationStorageDirectory;
    console.log("reading file", fileBase, `picsa/${filename}`);
    try {
      const fileTxt = await this.file.readAsText(fileBase, `picsa/${filename}`);
      console.log("file read", fileTxt);
      return fileTxt;
    } catch (error) {
      console.error("could not read file", error);
      return null;
    }
  }

  async openFileCordova(filePath) {
    const mimetype = this._getMimetype(filePath);
    this.fileOpener.open(filePath, mimetype);
  }

  _getMimetype(filename: string) {
    const fileNameSplit = filename.split(".");
    const extension: string = fileNameSplit[fileNameSplit.length - 1];
    return mimetypes[extension];
  }
}
