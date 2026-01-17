import { Component, Directive, EventEmitter, HostListener, inject,Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatTabsModule } from '@angular/material/tabs';

import { IStorageEntry } from '../../services/supabase-storage.service';
import { SupabaseService } from '../../supabase.service';

/**
 * Directive that can be added to any component to launch storage file picker component
 * ```
 *  <button mat-button supabaseStoragePicker storageBucketName='mw' >Pick File</button>
 * ```
 */
@Directive({
  selector: '[supabaseStoragePicker]',
  standalone: true,
})
export class SupabaseStoragePickerDirective {
  private dialog = inject(MatDialog);

  @Input() storageBucketName?: string;
  @Input() storageFolderPath?: string;
  @Output() storageFileSelected = new EventEmitter<IStorageEntry | undefined>();

  @HostListener('click') pickerOpen() {
    const dialogRef = this.dialog.open(SupabaseStorageFilePickerComponent, {});
    const { componentInstance } = dialogRef;
    componentInstance.storageBucketName = this.storageBucketName;
    componentInstance.storageFolderPath = this.storageFolderPath;
    componentInstance.fileSelected.subscribe((entry) => {
      dialogRef.close();
      this.storageFileSelected.next(entry);
    });
  }
}

@Component({
  selector: 'picsa-supabase-storage-file-picker',
  imports: [FormsModule, MatButtonModule, MatListModule, MatTabsModule],
  templateUrl: './storage-file-picker.component.html',
  styleUrls: ['./storage-file-picker.component.scss'],
})
export class SupabaseStorageFilePickerComponent {
  private supabaseService = inject(SupabaseService);

  @Output() fileSelected = new EventEmitter<IStorageEntry | undefined>();
  @Input() storageBucketName?: string;
  @Input() storageFolderPath?: string;

  /** List of storage entries found within global folder path */
  public globalEntries: IStorageEntry[] = [];

  /** List of storage entries found withing named bucket folder path */
  public bucketEntries: IStorageEntry[] = [];

  public selected: IStorageEntry[] = [];

  public previewUrl: string;

  private get storage() {
    return this.supabaseService.storage;
  }

  async ngOnInit() {
    await this.supabaseService.ready();
    // Merge both global and storage bucket specific path entries
    const globalEntries = await this.storage.list('global', this.storageFolderPath);
    this.globalEntries = this.prepareEntries(globalEntries);
    if (this.storageBucketName) {
      const bucketEntries = await this.storage.list(this.storageBucketName, this.storageFolderPath);
      this.bucketEntries = this.prepareEntries(bucketEntries);
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

  public handleFileSelect() {
    const [entry] = this.selected;
    if (this.selected) {
      this.previewUrl = this.storage.getPublicLink(entry.bucket_id as string, entry.name as string);
    }
  }
}
