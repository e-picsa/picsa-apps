import { NgModule } from '@angular/core';
import {
  PicsaDialogComponent,
  PicsaActionDialog,
  PicsaSelectDialog
} from './components/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { PicsaDialogService } from './dialog.service';
import { PicsaLoadingModule } from '../loading';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { A11yModule } from '@angular/cdk/a11y';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  entryComponents: [PicsaDialogComponent, PicsaActionDialog, PicsaSelectDialog],
  declarations: [PicsaDialogComponent, PicsaActionDialog, PicsaSelectDialog],
  exports: [PicsaDialogComponent],
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    A11yModule,
    PicsaLoadingModule,
    CommonModule
  ],
  providers: [PicsaDialogService]
})
export class PicsaDialogsModule {}
