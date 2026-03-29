import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { Directive, effect, inject, input, model, signal, untracked } from '@angular/core';
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
@Directive({
  standalone: true,
})
export abstract class PicsaBaseControlValueAccessor<T> implements ControlValueAccessor, FormValueControl<T | null> {
  // --- State Models ---
  public value = model<T | null>(null);
  public disabled = model<boolean>(false);

  // --- Standard Inputs ---
  public readonly required = input<boolean, unknown>(false, { transform: coerceBooleanProperty });
  public readonly id = input<string>(`picsa-input-${nextUniqueId++}`);

  // --- Form Control Injection ---
  public ngControl = inject(NgControl, { optional: true, self: true });

  // UI State Properties (Converted to signal for OnPush compatibility)
  public focused = signal(false);

  protected onChange: (value: T | null) => void = () => null;
  protected onTouched: () => void = () => null;

  // Track the last value sent to the parent to prevent the "echo" bug
  private lastReportedValue: T | null = null;

  constructor() {
    if (this.ngControl) {
      // Attach this component as the value accessor for the injected control
      this.ngControl.valueAccessor = this;
    }

    // Automatically sync signal changes back to the parent form
    effect(() => {
      const val = this.value();

      untracked(() => {
        // Only trigger onChange if the value actually changed via the UI/Child component
        if (val !== this.lastReportedValue) {
          this.lastReportedValue = val;
          this.onChange(val);
        }
      });
    });
  }

  // --- Validation Helper ---
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
      this.focused.set(true);
    }
  }

  public onBlur(): void {
    this.focused.set(false);
    this.markAsTouched();
  }

  // --- Standard CVA Methods ---
  writeValue(val: T | null): void {
    // Update the tracker BEFORE setting the model, so the effect ignores this update
    this.lastReportedValue = val;
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
