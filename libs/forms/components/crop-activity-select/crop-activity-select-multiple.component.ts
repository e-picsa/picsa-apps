import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { CROP_ACTIVITY_DATA, ICropActivityDataEntry } from '@picsa/data';
import { PicsaTranslateModule } from '@picsa/i18n';
import { arrayToHashmap } from '@picsa/utils';

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

  public readonly customOptions = input<ICropActivityDataEntry[]>([]);
  public readonly addCustomOption = input<{ text: string; matIcon: string }>();
  public readonly addCustomClicked = output<void>();

  constructor() {
    super();
    effect(() => {
      const options = [...CROP_ACTIVITY_DATA, ...this.customOptions()];
      this.setSelectOptions(options, arrayToHashmap(options, 'id'));
    });
  }
}
