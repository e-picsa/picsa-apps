import { ChangeDetectionStrategy, Component, computed, forwardRef, input, output, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  IUploadResult,
  StoragePathPipe,
  SupabaseStoragePickerDirective,
  SupabaseUploadComponent,
} from '@picsa/shared/services/core/supabase';
import { IStorageEntry } from '@picsa/shared/services/core/supabase/services/supabase-storage.service';

import { DashboardStorageLinkComponent } from '../storage-link/storage-link.component';

export interface IStorageUploadFileMeta {
  storagePath: string;
  filename?: string;
  mimetype?: string;
  size_kb?: number;
}

@Component({
  selector: 'dashboard-storage-upload',
  imports: [
    DashboardStorageLinkComponent,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    StoragePathPipe,
    SupabaseStoragePickerDirective,
    SupabaseUploadComponent,
  ],
  templateUrl: './storage-upload.component.html',
  styleUrl: './storage-upload.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DashboardStorageUploadComponent),
      multi: true,
    },
  ],
})
export class DashboardStorageUploadComponent implements ControlValueAccessor {
  public label = input<string>('');
  public fileTypes = input<string[]>([]);
  public fileDropHeight = input<number>(128);
  public storageBucketName = input<string | undefined>(undefined);
  public storageFolderPath = input<string>('uploads');
  public showImagePreview = input<boolean>(false);
  public autoUpload = input<boolean>(true);
  public disabled = input<boolean>(false);

  public fileMetadata = output<IStorageUploadFileMeta | undefined>();

  public value = signal<string>('');
  private controlDisabled = signal<boolean>(false);
  public isDisabled = computed(() => this.disabled() || this.controlDisabled());

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(val: string | null | undefined): void {
    this.value.set(val || '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.controlDisabled.set(isDisabled);
  }

  public handleUploadComplete(res: IUploadResult[]) {
    if (res.length === 0) return;
    const [{ meta, data }] = res;
    const storagePath = `${meta.bucketName}/${meta.objectName}`;
    const file = data as File;
    this.updateValue(storagePath, {
      storagePath,
      filename: file?.name,
      mimetype: file?.type,
      size_kb: typeof file?.size === 'number' ? Math.round(file.size / 1024) : undefined,
    });
  }

  public handleStorageFileSelected(entry: IStorageEntry | undefined) {
    if (!entry) return;
    const storagePath = `${entry.bucket_id}/${entry.name}`;
    const size = entry.metadata?.['size'];
    const mimetype = entry.metadata?.['mimetype'];
    this.updateValue(storagePath, {
      storagePath,
      filename: storagePath.split('/').pop(),
      mimetype: typeof mimetype === 'string' ? mimetype : undefined,
      size_kb: typeof size === 'number' ? Math.round(size / 1024) : undefined,
    });
  }

  public clearValue() {
    this.updateValue('', undefined);
  }

  private updateValue(storagePath: string, metadata: IStorageUploadFileMeta | undefined) {
    this.value.set(storagePath);
    this.onChange(storagePath);
    this.onTouched();
    this.fileMetadata.emit(metadata);
  }
}
