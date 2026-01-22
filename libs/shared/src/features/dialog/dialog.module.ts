import { A11yModule } from '@angular/cdk/a11y';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { PicsaTranslateModule } from '@picsa/i18n';

import { PicsaLoadingComponent } from '../loading/loading';
import { PicsaActionDialog, PicsaDialogComponent, PicsaSelectDialog } from './components/dialog';
import { PicsaDialogService } from './dialog.service';

@NgModule({
  declarations: [PicsaDialogComponent, PicsaActionDialog, PicsaSelectDialog],
  exports: [PicsaDialogComponent],
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    A11yModule,
    PicsaLoadingComponent,
    PicsaTranslateModule,
    CommonModule,
  ],
  providers: [PicsaDialogService],
})
export class PicsaDialogsModule {}
