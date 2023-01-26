import { NgModule } from '@angular/core';
import {
  PicsaDialogComponent,
  PicsaActionDialog,
  PicsaSelectDialog,
} from './components/dialog';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { PicsaDialogService } from './dialog.service';
import { PicsaLoadingModule } from '../loading';
import { CommonModule } from '@angular/common';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { A11yModule } from '@angular/cdk/a11y';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  declarations: [PicsaDialogComponent, PicsaActionDialog, PicsaSelectDialog],
  exports: [PicsaDialogComponent],
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    A11yModule,
    PicsaLoadingModule,
    CommonModule,
  ],
  providers: [PicsaDialogService],
})
export class PicsaDialogsModule {}
