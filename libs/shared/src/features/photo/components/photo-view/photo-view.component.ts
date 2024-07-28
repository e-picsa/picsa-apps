import { Component, effect, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { PicsaDialogService } from '../../../dialog';
import { PhotoService } from '../../photo.service';
import { IPhotoEntry } from '../../schema';

@Component({
  selector: 'picsa-photo-view',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './photo-view.component.html',
  styleUrl: './photo-view.component.scss',
})
export class PhotoViewComponent {
  /** Input photo document ref */
  photo = input.required<IPhotoEntry>();
  /** Path to resource for render */
  uri = signal('');
  /** Error message to display */
  errorMsg = signal('');

  constructor(private service: PhotoService, private dialog: PicsaDialogService) {
    effect(
      async (onCleanup) => {
        const photo = this.photo();
        const uri = await this.service.getPhotoAttachment(photo.id);
        if (uri) {
          this.uri.set(uri);
        } else {
          console.error('[Photo] not found', this.photo());
          this.errorMsg.set(`Photo not found`);
        }
        onCleanup(() => {
          this.service.revokePhotoAttachment(photo.id);
        });
      },
      { allowSignalWrites: true }
    );
  }

  public async promptDelete() {
    const dialogRef = await this.dialog.open('delete');
    dialogRef.afterClosed().subscribe(async (shouldDelete) => {
      if (shouldDelete) {
        await this.service.deletePhoto(this.photo().id);
      }
    });
  }
}
