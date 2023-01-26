import { IPicsaDialogData, IPicsaDialogConfig } from '../dialog.models';
import { MatLegacyDialogConfig as MatDialogConfig } from '@angular/material/legacy-dialog';
import { TemplateRef } from '@angular/core';
import {
  PicsaActionDialog,
  PicsaDialogComponent,
  PicsaSelectDialog,
} from './dialog';
import { ComponentType } from '@angular/cdk/portal';

// defaults are applied to all unless overwritten
const PICSA_DIALOG_DEFAULTS: MatDialogConfig = {
  closeOnNavigation: true,
  hasBackdrop: true,
  disableClose: true,
  data: {},
  height: '250px',
  width: '250px',
};

// very long-winded way of specifying types due to difficulties pulling keys from cutom templates (ts 2.9 changes)
type CustomTemplateFields = {
  component: ComponentType<PicsaDialogComponent> | TemplateRef<any>;
  config: IPicsaDialogConfig;
  data: IPicsaDialogData;
};

export type ICustomTemplate = 'blank' | 'delete' | 'languageSelect';
// reusable templates
const CUSTOM_TEMPLATES: { [key in ICustomTemplate]: CustomTemplateFields } = {
  blank: {
    component: PicsaActionDialog,
    data: {},
    config: PICSA_DIALOG_DEFAULTS,
  },
  delete: {
    component: PicsaActionDialog,
    data: {
      title: 'Are you sure you want to delete?',
      buttons: [
        {
          text: 'Cancel',
          value: false,
        },
        {
          text: 'Delete',
          value: true,
          focus: true,
        },
      ],
    },
    config: {
      ...PICSA_DIALOG_DEFAULTS,
      height: '180px',
    },
  },
  languageSelect: {
    component: PicsaSelectDialog,
    data: {},
    config: PICSA_DIALOG_DEFAULTS,
  },
};

export default CUSTOM_TEMPLATES;
