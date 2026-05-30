import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { IWeatherDataEntry, WEATHER_DATA } from '@picsa/data/weather';
import { PicsaTranslateModule } from '@picsa/i18n';

import { PicsaFormBaseSelectComponent } from '../base/select';

@Component({
  selector: 'picsa-form-weather-select',
  templateUrl: './weather-select.component.html',
  styleUrls: ['./weather-select.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatDialogModule, PicsaTranslateModule],
})
export class FormWeatherSelectComponent extends PicsaFormBaseSelectComponent<IWeatherDataEntry> {
  dialog = inject(MatDialog);

  constructor() {
    super();
    this.initBase(WEATHER_DATA.filter((v) => !!v.label));
  }
}
