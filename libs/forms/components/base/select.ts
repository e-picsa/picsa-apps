import { Component, computed, input } from '@angular/core';
import { arrayToHashmap } from '@picsa/utils';

// Import your new base class
import { PicsaBaseControlValueAccessor } from './cva.base';

@Component({
  template: '',
  standalone: true,
})
export abstract class PicsaFormBaseSelectComponent<
  T extends { id: string },
> extends PicsaBaseControlValueAccessor<string> {
  /** UI State Properties specific to Select */
  public readonly filterFn = input<(option: T) => boolean>();

  /** Data Properties */
  public selectOptions: T[] = [];
  public selectOptionsHashmap: Record<string, T> = {};

  protected initBase(selectOptions: T[], selectOptionsHashmap: Record<string, T> = null as any) {
    this.selectOptions = selectOptions;
    this.selectOptionsHashmap = selectOptionsHashmap || arrayToHashmap(this.selectOptions, 'id');
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

    // Just set the signal. The effect in the base class handles the rest!
    this.value.set(id);

    // Mark the control as touched since the user interacted with it
    this.markAsTouched();
  }

  public handleReset() {
    if (this.disabled()) return;
    this.value.set('');
    this.markAsTouched();
  }
}
