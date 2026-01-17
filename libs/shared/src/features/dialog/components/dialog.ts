import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { IPicsaDialogData, IPicsaDialogSelectOption } from '../dialog.models';

// Dialog base
@Component({
  template: '',
  standalone: false,
})
export class PicsaDialogComponent {
  data = inject<IPicsaDialogData>(MAT_DIALOG_DATA) ?? {};
  dialogRef = inject<MatDialogRef<PicsaDialogComponent>>(MatDialogRef);
}

// action dialogs present title, html content, optional loader and action buttons
@Component({
  selector: 'picsa-action-dialog',
  templateUrl: './action-dialog.html',
  styleUrls: ['./dialog.scss'],
  standalone: false,
})
export class PicsaActionDialog extends PicsaDialogComponent {}

// select dialog present an array of images for selection and returns clicked image
@Component({
  selector: 'picsa-image-select-dialog',
  templateUrl: './image-select.html',
  styleUrls: ['./dialog.scss'],
  standalone: false,
})
export class PicsaSelectDialog extends PicsaDialogComponent {
  select(option: IPicsaDialogSelectOption) {
    this.dialogRef.close(option.data);
  }
}
