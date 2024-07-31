/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, effect, input, signal, TemplateRef, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { PicsaTranslateModule } from '../../../../modules/translate';
import { PicsaDialogService } from '../../../dialog';
import { PhotoService } from '../../photo.service';
import { IPhotoEntry } from '../../schema';

@Component({
  selector: 'picsa-photo-view',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatDialogModule, PicsaTranslateModule],
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

  @ViewChild('dialogTemplate') dialogTemplate!: TemplateRef<any>;

  constructor(private service: PhotoService, private dialog: PicsaDialogService, public photoDialog: MatDialog) {
    effect(
      async (onCleanup) => {
        const photo = this.photo;
        const uri = await this.service.getPhotoAttachment(photo().id);
        if (uri) {
          this.uri.set(uri);
        } else {
          console.error('[Photo] not found', this.photo);
          this.errorMsg.set(`Photo not found`);
        }
        onCleanup(() => {
          this.service.revokePhotoAttachment(photo().id);
        });
      },
      { allowSignalWrites: true }
    );
  }

  openPhotoDialog() {
    this.photoDialog.open(this.dialogTemplate, {
      width: '100vw',
      height: '100vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
      panelClass: 'no-padding',
    });
  }

  public async promptDelete() {
    const dialogRef = await this.dialog.open('delete');
    dialogRef.afterClosed().subscribe(async (shouldDelete) => {
      if (shouldDelete) {
        await this.service.deletePhoto(this.photo().id);
        this.photoDialog.closeAll();
      }
    });
  }
}
