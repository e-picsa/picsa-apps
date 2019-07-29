import { Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { IPicsaLoaders } from '../loading/loading';
import { PicsaDialogComponent } from './components/dialog';

@Injectable({
  providedIn: 'root'
})
export class PicsaDialogService {
  constructor(private dialog: MatDialog) {}

  /**********************************************************************
   *  Public Methods
   ***********************************************************************/

  async open(data?: IPicsaDialogData, config?: MatDialogConfig) {
    // make default loaders available to all dialogs
    const dialogRef = this.dialog.open(PicsaDialogComponent, {
      // merge default with custom data and additional config
      ...PICSA_DIALOG_DEFAULTS,
      data: { ...data },
      ...config
    });
    await dialogRef.afterOpened();
    dialogRef.beforeClose().subscribe(() => console.log('dialog closing'));
    dialogRef.afterClosed().subscribe(() => console.log('dialog closed'));
    return dialogRef;
  }
  closeAll() {
    console.log('closing all', this.dialog.openDialogs);
    return this.dialog.closeAll();
  }
}

const PICSA_DIALOG_DEFAULTS: MatDialogConfig = {
  closeOnNavigation: true,
  hasBackdrop: true,
  disableClose: true,
  data: {},
  height: '250px',
  width: '250px'
};

export interface IPicsaDialogData {
  title?: string;
  html?: string;
  loader?: IPicsaLoaders;
}
