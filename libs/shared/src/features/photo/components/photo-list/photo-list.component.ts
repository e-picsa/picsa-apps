import { Component, computed, inject, input, model, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PicsaTranslateModule } from '@picsa/i18n';
import { PicsaTouchGesturesDirective } from '@picsa/shared/directives';

import { PhotoService } from '../../photo.service';
import { IPhotoEntry } from '../../schema';
import { PhotoViewComponent } from '../photo-view/photo-view.component';

@Component({
  selector: 'picsa-photo-list',
  imports: [MatButtonModule, MatIconModule, PhotoViewComponent, PicsaTranslateModule, PicsaTouchGesturesDirective],
  templateUrl: './photo-list.component.html',
  styleUrl: './photo-list.component.scss',
})
export class PhotoListComponent {
  private service = inject(PhotoService);

  album = input.required<string>();

  selectionMode = signal(false);

  selectedPhotos = model<IPhotoEntry[]>([]);

  selectedPhotoIds = computed(() => this.selectedPhotos().map((v) => v.id));

  photos = computed(() => {
    const album = this.album();
    const photoDocs = this.service.photos();
    return album ? photoDocs.filter((d) => d.album === album) : photoDocs;
  });

  selectedCount = computed(() => this.selectedPhotos().length);

  public handlePhotoTap(photo: IPhotoEntry, ref: PhotoViewComponent) {
    if (this.selectionMode()) {
      this.toggleSelected(photo);
    } else {
      ref.openPhotoDialog();
    }
  }

  public handlePhotoLongPress(photo: IPhotoEntry) {
    // Enable selection mode with current photo selected
    if (!this.selectionMode()) {
      this.selectedPhotos.set([photo]);
      this.selectionMode.set(true);
    }
  }

  public async selectAll() {
    this.selectedPhotos.set([...this.photos()]);
    this.selectionMode.set(true);
  }

  public toggleSelected(photo: IPhotoEntry) {
    const current = this.selectedPhotos();
    if (current.some((v) => v.id === photo.id)) {
      this.selectedPhotos.set(current.filter((v) => v.id !== photo.id));
    } else {
      this.selectedPhotos.set([...current, photo]);
    }

    if (this.selectedPhotos().length === 0) {
      this.selectionMode.set(false);
    }
  }
}
