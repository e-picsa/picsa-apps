import { computed, Directive, input, signal } from '@angular/core';
import { arrayToHashmap } from '@picsa/utils';

// Import the super-powered CVA base class
import { PicsaBaseControlValueAccessor } from './cva.base';

/**
 * Base component representing a standard multiple form control using Angular 21 Signal forms.
 */
@Directive({})
// Extend the generic base class and tell it to expect an array of strings
export abstract class PicsaFormBaseSelectMultipleComponent<
  T extends { id: string },
> extends PicsaBaseControlValueAccessor<string[]> {
  // `value`, `disabled`, and `required` are seamlessly inherited!

  public readonly filterFn = input<(option: T) => boolean>();

  // signal-backed so `filteredOptions`/`selectedOptions` recompute if options are updated after init
  private readonly selectOptionsSignal = signal<T[]>([]);
  public selectOptionsHashmap: Record<string, T> = {} as any;

  public get selectOptions() {
    return this.selectOptionsSignal();
  }

  protected initBase(selectOptions: T[], selectOptionsHashmap: Record<string, T> = null as any) {
    this.setSelectOptions(selectOptions, selectOptionsHashmap);
  }

  /** Replace the available options, e.g. to merge in live custom entries alongside a hardcoded base list */
  protected setSelectOptions(selectOptions: T[], selectOptionsHashmap: Record<string, T> = null as any) {
    this.selectOptionsSignal.set(selectOptions);
    this.selectOptionsHashmap = selectOptionsHashmap || arrayToHashmap(selectOptions, 'id');
  }

  protected readonly filteredOptions = computed(() => {
    const options = this.selectOptionsSignal();
    const fn = this.filterFn();
    return fn ? options.filter(fn) : options;
  });

  protected readonly selectedOptions = computed(() => {
    // The base class might initialize value as `null`, so the fallback to `[]` here is perfect
    const vals = this.value() || [];
    return vals.map((val) => this.selectOptionsHashmap[val]).filter(Boolean);
  });

  public toggleSelected(id: string) {
    if (this.disabled() || !id) return;

    // Update the signal. The effect() in the base class will automatically catch this
    // and sync the new array up to the parent form.
    this.value.update((current) => {
      const vals = current || [];
      if (vals.includes(id)) {
        return vals.filter((v) => v !== id);
      }
      return [...vals, id];
    });

    // Mark as touched on user interaction
    this.markAsTouched();
  }

  public handleReset() {
    if (this.disabled()) return;
    this.value.set([]);
    this.markAsTouched();
  }
}
