import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA,MatDialogRef } from '@angular/material/dialog';

import { MonthData } from '../../schema/schema_v0';

@Component({
  selector: 'seasonal-calendar-month-editor',
  templateUrl: './crop-dialog-component.component.html',
  styleUrls: ['./crop-dialog-component.component.scss'],
})
export class MonthDialogComponent {
  weather: string;

  constructor(
    public dialogRef: MatDialogRef<MonthDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MonthData
  ) {
    this.weather = data.weather;
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    this.data.weather = this.weather;
    this.dialogRef.close();
  }
}
