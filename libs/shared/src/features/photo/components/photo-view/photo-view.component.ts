import { Component, effect, Input, signal, TemplateRef, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Capacitor } from '@capacitor/core';

import { PicsaDialogService } from '../../../dialog';
import { PhotoService } from '../../photo.service';
import { IPhotoEntry } from '../../schema';

@Component({
  selector: 'picsa-photo-view',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatDialogModule],
  templateUrl: './photo-view.component.html',
  styleUrls: ['./photo-view.component.scss'],
})
export class PhotoViewComponent {
  /** Input photo document ref */
  @Input() photo!: IPhotoEntry;
  /** Path to resource for render */
  uri = signal('');
  /** Error message to display */
  errorMsg = signal('');

  @ViewChild('dialogTemplate') dialogTemplate!: TemplateRef<any>;

  constructor(private service: PhotoService, private dialog: PicsaDialogService, public photoDialog: MatDialog) {
    effect(
      async (onCleanup) => {
        const photo = this.photo;
        const uri = await this.service.getPhotoAttachment(photo.id);
        if (uri) {
          this.uri.set(uri);
        } else {
          console.error('[Photo] not found', this.photo);
          this.errorMsg.set(`Photo not found`);
        }
        onCleanup(() => {
          this.service.revokePhotoAttachment(photo.id);
        });
      },
      { allowSignalWrites: true }
    );
  }

  openPhotoDialog() {
    const isMobilePlatform = Capacitor.getPlatform() === 'ios' || Capacitor.getPlatform() === 'android';
    this.photoDialog.open(this.dialogTemplate, {
      data: { photo: this.photo, uri: this.uri() },
      width: isMobilePlatform ? '100%' : 'auto',
      height: isMobilePlatform ? '100%' : 'auto',
      maxHeight: '100%',
      maxWidth: '100%',
      panelClass: 'photo-dialog',
    });
  }

  public async promptDelete() {
    const dialogRef = await this.dialog.open('delete');
    dialogRef.afterClosed().subscribe(async (shouldDelete) => {
      if (shouldDelete) {
        await this.service.deletePhoto(this.photo.id);
        this.photoDialog.closeAll();
      }
    });
  }
}
