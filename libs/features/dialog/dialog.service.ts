import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PicsaDialogComponent } from './components/dialog';
import DIALOG_TEMPLATES, { ICustomTempate } from './components/TEMPLATES';
import { IPicsaDialogData, IPicsaDialogConfig } from './dialog.models';

@Injectable({
  providedIn: 'root'
})
export class PicsaDialogService {
  constructor(private dialog: MatDialog) {}

  /**********************************************************************
   *  Public Methods
   ***********************************************************************/

  async open(
    template: ICustomTempate = 'blank',
    customData: IPicsaDialogData = {},
    customConfig: IPicsaDialogConfig = {}
  ) {
    const templateConfig = DIALOG_TEMPLATES[template];
    const dialogRef = this.dialog.open(PicsaDialogComponent, {
      // merge default with custom data and additional config
      ...templateConfig,
      ...customConfig,
      data: { ...templateConfig.data, ...customData }
    });
    dialogRef.afterClosed().subscribe(v => {});
    return dialogRef;
  }

  closeAll() {
    console.log('closing all', this.dialog.openDialogs);
    return this.dialog.closeAll();
  }
}
