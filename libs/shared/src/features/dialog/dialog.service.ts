import { Injectable, Injector } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { PicsaTranslateService } from '../../modules/translate/translate.service';
import DIALOG_TEMPLATES, { ICustomTemplate } from './components/TEMPLATES';
import { IPicsaDialogConfig, IPicsaDialogData } from './dialog.models';

@Injectable({
  providedIn: 'root',
})
export class PicsaDialogService {
  constructor(
    private dialog: MatDialog,
    private injector: Injector,
  ) {}

  /**
   * Specify whether to use translation (default true)
   * HACK - dashboard omits translations to avoid loading extension app config service and theme
   * */
  public useTranslation = true;

  /**********************************************************************
   *  Public Methods
   ***********************************************************************/

  async open(
    template: ICustomTemplate = 'blank',
    customData: IPicsaDialogData = {},
    customConfig: IPicsaDialogConfig = {},
  ) {
    // merge default with custom data and additional config
    const templateConfig = DIALOG_TEMPLATES[template];
    const config = {
      ...templateConfig,
      ...customConfig,
      data: { ...templateConfig.data, ...customData },
    };
    // ensure dialog title translated (if enabled)
    if (config.data.title && this.useTranslation) {
      const translateService = this.injector.get(PicsaTranslateService);
      if (translateService) {
        config.data.title = await translateService.translateText(config.data.title);
      }
    }
    const dialogRef = this.dialog.open(config.component, config);
    return dialogRef;
  }

  closeAll() {
    return this.dialog.closeAll();
  }
}
