import { NgModule } from '@angular/core';
import { PicsaDialogLoading, PicsaDialog } from './dialogs';
import {
  MAT_DIALOG_DEFAULT_OPTIONS,
  MatDialogConfig,
  MatDialogModule
} from '@angular/material/dialog';
import { PicsaDialogService } from './dialog.service';
import { PicsaLoadingModule } from '../loading';

const PICSA_DIALOG_DEFAULTS: MatDialogConfig = {
  backdropClass: 'picsa-dialog-backdrop',
  closeOnNavigation: true,
  data: {},
  height: '250px',
  width: '250px'
};

@NgModule({
  entryComponents: [PicsaDialog, PicsaDialogLoading],
  declarations: [PicsaDialog, PicsaDialogLoading],
  exports: [PicsaDialogLoading],
  imports: [MatDialogModule, PicsaLoadingModule],
  providers: [
    { provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: PICSA_DIALOG_DEFAULTS },
    PicsaDialogService
  ]
})
export class PicsaDialogsModule {}
