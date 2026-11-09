import {
  ChangeDetectionStrategy,
  Component,
  computed,
  Directive,
  HostListener,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatTabsModule } from '@angular/material/tabs';
import { PicsaFallbackImageComponent } from '@picsa/components/fallback-image/fallback-image.component';
import { FallbackImageType } from '@picsa/components/fallback-image/fallback-image.types';

import { IStorageEntry } from '../../services/supabase-storage.service';
import { SupabaseService } from '../../supabase.service';

/** Data passed to the picker dialog (preferred over post-open assignment) */
export interface IStoragePickerData {
  storageBucketName?: string;
  storageFolderPath?: string;
}

const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif'];

/** Map a storage filename to the closest fallback image preset */
export function getEntryFallbackType(name?: string | null): FallbackImageType {
  const ext = name?.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return 'pdf';
    case 'mp4':
    case 'mov':
    case 'webm':
      return 'video';
    case 'mp3':
    case 'wav':
    case 'ogg':
      return 'audio';
    default:
      return ext && IMAGE_EXTENSIONS.includes(ext) ? 'image' : 'document';
  }
}

/**
 * Directive that can be added to any component to launch storage file picker component
 * ```
 *  <button matButton supabaseStoragePicker storageBucketName='mw' >Pick File</button>
 * ```
 */
@Directive({
  selector: '[supabaseStoragePicker]',
})
export class SupabaseStoragePickerDirective {
  private dialog = inject(MatDialog);

  readonly storageBucketName = input<string | undefined>(undefined);
  readonly storageFolderPath = input<string | undefined>(undefined);
  readonly storageFileSelected = output<IStorageEntry | undefined>();

  @HostListener('click') pickerOpen() {
    // Pass inputs via dialog data so they are set before the dialog's first change detection.
    // Assigning componentInstance inputs after open() flips template state mid-cycle (NG0100).
    const dialogRef = this.dialog.open(SupabaseStorageFilePickerComponent, {
      data: {
        storageBucketName: this.storageBucketName(),
        storageFolderPath: this.storageFolderPath(),
      } as IStoragePickerData,
    });
    dialogRef.componentInstance.fileSelected.subscribe((entry) => {
      dialogRef.close();
      this.storageFileSelected.emit(entry);
    });
  }
}

@Component({
  selector: 'picsa-supabase-storage-file-picker',
  imports: [FormsModule, MatButtonModule, MatListModule, MatTabsModule, PicsaFallbackImageComponent],
  templateUrl: './storage-file-picker.component.html',
  styleUrls: ['./storage-file-picker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupabaseStorageFilePickerComponent {
  private supabaseService = inject(SupabaseService);
  private dialogData = inject<IStoragePickerData>(MAT_DIALOG_DATA, { optional: true });

  readonly fileSelected = output<IStorageEntry | undefined>();
  readonly storageBucketName = input<string | undefined>(this.dialogData?.storageBucketName);
  readonly storageFolderPath = input<string | undefined>(this.dialogData?.storageFolderPath);

  /** List of storage entries found within global folder path */
  readonly globalEntries = signal<IStorageEntry[]>([]);

  /** List of storage entries found withing named bucket folder path */
  readonly bucketEntries = signal<IStorageEntry[]>([]);

  readonly selected = signal<IStorageEntry[]>([]);

  /** Currently selected entry, if any */
  readonly previewEntry = computed(() => this.selected()[0]);

  /** Direct image preview for image files, otherwise the fallback preset renders */
  readonly previewSrc = computed(() => {
    const entry = this.previewEntry();
    if (!entry || !entry.name || !IMAGE_EXTENSIONS.includes(entry.name.split('.').pop()?.toLowerCase() ?? '')) {
      return undefined;
    }
    return this.storage.getPublicLink(entry.bucket_id as string, entry.name);
  });

  /** Fallback preset derived from the selected entry filename */
  readonly previewFallbackType = computed<FallbackImageType>(() => getEntryFallbackType(this.previewEntry()?.name));

  private get storage() {
    return this.supabaseService.storage;
  }

  async ngOnInit() {
    await this.supabaseService.ready();
    // Merge both global and storage bucket specific path entries
    const globalEntries = await this.storage.list('global', this.storageFolderPath());
    this.globalEntries.set(this.prepareEntries(globalEntries));
    const bucketName = this.storageBucketName();
    if (bucketName) {
      const bucketEntries = await this.storage.list(bucketName, this.storageFolderPath());
      this.bucketEntries.set(this.prepareEntries(bucketEntries));
    }
  }

  private prepareEntries(entries: IStorageEntry[]) {
    return (
      entries
        // filter out metadata files which have filename starting with `.`
        .filter((entry) => entry?.name && !entry.name.split('/').pop()?.startsWith('.'))
        .sort((a, b) => {
          if (!b.name) return 1;
          if (!a.name) return -1;
          return a.name > b.name ? 1 : -1;
        })
    );
  }

  public compareFn(a: IStorageEntry, b: IStorageEntry) {
    return a.name === b.name;
  }
}
