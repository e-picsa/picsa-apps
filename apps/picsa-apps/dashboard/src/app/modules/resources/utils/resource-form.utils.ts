import { FormGroup } from '@angular/forms';
import { capitalise } from '@picsa/utils';

/**
 * Derives a human-friendly validation summary message for resource edit forms.
 */
export function getResourceFormValidationMessage(form: FormGroup): string {
  if (form.pristine) {
    return 'No changes to save';
  }
  if (form.valid) {
    return '';
  }

  const errors: string[] = [];
  const controls = form.controls;

  for (const [key, control] of Object.entries(controls)) {
    if (control?.errors?.['required']) {
      const fieldName = key.split('_').map(capitalise).join(' ');
      errors.push(fieldName);
    }
  }

  if (errors.length > 0) {
    return `Missing required fields: ${errors.join(', ')}`;
  }
  return 'Form is invalid';
}
