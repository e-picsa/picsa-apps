import { ChangeDetectionStrategy, ChangeDetectorRef, Component, forwardRef, Provider } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { IWeatherDataEntry, WEATHER_DATA, WEATHER_DATA_HASHMAP } from '@picsa/data/weather';

import { PicsaFormBaseSelectMultipleComponent } from '../base/select-multiple';

/** Accessor used for binding with ngModel or formgroups */
export const CONTROL_VALUE_ACCESSOR: Provider = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => FormWeatherSelectComponent),
  multi: true,
};

const SELECT_OPTIONS = WEATHER_DATA.filter((w) => w.label !== '');

/**
 * Form control to allow visual selection of weather conditions
 * Displays options in a popup and allows multiple selection
 */
@Component({
  selector: 'picsa-form-weather-select',
  templateUrl: './weather-select.component.html',
  styleUrls: ['./weather-select.component.scss'],
  providers: [CONTROL_VALUE_ACCESSOR],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class FormWeatherSelectComponent extends PicsaFormBaseSelectMultipleComponent<IWeatherDataEntry> {
  constructor(
    cdr: ChangeDetectorRef,
    public dialog: MatDialog,
  ) {
    super(cdr, SELECT_OPTIONS, WEATHER_DATA_HASHMAP);
  }
}
