import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { PicsaTranslateService } from '../../modules';
import DIALOG_TEMPLATES, { ICustomTemplate } from './components/TEMPLATES';
import { IPicsaDialogConfig, IPicsaDialogData } from './dialog.models';

@Injectable({
  providedIn: 'root',
})
export class PicsaDialogService {
  constructor(private dialog: MatDialog, private translateService: PicsaTranslateService) {}

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
    // ensure dialog title translated
    if (config.data.title) {
      config.data.title = await this.translateService.translateText(config.data.title);
    }
    const dialogRef = this.dialog.open(config.component, config);
    return dialogRef;
  }

  closeAll() {
    return this.dialog.closeAll();
  }
}
