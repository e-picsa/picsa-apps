import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IPicsaDialogData } from '../dialog.service';

// Dialog base
@Component({
  selector: 'picsa-dialog',
  templateUrl: './dialog.html',
  styleUrls: ['./dialog.scss']
})
export class PicsaDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: IPicsaDialogData = {}) {}
}
