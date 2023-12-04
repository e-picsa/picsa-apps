import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';

import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ENVIRONMENT } from '@picsa/environments';
import { SupabaseService } from '@picsa/shared/services/core/supabase';
import { UppyAngularDashboardModule } from '@uppy/angular';
import Uppy, { UppyFile } from '@uppy/core';
import { DashboardOptions } from '@uppy/dashboard';
import Tus from '@uppy/tus';
import { SupabaseStorageService } from '../storage/supabase-storage.service';
import { PicsaNotificationService } from '../../notification.service';

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
  imports: [CommonModule, UppyAngularDashboardModule, MatIconModule, MatButtonModule],
  templateUrl: './supabase-upload.component.html',
  styleUrls: ['./supabase-upload.component.scss'],
})
export class SupabaseUploadComponent {
  public uploadDisabled = true;

  public uppy: Uppy = new Uppy({
    debug: true,
    autoProceed: false,
    restrictions: { maxNumberOfFiles: 1 },
    // TODO - check in advance for file conflicts
    onBeforeUpload: (files) => {
      return files;
    },
  });

  public uppyOptions: DashboardOptions = {
    proudlyDisplayPoweredByUppy: false,
    hideUploadButton: true,
    height: 320,
  };

  private storageService: SupabaseStorageService;

  constructor(supabaseService: SupabaseService, private notificationService: PicsaNotificationService) {
    this.addUppyUploader();
    supabaseService.ready().then(() => {
      this.storageService = supabaseService.storage;
    });
  }

  public async startUpload() {
    this.uploadDisabled = true;
    const res = await this.uppy.upload();
    this.uploadDisabled = false;
  }

  private addUppyUploader() {
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
    this.uppy.on('file-added', (file) => {
      file.meta = {
        ...file.meta,
        contentType: file.type,
        bucketName: 'resources',
        objectName: file.name,
        cacheControl: 3600,
      };
      this.checkDuplicateUpload(file);
    });
  }

  private async checkDuplicateUpload(file: UppyFile) {
    this.uploadDisabled = true;
    const storageFile = await this.storageService.getFile({ bucketId: 'resources', filename: file.name });
    if (storageFile) {
      this.notificationService.showUserNotification({
        matIcon: 'error',
        message: `Resource with name ${file.name} already exists`,
      });
      this.uppy.removeFile(file.id);
    }
    this.uploadDisabled = false;
  }
}
