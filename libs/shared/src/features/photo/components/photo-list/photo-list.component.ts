import { Component, computed, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PicsaTranslateModule } from '@picsa/i18n';

import { PhotoService } from '../../photo.service';
import { PhotoViewComponent } from '../photo-view/photo-view.component';

@Component({
  selector: 'picsa-photo-list',
  imports: [MatButtonModule, MatIconModule, PhotoViewComponent, PicsaTranslateModule],
  templateUrl: './photo-list.component.html',
  styleUrl: './photo-list.component.scss',
})
export class PhotoListComponent {
  private service = inject(PhotoService);

  album = input<string>();
  selectionMode = signal(false);
  selectedPhotoIds = signal<string[]>([]);

  photos = computed(() => {
    const album = this.album();
    const photoDocs = this.service.photos();
    return album ? photoDocs.filter((d) => d.album === album) : photoDocs;
  });

  selectedCount = computed(() => this.selectedPhotoIds().length);

  isSelected(photoId: string) {
    return this.selectedPhotoIds().includes(photoId);
  }

  enableSelection() {
    this.selectionMode.set(true);
  }

  cancelSelection() {
    this.selectionMode.set(false);
    this.selectedPhotoIds.set([]);
  }

  toggleSelected(photoId: string) {
    const selectedIds = this.selectedPhotoIds();
    const nextSelectedIds = selectedIds.includes(photoId)
      ? selectedIds.filter((id) => id !== photoId)
      : [...selectedIds, photoId];
    this.selectedPhotoIds.set(nextSelectedIds);

    if (nextSelectedIds.length === 0) {
      this.selectionMode.set(false);
    }
  }

  async shareSelected() {
    const selectedIds = this.selectedPhotoIds();
    if (!selectedIds.length) return;
    const didShare = await this.service.sharePhotos(selectedIds);
    if (didShare) {
      this.cancelSelection();
    }
  }
}
