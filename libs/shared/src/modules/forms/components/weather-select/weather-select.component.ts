import { ChangeDetectionStrategy, ChangeDetectorRef, Component, forwardRef, Provider } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { IWeatherDataEntry, WEATHER_DATA, WEATHER_DATA_HASHMAP } from '@picsa/data/weather';

import { BaseSelectComponent } from '../base/select';

/** Accessor used for binding with ngModel or formgroups */
export const CONTROL_VALUE_ACCESSOR: Provider = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => FormWeatherSelectComponent),
  multi: true,
};

/**
 * Form control to allow visual selection of weather condition
 * Displays options in a popup and allows single selection
 */
@Component({
  selector: 'picsa-form-weather-select',
  templateUrl: './weather-select.component.html',
  styleUrls: ['./weather-select.component.scss'],
  providers: [CONTROL_VALUE_ACCESSOR],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormWeatherSelectComponent extends BaseSelectComponent<IWeatherDataEntry> {
  public override selectOptions = WEATHER_DATA.filter((w) => w.label !== '');
  public override selectOptionsHashmap = WEATHER_DATA_HASHMAP;

  constructor(cdr: ChangeDetectorRef, public dialog: MatDialog) {
    super(cdr);
  }
}
