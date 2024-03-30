import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { IPicsaDialogData, IPicsaDialogSelectOption } from '../dialog.models';

// Dialog base
@Component({ template: '' })
export class PicsaDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: IPicsaDialogData = {},
    public dialogRef: MatDialogRef<PicsaDialogComponent>
  ) {}
}

// action dialogs present title, html content, optional loader and action buttons
@Component({
  selector: 'picsa-action-dialog',
  templateUrl: './action-dialog.html',
  styleUrls: ['./dialog.scss'],
})
export class PicsaActionDialog extends PicsaDialogComponent {}

// select dialog present an array of images for selection and returns clicked image
@Component({
  selector: 'picsa-image-select-dialog',
  templateUrl: './image-select.html',
  styleUrls: ['./dialog.scss'],
})
export class PicsaSelectDialog extends PicsaDialogComponent {
  select(option: IPicsaDialogSelectOption) {
    this.dialogRef.close(option.data);
  }
}
