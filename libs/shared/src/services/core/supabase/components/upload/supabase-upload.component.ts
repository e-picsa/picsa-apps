import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { UppyAngularDashboardModule } from '@uppy/angular';
import Uppy, { InternalMetadata, UploadResult, UppyFile, UppyOptions } from '@uppy/core';
import { DashboardOptions } from '@uppy/dashboard';
import Tus from '@uppy/tus';

import { SupabaseStorageService } from '../../services/supabase-storage.service';
import { SupabaseService } from '../../supabase.service';

export type FileDropFile = UppyFile;

/** Metadata populated to uploads so that supabase can process correctly */
interface IUploadMeta extends InternalMetadata {
  /** Name of bucket object stored in */
  bucketName: string;
  cacheControl: number;
  contentType?: string;
  /** Path to object within bucket */
  objectName: string;
}

/** Storage entry data returned following upload */
export interface IUploadResult {
  data: File | Blob;
  meta: IUploadMeta;
}

/**
 * Supabase storage uploader built on top of Uppy dashboard, with support for resumable uploads
 *
 * https://supabase.com/docs/guides/storage/uploads/resumable-uploads
 * https://uppy.io/docs/tus/
 * https://tus.io/
 *
 */
@Component({
  selector: 'picsa-supabase-upload',
  imports: [
    UppyAngularDashboardModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
  ],
  templateUrl: './supabase-upload.component.html',
  styleUrls: ['./supabase-upload.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupabaseUploadComponent implements OnInit, OnDestroy {
  private supabaseService = inject(SupabaseService);

  /** Default height of file dropper */
  @Input() set fileDropHeight(height: number) {
    this._fileDropHeight = height;
    this.dashboardOptions.update((opts) => ({ ...opts, height }));
  }
  get fileDropHeight(): number {
    return this._fileDropHeight;
  }
  private _fileDropHeight = 300;

  /** Name of storage bucket for upload. Must already exist with required access permissions */
  @Input() storageBucketName = 'global';

  /** Nested folder path within storage bucket */
  @Input() storageFolderPath = 'uploads';

  /** Specify if storage folder path can be manually edited */
  @Input() storageFolderPathEditable = false;

  @Input() autoUpload = false;

  @Input() hideUploadButton = false;

  @Input() set disabled(disabled: boolean) {
    // Update options through signal for zoneless/OnPush change detection
    this.dashboardOptions.update((opts) => ({ ...opts, disabled }));
  }
  /**
   * Specify input file type. Must correspond to unique file type specifiers
   * https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file#unique_file_type_specifiers
   */
  @Input() set fileTypes(filetypes: string[]) {
    this.setFileTypeRestrictions(filetypes);
  }

  @Output() uploadComplete = new EventEmitter<IUploadResult[]>();
  @Output() fileChanged = new EventEmitter<FileDropFile | undefined>();

  public uppy = signal<Uppy | undefined>(undefined);

  public dashboardOptions = signal<DashboardOptions>({
    proudlyDisplayPoweredByUppy: false,
    hideUploadButton: true,
    height: 300,
  });

  /** Access files currently loaded into uppy uploader */
  public get files() {
    return this.uppy()?.getFiles() ?? [];
  }

  private uppyOptions: UppyOptions = {
    debug: false,
    autoProceed: false,
    restrictions: { maxNumberOfFiles: 1 },
  };

  private storageService: SupabaseStorageService;
  private isDestroyed = false;

  async ngOnInit() {
    await this.supabaseService.ready();
    if (this.isDestroyed) return;
    this.storageService = this.supabaseService.storage;
    this.initUppy();
  }

  ngOnDestroy() {
    this.isDestroyed = true;
    this.uppy()?.close();
    this.uppy.set(undefined);
  }

  public renameFile(originalName: string, newName: string) {
    const uppy = this.uppy();
    if (!uppy) return;
    const targetFile = this.files.find((f) => f.name === originalName);
    if (targetFile) {
      const { id, meta } = targetFile;
      const objectName = `${this.storageFolderPath}/${newName}`;
      uppy.setFileState(id, { name: newName });
      uppy.setFileMeta(id, { ...meta, name: newName, objectName });
    }
  }

  private initUppy() {
    // Create new Uppy instance, mapping configurable props
    const uppy = new Uppy(this.uppyOptions);
    this.dashboardOptions.update((opts) => ({ ...opts, height: this._fileDropHeight }));
    // Create custom upload to support upload to supabase
    this.registerSupabaseUppyUploader(uppy);
    this.uppy.set(uppy);
  }

  public async startUpload() {
    const uppy = this.uppy();
    if (!uppy) {
      throw new Error('Uploader not initialized');
    }
    // remove duplicates
    for (const file of this.files) {
      const objectName = this.storageFolderPath ? `${this.storageFolderPath}/${file.name}` : file.name;
      const meta: IUploadMeta = {
        ...file.meta,
        contentType: file.type,
        bucketName: this.storageBucketName,
        objectName,
        cacheControl: 3600,
      };
      uppy.setFileMeta(file.id, meta as Record<string, any>);
      await this.checkDuplicateUpload(uppy, file);
    }
    const res = await uppy.upload();
    await this.handleUploadComplete(res);
    return res;
  }

  private async handleUploadComplete(res: UploadResult) {
    const uploads = await Promise.all(
      res.successful.map(async (res) => {
        const data = res.data as File;
        const meta: IUploadMeta = res.meta as any;

        const result: IUploadResult = { data, meta };
        return result;
      }),
    );
    this.uploadComplete.next(uploads);
  }

  private registerSupabaseUppyUploader(uppy: Uppy) {
    const { anonKey, apiUrl } = this.supabaseService.config;
    uppy.use(Tus, {
      endpoint: `${apiUrl}/storage/v1/upload/resumable`,
      headers: {
        authorization: `Bearer ${anonKey}`,
        apikey: anonKey,
      },
      // Retry upload after delay if not working immediately
      retryDelays: [0, 2000, 5000],
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,

      chunkSize: 6 * 1024 * 1024,
      allowedMetaFields: ['bucketName', 'objectName', 'contentType', 'cacheControl'],
      onShouldRetry: (err) => {
        if (err?.message.includes('The resource already exists')) {
          // TODO - notify user
          return false;
        }
        return true;
      },
    });
    // Use file-added hook to update metadata used by supabase for managing file metadata
    // NOTE - additional hooks can also be added to observe upload progress, errors etc.
    uppy.on('file-added', () => this.handleFileAdded());
    uppy.on('file-removed', () => this.fileChanged.next(this.files[0]));
  }

  private handleFileAdded() {
    this.fileChanged.next(this.files[0]);
    if (this.autoUpload) {
      this.startUpload();
    }
  }

  private setFileTypeRestrictions(types: string[]) {
    // Specify options loaded on init
    this.uppyOptions = {
      ...this.uppyOptions,
      restrictions: {
        ...this.uppyOptions.restrictions,
        allowedFileTypes: types,
      },
    };
    // Update options if uppy already initialised
    this.uppy()?.setOptions(this.uppyOptions);
  }

  private async checkDuplicateUpload(uppy: Uppy, file: UppyFile) {
    let storagePath = `${this.storageBucketName}`;
    if (this.storageFolderPath) {
      storagePath += `/${this.storageFolderPath}`;
    }
    storagePath += `/${file.name}`;
    const storageFile = await this.storageService.getFile(storagePath);
    if (storageFile) {
      uppy.removeFile(file.id);
      throw new Error(`Resource with name ${file.name} already exists`);
    }
  }
}
