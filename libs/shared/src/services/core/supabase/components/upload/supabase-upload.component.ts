import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';

import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ENVIRONMENT } from '@picsa/environments';
import { UppyAngularDashboardModule } from '@uppy/angular';
import Uppy, { InternalMetadata, UploadResult, UppyFile, UppyOptions } from '@uppy/core';
import { DashboardOptions } from '@uppy/dashboard';
import Tus from '@uppy/tus';

import { PicsaNotificationService } from '../../../notification.service';
import { IStorageEntrySDK, SupabaseStorageService } from '../../services/supabase-storage.service';
import { SupabaseService } from '../../supabase.service';

/** Metadata populated to uploads so that supabase can process correctly */
interface IUploadMeta extends InternalMetadata {
  bucketName: string;
  cacheControl: number;
  contentType?: string;
  objectName: string;
}

/** Storage entry data returned following upload */
export interface IUploadResult {
  data: File | Blob;
  entry: IStorageEntrySDK;
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
  standalone: true,
  imports: [
    CommonModule,
    UppyAngularDashboardModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
  ],
  templateUrl: './supabase-upload.component.html',
  styleUrls: ['./supabase-upload.component.scss'],
})
export class SupabaseUploadComponent {
  /** Default height of file dropper */
  @Input() fileDropHeight = 300;

  /** Name of storage bucket for upload. Must already exist with required access permissions */
  @Input() storageBucketName = 'default';

  /** Nested folder path within storage bucket */
  @Input() storageFolderPath = '';

  /** Specify if storage folder path can be manually edited */
  @Input() storageFolderPathEditable = false;

  @Input() autoUpload = false;

  @Input() set disabled(disabled: boolean) {
    // Update options through plugin interface for better change detection
    this.dashboardOptions = { ...this.dashboardOptions, disabled };
  }
  /**
   * Specify input file type. Must correspond to unique file type specifiers
   * https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file#unique_file_type_specifiers
   */
  @Input() set fileTypes(filetypes: string[]) {
    this.setFileTypeRestrictions(filetypes);
  }

  @Output() uploadComplete = new EventEmitter<IUploadResult[]>();

  public uppy: Uppy;

  public dashboardOptions: DashboardOptions = {
    proudlyDisplayPoweredByUppy: false,
    hideUploadButton: true,
  };

  private uppyOptions: UppyOptions = {
    debug: false,
    autoProceed: false,
    restrictions: { maxNumberOfFiles: 1 },
  };

  private storageService: SupabaseStorageService;

  constructor(private supabaseService: SupabaseService, private notificationService: PicsaNotificationService) {}

  async ngOnInit() {
    await this.supabaseService.ready();
    this.storageService = this.supabaseService.storage;
    this.initUppy();
  }

  private async initUppy() {
    // Create new Uppy instance, mapping configurable props
    this.uppy = new Uppy(this.uppyOptions);
    this.dashboardOptions.height = this.fileDropHeight;
    // Create custom upload to support upload to supabase
    await this.registerSupabaseUppyUploader();
  }

  public async startUpload() {
    // remove duplicates
    for (const file of this.uppy.getFiles()) {
      const objectName = this.storageFolderPath ? `${this.storageFolderPath}/${file.name}` : file.name;
      const meta: IUploadMeta = {
        ...file.meta,
        contentType: file.type,
        bucketName: this.storageBucketName,
        objectName,
        cacheControl: 3600,
      };
      this.uppy.setFileMeta(file.id, meta as Record<string, any>);
      await this.checkDuplicateUpload(file);
    }
    const res = await this.uppy.upload();
    await this.handleUploadComplete(res);
    this.storageFolderPath = '';
  }

  private async handleUploadComplete(res: UploadResult) {
    const uploads = await Promise.all(
      res.successful.map(async (res) => {
        const meta: IUploadMeta = res.meta as any;
        // HACK - manually retrieve db data associated with file. In future this may be handled automatically
        // https://github.com/orgs/supabase/discussions/4303
        const entry = await this.storageService.getFile({
          bucketId: meta.bucketName,
          filename: meta.name,
          folderPath: meta.objectName.split('/').slice(0, -1).join('/'),
        });
        if (!entry) {
          console.warn('Storage entry not found', meta);
          throw new Error(`Storage entry not found`);
        }
        return { data: res.data, entry };
      })
    );
    this.uploadComplete.next(uploads);
  }

  private async registerSupabaseUppyUploader() {
    const { anonKey, apiUrl } = await ENVIRONMENT.supabase.load();
    this.uppy.use(Tus, {
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
    this.uppy.on('file-added', (file) => this.handleFileAdded());
  }
  private handleFileAdded() {
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
    if (this.uppy) {
      this.uppy.setOptions(this.uppyOptions);
    }
  }

  private async checkDuplicateUpload(file: UppyFile) {
    const storageFile = await this.storageService.getFile({
      bucketId: 'resources',
      filename: file.name,
      folderPath: this.storageFolderPath || '',
    });
    if (storageFile) {
      this.notificationService.showUserNotification({
        matIcon: 'error',
        message: `Resource with name ${file.name} already exists`,
      });
      this.uppy.removeFile(file.id);
    }
  }
}
