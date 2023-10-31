import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA,MatDialogRef } from '@angular/material/dialog';

import { Crop } from '../../schema/schema_v0';

@Component({
  selector: 'seasonal-calendar-month-editor',
  templateUrl: './crop-dialog-component.component.html',
  styleUrls: ['./crop-dialog-component.component.scss'],
})
export class MonthDialogComponent {
  editedExtraInformation: string;

  constructor(
    public dialogRef: MatDialogRef<MonthDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Crop
  ) {
    this.editedExtraInformation = data.extraInformation;
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    this.data.extraInformation = this.editedExtraInformation;
    this.dialogRef.close();
  }
}
