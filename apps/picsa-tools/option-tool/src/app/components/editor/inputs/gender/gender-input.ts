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
import { PicsaTranslateService } from '@picsa/shared/modules';

const GENDER_OPTIONS: { [id: string]: { label: string; icon: string } } = {
  female: {
    label: translateMarker('Female'),
    icon: 'picsa_options_female',
  },
  male: {
    label: translateMarker('Male'),
    icon: 'picsa_options_male',
  },
};

/** Mark additional hardcoded strings for translation */
const STRINGS = { only: translateMarker('Only'), and: translateMarker('and'), both: translateMarker('Both') };

/** Accessor used for binding with ngModel or formgroups */
export const GENDER_INPUT_CONTROL_VALUE_ACCESSOR: Provider = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => GenderInputComponent),
  multi: true,
};

/**
 * Custom input element designed for use with angular Ng-model or standalone syntax
 *
 * @example
 * ```
 * <option-gender-input [(ngModel)]="someVariable"></option-gender-input>
 * // or
 * <option-gender-input [selected]="someValue" (selectedChange)="handleChange()"></option-gender-input>
 * ```
 * Adapted from:
 * https://valor-software.com/articles/avoiding-common-pitfalls-with-controlvalueaccessors-in-angular
 * https://sreyaj.dev/custom-form-controls-controlvalueaccessor-in-angular
 * https://indepth.dev/posts/1055/never-again-be-confused-when-implementing-controlvalueaccessor-in-angular-forms
 */
@Component({
  selector: 'option-gender-input',
  templateUrl: './gender-input.html',
  styleUrls: ['./gender-input.scss'],
  providers: [GENDER_INPUT_CONTROL_VALUE_ACCESSOR],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenderInputComponent implements ControlValueAccessor {
  public selectOptions = Object.entries(GENDER_OPTIONS).map(([id, value]) => ({ ...value, id }));

  /** Configurable display options */
  @Input() options: { showValueText?: boolean } = {};

  /** Selected value binding */
  @Input()
  get selected() {
    return this._selected;
  }
  set selected(selected: string[]) {
    if (selected && this.selected.join(',') !== selected.join(',')) {
      this._selected = selected.sort();
      this.cdr.markForCheck();
      this.selectedChange.emit(this._selected);
      if (this._onChange) {
        this._onChange(this._selected);
      }
    }
  }

  /** Additional event emitter to allow manual bind to <gender-input (selectedChange) /> event*/
  @Output() selectedChange = new EventEmitter<string[]>();

  private _selected: string[] = []; // this is the updated value that the class accesses

  constructor(private cdr: ChangeDetectorRef, private translateService: PicsaTranslateService) {}

  /**
   * Return a text representation of the value. Returns an array or individual words for easier translation
   * In case one gender selected will return ['Only', 'Female']
   * In case both selected will return ['Both']
   */
  public get valueTextArray() {
    if (this.selected.length == 0) return [];
    if (this.selected.length === 2) return [STRINGS.both];
    const [selectedId] = this.selected;
    return [STRINGS.only, GENDER_OPTIONS[selectedId].label];
  }

  toggleOptionSelect(id: string) {
    if (id) {
      const valueIndex = this.selected.indexOf(id);
      if (valueIndex === -1) {
        this.selected = [...this._selected, id];
      } else {
        this.selected = this._selected.filter((v) => v !== id);
      }
    }
  }

  /** Events registered by ngModel and Form Controls */
  // eslint-disable-next-line @typescript-eslint/member-ordering
  private _onChange: (value: string[]) => void;
  // eslint-disable-next-line @typescript-eslint/member-ordering
  private _onTouched: (value: string[]) => void;

  writeValue(selected: string[]) {
    this.selected = selected;
  }

  registerOnChange(fn: (value: string[]) => void) {
    this._onChange = fn;
  }

  registerOnTouched(fn: (value: string[]) => void) {
    this._onTouched = fn; // <-- save the function
  }
}
