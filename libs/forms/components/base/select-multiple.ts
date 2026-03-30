import { computed, Directive, input } from '@angular/core';
import { arrayToHashmap } from '@picsa/utils';

// Import the super-powered CVA base class
import { PicsaBaseControlValueAccessor } from './cva.base';

/**
 * Base component representing a standard multiple form control using Angular 21 Signal forms.
 */
@Directive({
  standalone: true,
})
// Extend the generic base class and tell it to expect an array of strings
export abstract class PicsaFormBaseSelectMultipleComponent<
  T extends { id: string },
> extends PicsaBaseControlValueAccessor<string[]> {
  // `value`, `disabled`, and `required` are seamlessly inherited!

  public readonly filterFn = input<(option: T) => boolean>();

  public selectOptions: T[] = [];
  public selectOptionsHashmap: Record<string, T> = {} as any;

  protected initBase(selectOptions: T[], selectOptionsHashmap: Record<string, T> = null as any) {
    this.selectOptions = selectOptions;
    this.selectOptionsHashmap = selectOptionsHashmap || arrayToHashmap(this.selectOptions, 'id');
  }

  protected readonly filteredOptions = computed(() => {
    const fn = this.filterFn();
    return fn ? this.selectOptions.filter(fn) : this.selectOptions;
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
      const index = vals.indexOf(id);
      if (index === -1) {
        return [...vals, id];
      } else {
        return vals.filter((v) => v !== id);
      }
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
