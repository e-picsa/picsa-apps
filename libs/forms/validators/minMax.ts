import { AbstractControl, ValidatorFn } from '@angular/forms';

function minMaxValidator(min: number, max: number): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    if (control.value === null || control.value === undefined) {
      return null; // Don't validate empty values; use Validators.required for that
    }

    const value = Number(control.value); // Convert to number

    if (isNaN(value)) {
      return { nan: true }; // If the value is not a number
    }

    if (value < min || value > max) {
      return { range: { min: min, max: max, actual: value } };
    }

    return null;
  };
}
export default minMaxValidator;
