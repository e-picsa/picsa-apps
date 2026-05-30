import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { IWeatherDataEntry, WEATHER_DATA, WEATHER_DATA_HASHMAP } from '@picsa/data/weather';
import { PicsaTranslateModule } from '@picsa/i18n';

import { PicsaFormBaseSelectMultipleComponent } from '../base/select-multiple';

@Component({
  selector: 'picsa-form-weather-select-multiple',
  templateUrl: './weather-select-multiple.component.html',
  styleUrls: ['./weather-select.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatDialogModule, PicsaTranslateModule],
})
export class FormWeatherSelectMultipleComponent extends PicsaFormBaseSelectMultipleComponent<IWeatherDataEntry> {
  dialog = inject(MatDialog);

  constructor() {
    super();
    this.initBase(
      WEATHER_DATA.filter((v) => !!v.label),
      WEATHER_DATA_HASHMAP,
    );
  }
}
