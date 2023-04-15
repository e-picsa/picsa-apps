import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import DIALOG_TEMPLATES, { ICustomTemplate } from './components/TEMPLATES';
import { IPicsaDialogData, IPicsaDialogConfig } from './dialog.models';

@Injectable({
  providedIn: 'root',
})
export class PicsaDialogService {
  constructor(private dialog: MatDialog) {}

  /**********************************************************************
   *  Public Methods
   ***********************************************************************/

  async open(
    template: ICustomTemplate = 'blank',
    customData: IPicsaDialogData = {},
    customConfig: IPicsaDialogConfig = {}
  ) {
    // merge default with custom data and additional config
    const templateConfig = DIALOG_TEMPLATES[template];
    const config = {
      ...templateConfig,
      ...customConfig,
      data: { ...templateConfig.data, ...customData },
    };
    const dialogRef = this.dialog.open(config.component, config);
    return dialogRef;
  }

  closeAll() {
    return this.dialog.closeAll();
  }
}
