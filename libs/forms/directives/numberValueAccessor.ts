import { Directive, ElementRef, forwardRef, inject, Renderer2 } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * Lightweight directive to use with any formField input
 * to automatically cast `input type="number"` to number type
 *
 * This is automatically handled if importing the angular `FormsModule`,
 * but should be used standalone if not
 */
@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: 'input[type=number][formField]',
  standalone: true,
  host: {
    '(input)': 'handleInput($event)', // Pass the event here
    '(blur)': 'onTouched()',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FormNumberValueAccessor),
      multi: true,
    },
  ],
})
export class FormNumberValueAccessor implements ControlValueAccessor {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onChange = (_: any) => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onTouched = () => {};

  private _renderer = inject(Renderer2);
  private _elementRef = inject(ElementRef);

  handleInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target.valueAsNumber;
    // Signal forms love null for "empty", so this is perfect
    this.onChange(isNaN(value) ? null : value);
  }

  writeValue(value: number | null): void {
    const normalizedValue = value == null ? '' : value;
    this._renderer.setProperty(this._elementRef.nativeElement, 'value', normalizedValue);
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this._renderer.setProperty(this._elementRef.nativeElement, 'disabled', isDisabled);
  }
}
