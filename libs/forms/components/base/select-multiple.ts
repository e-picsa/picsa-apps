import { BooleanInput, coerceBooleanProperty } from '@angular/cdk/coercion';
import { Component, computed, input, model } from '@angular/core';
import { arrayToHashmap } from '@picsa/utils';

/**
 * Base component representing a standard multiple form control using Angular 21 Signal forms.
 */
@Component({
  template: '',
  standalone: true,
})
export abstract class PicsaFormBaseSelectMultipleComponent<T extends { id: string }> {
  /** The model signal that replaces NG_VALUE_ACCESSOR binding */
  public value = model<string[]>([], { alias: 'selected' });

  public readonly disabled = input<boolean, BooleanInput>(false, { transform: coerceBooleanProperty });
  public readonly required = input<boolean, BooleanInput>(false, { transform: coerceBooleanProperty });
  public readonly filterFn = input<(option: T) => boolean>();

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

  protected readonly filteredOptions = computed(() => {
    const fn = this.filterFn();
    return fn ? this.selectOptions.filter(fn) : this.selectOptions;
  });

  protected readonly selectedOptions = computed(() => {
    const vals = this.value() || [];
    return vals.map((val) => this.selectOptionsHashmap[val]).filter(Boolean);
  });

  public toggleSelected(id: string) {
    if (this.disabled() || !id) return;

    this.value.update((current) => {
      const vals = current || [];
      const index = vals.indexOf(id);
      if (index === -1) {
        return [...vals, id];
      } else {
        return vals.filter((v) => v !== id);
      }
    });
  }

  public handleReset() {
    if (this.disabled()) return;
    this.value.set([]);
  }
}
