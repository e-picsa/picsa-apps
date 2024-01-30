import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  forwardRef,
  Input,
  Output,
  Provider,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { WEATHER_DATA, WEATHER_DATA_HASHMAP } from '@picsa/data/weather';

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
export class FormWeatherSelectComponent {
  protected selectOptions = WEATHER_DATA.filter((w) => w.label !== '');

  /** Selected value binding */
  @Input()
  get selected() {
    return this._selected;
  }
  set selected(selected: string) {
    selected ??= '';
    if (this.selected !== selected) {
      this._selected = selected;
      this.cdr.markForCheck();
      this.selectedChange.emit(this._selected);
      if (this._onChange) {
        this._onChange(this._selected);
      }
    }
  }
  /** Get full selected entry data */
  protected get selectedData() {
    return WEATHER_DATA_HASHMAP[this.selected];
  }

  /** Additional event emitter to allow manual bind to <gender-input (selectedChange) /> event*/
  @Output() selectedChange = new EventEmitter<string>();

  private _selected = ''; // this is the updated value that the class accesses

  constructor(public dialog: MatDialog, private cdr: ChangeDetectorRef) {}

  /** Events registered by ngModel and Form Controls */
  // eslint-disable-next-line @typescript-eslint/member-ordering
  private _onChange: (value: string) => void;
  // eslint-disable-next-line @typescript-eslint/member-ordering
  private _onTouched: (value: string) => void;

  writeValue(selected: string) {
    this.selected = selected;
  }

  registerOnChange(fn: (value: string) => void) {
    this._onChange = fn;
  }

  registerOnTouched(fn: (value: string) => void) {
    this._onTouched = fn; // <-- save the function
  }
}
