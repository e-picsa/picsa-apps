import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { arrayToHashmap } from '@picsa/utils';

/** For more information about this base component see local @see./README.md */
@Component({
  template: '',
})
export abstract class PicsaFormBaseSelectComponent<T = { id: string }> implements OnInit {
  /** List of options to select from. Must contain 'id' property in each array item */
  public selectOptions: T[] = [];

  /** Overridable hashmap of select options (default will calculate) */
  public selectOptionsHashmap: Record<string, T>;

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
  protected get selectedOption() {
    if (this.selected) {
      return this.selectOptionsHashmap[this.selected];
    }
    return null;
  }

  /** Additional event emitter to allow manual bind to <gender-input (selectedChange) /> event*/
  @Output() selectedChange = new EventEmitter<string>();

  private _selected = ''; // this is the updated value that the class accesses

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    if (!this.selectOptionsHashmap) {
      this.selectOptionsHashmap = arrayToHashmap<any>(this.selectOptions, 'id');
    }
  }

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
