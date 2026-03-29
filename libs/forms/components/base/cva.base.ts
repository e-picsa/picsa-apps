import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { Component, effect, inject, input, model, untracked } from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { FormValueControl } from '@angular/forms/signals';

let nextUniqueId = 0;

/**
 * A highly reusable base class for creating custom Angular form controls.
 * * This class bridges the gap between traditional Angular Forms (Reactive/Template-driven via `[formControl]`)
 * and modern Angular Signal Forms. By extending this class, child components automatically inherit
 * full ControlValueAccessor (CVA) capabilities without needing repetitive providers or manual synchronization.
 * * **Key Features:**
 * - **Dual Compatibility:** Satisfies both `ControlValueAccessor` and `FormValueControl<T>`.
 * - **Auto-Syncing:** Uses a Signal `effect()` to automatically push internal `value` changes up to the parent form.
 * - **State Management:** Natively manages `disabled`, `required`, and auto-generates accessible `id` properties.
 * - **Validation & Interaction:** Tracks focus state and exposes an `errorState` getter for easy UI error styling.
 * * **Usage:**
 * Child components should `extend PicsaBaseControlValueAccessor<YourType>`.
 * Do NOT add `NG_VALUE_ACCESSOR` to the child's `providers` array.
 * Simply update `this.value.set(newValue)` inside the child, and the base class handles the rest.
 * * @template T - The expected data type of the form control's value (e.g., `string`, `string[]`, `number`).
 */
@Component({
  template: '',
  standalone: true,
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
export abstract class PicsaBaseControlValueAccessor<T> implements ControlValueAccessor, FormValueControl<T> {
  // --- State Models ---
  public value = model<T | any>(null);
  public disabled = model<boolean>(false);

  // --- Standard Inputs ---
  public readonly required = input<boolean, unknown>(false, { transform: coerceBooleanProperty });
  public readonly id = input<string>(`picsa-input-${nextUniqueId++}`);

  // --- Form Control Injection ---
  public ngControl = inject(NgControl, { optional: true, self: true });

  // UI State Properties
  public focused = false;

  protected onChange: (value: T | any) => void = () => null;
  protected onTouched: () => void = () => null;

  constructor() {
    if (this.ngControl) {
      // Attach this component as the value accessor for the injected control
      this.ngControl.valueAccessor = this;
    }

    // Automatically sync signal changes back to the parent form
    effect(() => {
      const val = this.value();
      untracked(() => this.onChange(val));
    });
  }

  // --- Validation Helper ---
  /**
   * Returns true if the control is invalid AND has been touched/dirtied.
   * Useful for binding to template error classes (e.g., `[class.has-error]="errorState"`).
   */
  get errorState(): boolean {
    if (!this.ngControl || !this.ngControl.control) {
      return false;
    }
    const control = this.ngControl.control;
    return !!(control.invalid && (control.touched || control.dirty));
  }

  // --- Focus/Blur Helpers ---
  public onFocus(): void {
    if (!this.disabled()) {
      this.focused = true;
    }
  }

  public onBlur(): void {
    this.focused = false;
    this.markAsTouched();
  }

  // --- Standard CVA Methods ---
  writeValue(val: T | any): void {
    this.value.set(val);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  public markAsTouched(): void {
    if (this.ngControl?.control?.touched) return;
    this.onTouched();
  }
}
