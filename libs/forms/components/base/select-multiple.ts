import { ChangeDetectorRef, Component, EventEmitter, Inject, Input, Output } from '@angular/core';
import { arrayToHashmap } from '@picsa/utils';

/** For more information about this base component see local @see./README.md */
@Component({
  template: '',
  standalone: false,
})
export abstract class PicsaFormBaseSelectMultipleComponent<T extends { id: string }> {
  private _selected: string[] = []; // this is the updated value that the class accesses

  /** Selected value binding */
  @Input()
  get selected() {
    return this._selected;
  }
  set selected(selected: string[]) {
    // avoid setting value if control disabled
    if (this.disabled) return;
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

  @Input() set filterFn(filterFn: (option: T) => boolean) {
    this.filteredOptions = this.selectOptions.filter((o) => filterFn(o));
  }

  disabled = false;

  /** Get full selected entry data */
  protected get selectedOptions() {
    if (this.selected) {
      return this.selected.map((id) => this.selectOptionsHashmap[id]);
    }
    return [];
  }

  protected filteredOptions: T[] = [];

  /** Additional event emitter to allow manual bind to <gender-input (selectedChange) /> event*/
  @Output() selectedChange = new EventEmitter<string[]>();

  /**
   *
   * @param cdr - Angular change detector ref
   * @param selectOptions List of options to select from. Each option should include 'id' property
   * @param selectOptionsHashmap Hashmap of select options. If not provided will be calculated
   */
  constructor(
    private cdr: ChangeDetectorRef,
    @Inject('selectOptions') public selectOptions: T[],
    @Inject('selectOptionsHashmap') public selectOptionsHashmap: Record<string, T> = null as any
  ) {
    if (!this.selectOptionsHashmap) {
      this.selectOptionsHashmap = arrayToHashmap(this.selectOptions, 'id');
    }
    this.filteredOptions = this.selectOptions;
  }

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

  setDisabledState(disabled: boolean) {
    this.disabled = disabled;
  }
}
