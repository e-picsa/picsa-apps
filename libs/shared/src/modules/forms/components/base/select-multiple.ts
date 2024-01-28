import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';

/** For more information about this base component see local @see./README.md */
@Component({
  template: '',
})
export abstract class BaseSelectMultipleComponent<T = { id: string }> {
  public selectOptions: T[] = [];
  public selectOptionsHashmap: Record<string, T> = {};

  private _selected: string[] = []; // this is the updated value that the class accesses

  /** Selected value binding */
  @Input()
  get selected() {
    return this._selected;
  }
  set selected(selected: string[]) {
    if (!selected) selected = [];
    if (selected.join(',') !== this._selected.join(',')) {
      this._selected = selected;
      this.cdr.markForCheck();
      this.selectedChange.emit(this._selected);
      if (this._onChange) {
        this._onChange(this._selected);
      }
    }
  }

  /** Additional event emitter to allow manual bind to <gender-input (selectedChange) /> event*/
  @Output() selectedChange = new EventEmitter<string[]>();

  constructor(private cdr: ChangeDetectorRef) {}

  public toggleSelected(id: string) {
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
