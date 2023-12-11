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
import { SupabaseService } from '@picsa/shared/services/core/supabase';
import { UppyAngularDashboardModule } from '@uppy/angular';
import Uppy, { InternalMetadata, UploadResult, UppyFile } from '@uppy/core';
import { DashboardOptions } from '@uppy/dashboard';
import Tus from '@uppy/tus';

import { PicsaNotificationService } from '../../notification.service';
import { SupabaseStorageService } from '../services/supabase-storage.service';

interface IUploadMeta extends InternalMetadata {
  bucketName: string;
  cacheControl: number;
  contentType?: string;
  objectName: string;
  /** Url generated when upload to public bucket (will always be populated, even if bucket not public) */
  publicUrl?: string;
}
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

  @Output() uploadComplete = new EventEmitter<IUploadResult[]>();

  public uploadDisabled = true;

  public uppy: Uppy;

  public uppyOptions: DashboardOptions = {
    proudlyDisplayPoweredByUppy: false,
    hideUploadButton: true,
  };

  private storageService: SupabaseStorageService;

  constructor(supabaseService: SupabaseService, private notificationService: PicsaNotificationService) {
    supabaseService.ready().then(() => {
      this.storageService = supabaseService.storage;
    });
  }
  ngOnInit(): void {
    this.initialise();
  }

  private initialise() {
    // Create new Uppy instance, mapping configurable props
    this.uppy = new Uppy({
      debug: false,
      autoProceed: false,
      restrictions: { maxNumberOfFiles: 1 },
    });
    this.uppyOptions.height = this.fileDropHeight;
    // Create custom upload to support upload to supabase
    this.registerSupabaseUppyUploader();
  }

  public async startUpload() {
    this.uploadDisabled = true;
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
    this.handleUploadComplete(res);
    this.uploadDisabled = false;
    this.storageFolderPath = '';
  }

  private handleUploadComplete(res: UploadResult) {
    console.log('upload res', res);
    const uploads = res.successful.map((res) => {
      const meta: IUploadMeta = res.meta as any;
      meta.publicUrl = this.storageService.getPublicLink(meta.bucketName, meta.objectName);
      return { data: res.data, meta: meta };
    });
    this.uploadComplete.next(uploads);
  }

  private registerSupabaseUppyUploader() {
    const { anonKey, apiUrl } = ENVIRONMENT.supabase;
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
    this.uploadDisabled = false;
    if (this.autoUpload) {
      this.startUpload();
    }
  }

  private async checkDuplicateUpload(file: UppyFile) {
    this.uploadDisabled = true;
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
