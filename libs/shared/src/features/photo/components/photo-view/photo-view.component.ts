import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, effect, Input, signal, TemplateRef,ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

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
  isMobile = signal(false);

  @ViewChild('dialogTemplate') dialogTemplate!: TemplateRef<any>;

  constructor(
    private service: PhotoService,
    private dialog: PicsaDialogService,
    public photoDialog: MatDialog,
    private breakpointObserver: BreakpointObserver
  ) {
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

    this.breakpointObserver.observe([Breakpoints.Handset]).subscribe((result) => {
      this.isMobile.set(result.matches);
    });
  }

  openPhotoDialog() {
    this.photoDialog.open(this.dialogTemplate, {
      data: { photo: this.photo, uri: this.uri() },
      panelClass: this.isMobile() ? 'full-screen-dialog' : '',
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
