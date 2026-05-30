import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { CROP_ACTIVITY_DATA, CROP_ACTIVITY_HASHMAP, ICropActivityDataEntry } from '@picsa/data';
import { PicsaTranslateModule } from '@picsa/i18n';

import { PicsaFormBaseSelectMultipleComponent } from '../base/select-multiple';

@Component({
  selector: 'picsa-form-crop-activity-select-multiple',
  templateUrl: './crop-activity-select-multiple.component.html',
  styleUrls: ['./crop-activity-select.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatDialogModule, PicsaTranslateModule],
})
export class FormCropActivitySelectMultipleComponent extends PicsaFormBaseSelectMultipleComponent<ICropActivityDataEntry> {
  dialog = inject(MatDialog);

  constructor() {
    super();
    this.initBase(CROP_ACTIVITY_DATA, CROP_ACTIVITY_HASHMAP);
  }
}
