import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { IPicsaDialogData } from '../dialog.models';

// Dialog base
@Component({
  selector: 'picsa-dialog',
  templateUrl: './dialog.html',
  styleUrls: ['./dialog.scss']
})
export class PicsaDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: IPicsaDialogData = {},
    public dialogRef: MatDialogRef<PicsaDialogComponent>
  ) {}
}
