import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import { PicsaTranslateModule } from '@picsa/i18n';

import { PicsaLoadingComponent } from '../../loading/loading';
import { IPicsaDialogData } from '../dialog.models';

// action dialogs present title, html content, optional loader and action buttons
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'picsa-action-dialog',
  templateUrl: './action-dialog.html',
  styleUrls: ['./dialog.scss'],
  imports: [PicsaLoadingComponent, MatDialogActions, MatButton, MatDialogClose, PicsaTranslateModule],
})
export class PicsaActionDialogComponent {
  data = inject<IPicsaDialogData>(MAT_DIALOG_DATA) ?? {};
  dialogRef = inject<MatDialogRef<PicsaActionDialogComponent>>(MatDialogRef);
}
