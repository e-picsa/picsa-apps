import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IPicsaDialogData } from '../dialog.models';

// Dialog base
@Component({
  selector: 'picsa-dialog',
  template: '',
  styleUrls: ['./dialogs.scss']
})
export class PicsaDialog {
  constructor(@Inject(MAT_DIALOG_DATA) public data: IPicsaDialogData) {
    console.log('loading dialog', data);
  }
}

// Individual dialogs - need to be included in dialog.module.ts entry components
@Component({
  selector: 'picsa-dialog-loading',
  templateUrl: './loading.html',
  styleUrls: ['./dialogs.scss']
})
export class PicsaDialogLoading extends PicsaDialog {}
