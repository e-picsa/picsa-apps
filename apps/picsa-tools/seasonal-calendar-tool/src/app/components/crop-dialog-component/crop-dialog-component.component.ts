import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA,MatDialogRef } from '@angular/material/dialog';

import { Crop } from '../../schema/schema_v0';

@Component({
  selector: 'seasonal-calendar-dialog-component',
  templateUrl: './crop-dialog-component.component.html',
  styleUrls: ['./crop-dialog-component.component.scss'],
})
export class CropDialogComponent {
  editedExtraInformation: string;

  constructor(
    public dialogRef: MatDialogRef<CropDialogComponent>,
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