import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { CROP_ACTIVITY_DATA, CROP_ACTIVITY_HASHMAP, ICropActivityDataEntry } from '@picsa/data';
import { PicsaTranslateModule } from '@picsa/i18n';

import { PicsaFormBaseSelectComponent } from '../base/select';

@Component({
  selector: 'picsa-form-crop-activity-select',
  templateUrl: './crop-activity-select.component.html',
  styleUrls: ['./crop-activity-select.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatDialogModule, PicsaTranslateModule],
})
export class FormCropActivitySelectComponent extends PicsaFormBaseSelectComponent<ICropActivityDataEntry> {
  dialog = inject(MatDialog);

  constructor() {
    super();
    this.initBase(CROP_ACTIVITY_DATA, CROP_ACTIVITY_HASHMAP);
  }
}
