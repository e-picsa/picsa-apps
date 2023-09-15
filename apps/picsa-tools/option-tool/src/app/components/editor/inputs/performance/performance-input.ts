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
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';

interface IPerformanceOption {
  label: string;
  /** mat-icon to be used with value select button */
  matIcon: string;
  /** alternative mat-icon to be used in readonly mode */
  readonlyIcon: string;
}

const PERFORMANCE_OPTIONS: { [id: string]: IPerformanceOption } = {
  bad: {
    label: translateMarker('Bad'),
    matIcon: 'cancel',
    readonlyIcon: 'close',
  },
  neutral: {
    label: translateMarker('Neutral'),
    matIcon: 'do_not_disturb_on',
    readonlyIcon: 'horizontal_rule',
  },
  good: {
    label: translateMarker('Good'),
    matIcon: 'check_circle',
    readonlyIcon: 'check',
  },
};

/** Accessor used for binding with ngModel or formgroups */
export const PERFORMANCE_INPUT_CONTROL_VALUE_ACCESSOR: Provider = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => PerformanceInputComponent),
  multi: true,
};

/**
 * Custom input element designed for use with angular Ng-model or standalone syntax
 *
 * @example
 * ```
 * <option-performance-input [(ngModel)]="someVariable"></option-gender-input>
 * ```
 * Adapted from:
 * https://valor-software.com/articles/avoiding-common-pitfalls-with-controlvalueaccessors-in-angular
 * https://sreyaj.dev/custom-form-controls-controlvalueaccessor-in-angular
 * https://indepth.dev/posts/1055/never-again-be-confused-when-implementing-controlvalueaccessor-in-angular-forms
 */
@Component({
  selector: 'option-performance-input',
  templateUrl: './performance-input.html',
  styleUrls: ['./performance-input.scss'],
  providers: [PERFORMANCE_INPUT_CONTROL_VALUE_ACCESSOR],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerformanceInputComponent implements ControlValueAccessor {
  protected selectOptions = Object.entries(PERFORMANCE_OPTIONS).map(([id, value]) => ({ ...value, id }));

  /** Configurable display options (none currently used) */
  @Input() options: { readonly?: boolean } = {};

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

  protected get selectedIconValue() {
    return PERFORMANCE_OPTIONS[this.selected || '_none']?.readonlyIcon || '';
  }

  /** Additional event emitter to allow manual bind to <gender-input (selectedChange) /> event*/
  @Output() selectedChange = new EventEmitter<string>();

  private _selected = ''; // this is the updated value that the class accesses

  constructor(private cdr: ChangeDetectorRef) {}

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
