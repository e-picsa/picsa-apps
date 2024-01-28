import { ChangeDetectorRef, Component, EventEmitter, forwardRef, Input, Output, Provider } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

/** Accessor used for binding with ngModel or formgroups */
export const CONTROL_VALUE_ACCESSOR: Provider = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => BaseSelectComponent),
  multi: true,
};

/**
 * Abstract component to handle data binding for single select form controls
 *
 * It uses a set of `selectOptions` containing an array of items with an 'id' property
 * These options are separately tracked by a `selectOptionsHashmap` keyed by 'id'
 *
 * Using these properties the control handles selected output controls, outputting the value
 * to associated ngModel or formcControls
 *
 * The selected value can be specified from component by setting the public `selected` property
 * to a string id value
 */
@Component({
  template: '',
})
export abstract class BaseSelectComponent<T = { id: string }> {
  public selectOptions: T[] = [];
  public selectOptionsHashmap: Record<string, T> = {};

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
    return this.selectOptionsHashmap[this.selected];
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
