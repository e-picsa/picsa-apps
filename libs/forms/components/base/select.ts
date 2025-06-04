import { BooleanInput, coerceBooleanProperty } from '@angular/cdk/coercion';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  HostBinding,
  Inject,
  Input,
  OnDestroy,
  Output,
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { MatFormFieldControl } from '@angular/material/form-field';
import { arrayToHashmap } from '@picsa/utils';
import { Subject } from 'rxjs';

/** For more information about this base component see local @see./README.md */
@Component({
  template: '',
  // Map host events to functions (same as using @HostListener)
  // NOTE - will only work if child component includes focusable element
  // This can be any input element, or div with tabindex=0 applied
  // https://web.dev/articles/control-focus-with-tabindex
  host: {
    '(focusin)': 'onFocusIn($event)',
    '(focusout)': 'onFocusOut($event)',
  },
  standalone: false,
})
export abstract class PicsaFormBaseSelectComponent<T extends { id: string }>
  implements ControlValueAccessor, MatFormFieldControl<string>, OnDestroy
{
  /** Selected value binding */
  @Input()
  get selected() {
    return this._selected;
  }
  set selected(selected: string) {
    // avoid setting value if control disabled
    if (this.disabled) return;
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

  @Input() set filterFn(filterFn: (option: T) => boolean) {
    this.filteredOptions = this.selectOptions.filter((o) => filterFn(o));
  }

  /** Get full selected entry data */
  protected get selectedOption() {
    if (this.selected) {
      return this.selectOptionsHashmap[this.selected];
    }
    return null;
  }

  protected filteredOptions: T[] = [];

  /** Additional event emitter to allow manual bind to <gender-input (selectedChange) /> event*/
  @Output() selectedChange = new EventEmitter<string>();

  private _selected = ''; // this is the updated value that the class accesses

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

  setDisabledState(disabled: boolean) {
    this.disabled = disabled;
  }

  /********************************************************************
   * Mat-form-field bindings
   * https://material.angular.io/guide/creating-a-custom-form-field-control#id
   *********************************************************************/
  stateChanges = new Subject<void>();
  @Input()
  get value() {
    return this.selected;
  }
  set value(selected: string) {
    this.selected = selected;
    this.stateChanges.next();
  }
  ngOnDestroy() {
    this.stateChanges.complete();
  }

  focused = false;
  onFocusIn(e: FocusEvent) {
    if (!this.focused) {
      this.focused = true;
      this.stateChanges.next();
    }
  }
  onFocusOut(event: FocusEvent) {
    // if (!this._elementRef.nativeElement.contains(event.relatedTarget as Element)) {
    // this.touched = true;
    this.focused = false;
    // this.onTouched();
    this.stateChanges.next();
    // }
  }
  static nextId = 0;
  @HostBinding() id = `picsa-select-input-${PicsaFormBaseSelectComponent.nextId++}`;
  @Input()
  get placeholder() {
    return this._placeholder;
  }
  set placeholder(plh) {
    this._placeholder = plh;
    this.stateChanges.next();
  }
  private _placeholder: string;

  get empty() {
    return !this.selected;
  }
  @HostBinding('class.floating')
  get shouldLabelFloat() {
    return this.focused || !this.empty;
  }
  @Input()
  get required() {
    return this._required;
  }
  set required(req: boolean) {
    this._required = coerceBooleanProperty(req);
    this.stateChanges.next();
  }
  private _required = false;
  @Input()
  get disabled(): boolean {
    return this._disabled;
  }
  set disabled(value: BooleanInput) {
    this._disabled = coerceBooleanProperty(value);
    // this._disabled ? this.parts.disable() : this.parts.enable();
    this.stateChanges.next();
  }
  private _disabled = false;
  get errorState(): boolean {
    return false;
  }
  controlType = 'picsa-select';
  @Input() ariaDescribedBy: string;
  setDescribedByIds(ids: string[]) {
    // const controlElement = this._elementRef.nativeElement.querySelector('.picsa-select-input-container')!;
    // controlElement.setAttribute('aria-describedby', ids.join(' '));
  }
  onContainerClick(event: MouseEvent) {
    // if ((event.target as Element).tagName.toLowerCase() != 'input') {
    //   this._elementRef.nativeElement.querySelector('input').focus();
    // }
  }
  // provided by parent component
  ngControl: NgControl = null as any;
}
