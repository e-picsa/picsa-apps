import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  model,
  OnDestroy,
  OnInit,
  output,
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
  [key: string]: unknown;
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
  readonly fileDropHeight = input(300);

  /** Name of storage bucket for upload. Must already exist with required access permissions */
  readonly storageBucketName = model('global');

  /** Nested folder path within storage bucket (two-way: editable via path editor) */
  readonly storageFolderPath = model('uploads');

  /** Specify if storage folder path can be manually edited */
  readonly storageFolderPathEditable = input(false);

  readonly autoUpload = input(false);

  readonly hideUploadButton = input(false);

  /**
   * Maximum file size in MB.
   * Must match backend storage limit (supabase `config.toml` `file_size_limit = "50MiB"`).
   * Enforced client-side via Uppy restrictions for immediate feedback.
   */
  readonly maxFileSizeMB = input(50);

  readonly disabled = input(false);

  /**
   * Specify input file type. Must correspond to unique file type specifiers
   * https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file#unique_file_type_specifiers
   */
  readonly fileTypes = input<string[] | undefined>(undefined);

  readonly uploadComplete = output<IUploadResult[]>();
  readonly fileChanged = output<FileDropFile | undefined>();

  /** Uppy instance, populated asynchronously once supabase is ready */
  readonly uppy = signal<Uppy | undefined>(undefined);

  private restrictions = computed<NonNullable<UppyOptions['restrictions']>>(() => ({
    maxNumberOfFiles: 1,
    ...(this.fileTypes() ? { allowedFileTypes: this.fileTypes() } : {}),
    maxFileSize: this.maxFileSizeMB() ? this.maxFileSizeMB() * 1024 * 1024 : null,
  }));

  readonly dashboardOptions = computed<DashboardOptions>(() => ({
    proudlyDisplayPoweredByUppy: false,
    hideUploadButton: true,
    height: this.fileDropHeight(),
    disabled: this.disabled(),
  }));

  /** Access files currently loaded into uppy uploader */
  public get files() {
    return this.uppy()?.getFiles() ?? [];
  }

  private storageService: SupabaseStorageService;
  private isDestroyed = false;

  constructor() {
    // Apply restriction changes to a live Uppy instance
    effect(() => {
      this.uppy()?.setOptions({ restrictions: this.restrictions() });
    });
  }

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
      const objectName = `${this.storageFolderPath()}/${newName}`;
      uppy.setFileState(id, { name: newName });
      uppy.setFileMeta(id, { ...meta, name: newName, objectName });
    }
  }

  private initUppy() {
    // Create new Uppy instance, mapping configurable props
    const uppy = new Uppy({ debug: false, autoProceed: false, restrictions: this.restrictions() });
    // Create custom upload to support upload to supabase
    this.registerSupabaseUppyUploader(uppy);
    this.uppy.set(uppy);
  }

  public async startUpload() {
    const uppy = this.uppy();
    if (!uppy) {
      throw new Error('Uploader not initialised');
    }
    // remove duplicates
    for (const file of this.files) {
      const folderPath = this.storageFolderPath();
      const objectName = folderPath ? `${folderPath}/${file.name}` : file.name;
      const meta: IUploadMeta = {
        ...file.meta,
        contentType: file.type,
        bucketName: this.storageBucketName(),
        objectName,
        cacheControl: 3600,
      };
      uppy.setFileMeta(file.id, meta);
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
        const meta = res.meta as unknown as IUploadMeta;

        const result: IUploadResult = { data, meta };
        return result;
      }),
    );
    this.uploadComplete.emit(uploads);
  }

  public async getTusAuthHeaders(): Promise<{ authorization: string; apikey: string }> {
    const { anonKey } = this.supabaseService.config;
    const { auth } = await this.supabaseService.auth.getClient;
    const {
      data: { session },
    } = await auth.getSession();
    const token = session?.access_token ?? anonKey;
    return {
      authorization: `Bearer ${token}`,
      apikey: anonKey,
    };
  }

  private registerSupabaseUppyUploader(uppy: Uppy) {
    const { anonKey, apiUrl } = this.supabaseService.config;
    uppy.use(Tus, {
      endpoint: `${apiUrl}/storage/v1/upload/resumable`,
      headers: {
        apikey: anonKey,
      },
      onBeforeRequest: async (req) => {
        const { authorization, apikey } = await this.getTusAuthHeaders();
        req.setHeader('authorization', authorization);
        req.setHeader('apikey', apikey);
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
    uppy.on('file-removed', () => this.fileChanged.emit(this.files[0]));
  }

  private handleFileAdded() {
    this.fileChanged.emit(this.files[0]);
    if (this.autoUpload()) {
      this.startUpload();
    }
  }

  private async checkDuplicateUpload(uppy: Uppy, file: UppyFile) {
    let storagePath = `${this.storageBucketName()}`;
    const folderPath = this.storageFolderPath();
    if (folderPath) {
      storagePath += `/${folderPath}`;
    }
    storagePath += `/${file.name}`;
    const storageFile = await this.storageService.getFile(storagePath);
    if (storageFile) {
      uppy.removeFile(file.id);
      throw new Error(`Resource with name ${file.name} already exists`);
    }
  }
}
