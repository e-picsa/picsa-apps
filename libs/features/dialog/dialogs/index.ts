import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IPicsaDialogData } from '../dialog.models';

// Dialog base
@Component({
  selector: 'picsa-dialog',
  template: ''
})
export class PicsaDialog {
  loaders: any;
  constructor(@Inject(MAT_DIALOG_DATA) public data: IPicsaDialogData) {
    console.log('loading dialog', data);
    this.loaders = data.loaders;
  }
}

// Individual dialogs - need to be included in dialog.module.ts entry components
@Component({
  selector: 'picsa-dialog-loading',
  templateUrl: './loading.html'
})
export class PicsaDialogLoading extends PicsaDialog {}
