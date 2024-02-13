import { CommonModule } from '@angular/common';
import { Component, Directive, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';

import { IStorageEntry } from '../../services/supabase-storage.service';
import { SupabaseService } from '../../supabase.service';

/**
 * Directive that can be added to any component to launch storage file picker component
 * ```
 *  <button mat-button supabaseStoragePicker storageBucketName='resources' >Pick File</button>
 * ```
 */
@Directive({
  selector: '[supabaseStoragePicker]',
  standalone: true,
})
export class SupabaseStoragePickerDirective {
  @Input() storageBucketName = 'default';
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

  constructor(private dialog: MatDialog) {}
}

@Component({
  selector: 'picsa-supabase-storage-file-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatListModule],
  templateUrl: './storage-file-picker.component.html',
  styleUrls: ['./storage-file-picker.component.scss'],
})
export class SupabaseStorageFilePickerComponent {
  @Output() fileSelected = new EventEmitter<IStorageEntry | undefined>();
  @Input() storageBucketName = 'default';
  @Input() storageFolderPath?: string;

  public fileEntries: IStorageEntry[] = [];

  public selected: IStorageEntry[] = [];

  public previewUrl: string;

  constructor(private supabaseService: SupabaseService) {}

  private get storage() {
    return this.supabaseService.storage;
  }

  async ngOnInit() {
    await this.supabaseService.ready();
    const entries = await this.storage.list(this.storageBucketName, this.storageFolderPath);
    this.fileEntries = entries
      // filter out metadata files which have filename starting with `.`
      .filter((storageEntry) => storageEntry.name && !storageEntry.name.split('/').pop()?.startsWith('.'))
      .sort((a, b) => {
        if (!b.name) return 1;
        if (!a.name) return -1;
        return a.name > b.name ? 1 : -1;
      });
  }
  public compareFn(a: IStorageEntry, b: IStorageEntry) {
    return a.id === b.id;
  }

  public handleFileSelect() {
    const [entry] = this.selected;
    if (this.selected) {
      this.previewUrl = this.storage.getPublicLink(this.storageBucketName, entry.name as string);
    }
  }
}
