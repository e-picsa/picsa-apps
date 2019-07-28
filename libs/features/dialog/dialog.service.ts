import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PicsaDialogLoading } from './dialogs';
import { IPicsaDialogConfig } from './dialog.models';

@Injectable({
  providedIn: 'root'
})
export class PicsaDialogService {
  constructor(private dialog: MatDialog) {}

  /**********************************************************************
   *  Public Methods
   ***********************************************************************/

  async open(dialog: keyof typeof PICSA_DIALOGS, config: any = {}) {
    // make default loaders available to all dialogs
    const dialogRef = this.dialog.open(
      PICSA_DIALOGS[dialog],
      config as IPicsaDialogConfig
    );
    await dialogRef.afterOpened();
    return dialogRef;
  }
}

const PICSA_DIALOGS = {
  loading: PicsaDialogLoading
};
