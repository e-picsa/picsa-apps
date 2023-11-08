import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  forwardRef,
  Input,
  OnInit,
  Output,
  Provider,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CROPS_DATA } from '@picsa/data';

/** Accessor used for binding with ngModel or formgroups */
export const CROP_SELECT_INPUT_CONTROL_VALUE_ACCESSOR: Provider = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => FormCropSelectComponent),
  multi: true,
};

/**
 * Custom input element designed for use with angular Ng-model or standalone syntax
 *
 * @example
 * ```
 * <picsa-form-crop-select [(ngModel)]="someVariable"></picsa-form-crop-select>
 * // or
 * <picsa-form-crop-select [selected]="someValue" (selectedChange)="handleChange()"></picsa-form-crop-select>
 * ```
 * Adapted from:
 * https://valor-software.com/articles/avoiding-common-pitfalls-with-controlvalueaccessors-in-angular
 * https://sreyaj.dev/custom-form-controls-controlvalueaccessor-in-angular
 * https://indepth.dev/posts/1055/never-again-be-confused-when-implementing-controlvalueaccessor-in-angular-forms
 *
 * TODO
 * - Add support for custom crop lists/filter
 * - Replace crop-probability-tool select with shared component
 * - Support custom crop
 */

interface IFormCropSelectOptions {
  /** Allow multiple inputs. Stores values in an array (default: True) */
  multiple?: boolean;
}
const DEFAULT_OPTIONS: IFormCropSelectOptions = { multiple: true };

@Component({
  selector: 'picsa-form-crop-select',
  templateUrl: './crop-select.component.html',
  styleUrls: ['./crop-select.component.scss'],
  providers: [CROP_SELECT_INPUT_CONTROL_VALUE_ACCESSOR],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormCropSelectComponent implements ControlValueAccessor, OnInit {
  protected selectOptions = CROPS_DATA;

  /** Configured options merged with default options */
  public _options: IFormCropSelectOptions = DEFAULT_OPTIONS;

  /** Configurable display options */
  @Input()
  set options(options: Partial<IFormCropSelectOptions>) {
    this._options = { ...DEFAULT_OPTIONS, ...options };
  }

  /** Selected value binding */
  @Input()
  get selected() {
    return this.selectionModel.get();
  }
  set selected(selected: string | string[]) {
    const isChanged = this.selectionModel.set(selected);
    if (isChanged) {
      const value = this.selectionModel.get();
      this.cdr.markForCheck();
      this.selectedChange.emit(value);
      if (this._onChange) {
        this._onChange(value);
      }
    }
  }

  /** Additional event emitter to allow manual bind to <gender-input (selectedChange) /> event*/
  @Output() selectedChange = new EventEmitter<string | string[]>();

  /**
   * Different getter and setter methods are required depending on whether the input supports multiple
   * values or not. For multiple values get/set operations work with arrays, for single strings are used
   */
  private selectionModel: ValueSelector;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    // Ensure correct value selector applied depending on whether using multiple values or not
    const { multiple } = this._options;
    this.selectionModel = multiple ? new MultipleValueSelector() : new SingleValueSelector();
  }

  /** Handle crop toggle in case of multiple select */
  public handleSelected(id: string) {
    // Toggle multiple selection
    if (this._options.multiple) {
      const existing = this.selected as string[];
      const valueIndex = existing.indexOf(id);
      if (valueIndex === -1) {
        this.selected = [...existing, id];
      } else {
        this.selected = existing.filter((v) => v !== id);
      }
    }
    // Toggle single selection
    else {
      this.selected = id;
    }
  }

  /** Events registered by ngModel and Form Controls */
  // eslint-disable-next-line @typescript-eslint/member-ordering
  private _onChange: (value: string | string[]) => void;
  // eslint-disable-next-line @typescript-eslint/member-ordering
  private _onTouched: (value: string | string[]) => void;

  writeValue(selected: string | string[]) {
    this.selected = selected;
  }

  registerOnChange(fn: (value: string | string[]) => void) {
    this._onChange = fn;
  }

  registerOnTouched(fn: (value: string | string[]) => void) {
    this._onTouched = fn; // <-- save the function
  }
}

interface ValueSelector {
  /** Handle value set, returning boolean to notify if value changed or not */
  set: (value?: string | string[]) => boolean;
  get: () => string | string[];
}

class SingleValueSelector implements ValueSelector {
  private _value = '';
  /** Ensure value parsed as string and set if different to current value */
  public set(value?: string | string[] | null) {
    if (Array.isArray(value)) value = value[0];
    if (!value) value = '';
    if (value !== this._value) {
      this._value = value;
      return true;
    }
    return false;
  }
  public get() {
    return this._value;
  }
}

class MultipleValueSelector implements ValueSelector {
  private _value: string[] = [];
  /** Ensure value parsed as array and set if different to current value */
  public set(value?: string | string[] | null) {
    if (!value) value = [];
    if (typeof value === 'string') value = [value];
    if (value.join(',') !== this._value.join(',')) {
      this._value = value;
      return true;
    }
    return false;
  }
  public get() {
    return this._value;
  }
}
