import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { Component, computed, input, model } from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';
import { arrayToHashmap } from '@picsa/utils';

/**
 * Base component representing a standard form control using Angular 21 Signal forms.
 * Implementing FormValueControl natively binds the `value` signal to the parent form.
 */
@Component({
  template: '',
  standalone: true,
})
export abstract class PicsaFormBaseSelectComponent<T extends { id: string }> implements FormValueControl<string> {
  public value = model<string>('');

  /** UI State Properties */
  public readonly disabled = input<boolean, unknown>(false, { transform: coerceBooleanProperty });
  public readonly required = input<boolean, unknown>(false, { transform: coerceBooleanProperty });
  public readonly filterFn = input<(option: T) => boolean>();

  /** Data Properties - overridden by child components */
  public selectOptions: T[] = [];
  public selectOptionsHashmap: Record<string, T> = {} as any;

  protected initBase(selectOptions: T[], selectOptionsHashmap: Record<string, T> = null as any) {
    this.selectOptions = selectOptions;
    if (selectOptionsHashmap) {
      this.selectOptionsHashmap = selectOptionsHashmap;
    } else {
      this.selectOptionsHashmap = arrayToHashmap(this.selectOptions, 'id');
    }
  }

  /** Computed UI values */
  protected readonly filteredOptions = computed(() => {
    const fn = this.filterFn();
    return fn ? this.selectOptions.filter(fn) : this.selectOptions;
  });

  protected readonly selectedOption = computed(() => {
    const val = this.value();
    return val ? this.selectOptionsHashmap[val] || null : null;
  });

  public handleSelect(id: string) {
    if (this.disabled()) return;
    this.value.set(id);
  }

  public handleReset() {
    if (this.disabled()) return;
    this.value.set('');
  }
}
