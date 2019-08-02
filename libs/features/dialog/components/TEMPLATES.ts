import { IPicsaDialogData, IPicsaDialogConfig } from '../dialog.models';
import { MatDialogConfig } from '@angular/material';

// defaults are applied to all unless overwritten
const PICSA_DIALOG_DEFAULTS: MatDialogConfig = {
  closeOnNavigation: true,
  hasBackdrop: true,
  disableClose: true,
  data: {},
  height: '250px',
  width: '250px'
};

// very long-winded way of specifying types due to difficulties pulling keys from cutom templates (ts 2.9 changes)
type CustomTemplateFields = {
  config: IPicsaDialogConfig;
  data: IPicsaDialogData;
};
type CustomTemplates = {
  blank: CustomTemplateFields;
  delete: CustomTemplateFields;
};
// reusable templates
const CUSTOM_TEMPLATES: CustomTemplates = {
  blank: {
    data: {},
    config: PICSA_DIALOG_DEFAULTS
  },
  delete: {
    data: {
      title: 'Are you sure you want to delete?',
      buttons: [
        {
          text: 'Cancel',
          value: false
        },
        {
          text: 'Delete',
          value: true,
          focus: true
        }
      ]
    },
    config: {
      ...PICSA_DIALOG_DEFAULTS,
      height: '180px'
    }
  }
};

export type ICustomTempate = keyof CustomTemplates;
export default CUSTOM_TEMPLATES;
