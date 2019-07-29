import { NgModule } from '@angular/core';
import { PicsaDialogComponent } from './components/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { PicsaDialogService } from './dialog.service';
import { PicsaLoadingModule } from '../loading';
import { CommonModule } from '@angular/common';

@NgModule({
  entryComponents: [PicsaDialogComponent],
  declarations: [PicsaDialogComponent],
  exports: [PicsaDialogComponent],
  imports: [MatDialogModule, PicsaLoadingModule, CommonModule],
  providers: [PicsaDialogService]
})
export class PicsaDialogsModule {}
