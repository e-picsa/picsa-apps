import { Component, Inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

export interface DialogData {
  animal: string;
  name: string;
}

@Component({
  selector: 'picsa-dialog-loading',
  templateUrl: './dialog-loading.html'
})
export class PicsaDialogLoading {
  constructor(public dialogRef: MatDialogRef<any>) {}

  onNoClick(): void {
    this.dialogRef.close();
  }
}
