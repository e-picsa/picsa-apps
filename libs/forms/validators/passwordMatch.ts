import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Custom form validator to ensure passwords match. Adapted from
 * https://stackoverflow.com/a/51606362/5693245
 */
const passwordMatch: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  if (!control) return null;
  const form = control.parent;
  if (!form) return null;
  const pass = form.get('password')?.value;
  return pass === control.value ? null : { notSame: true };
};

export default passwordMatch;
