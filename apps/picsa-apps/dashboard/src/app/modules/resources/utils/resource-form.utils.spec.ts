import { FormControl, FormGroup, Validators } from '@angular/forms';

import { getResourceFormValidationMessage } from './resource-form.utils';

describe('getResourceFormValidationMessage', () => {
  it('returns "No changes to save" when form is pristine', () => {
    const form = new FormGroup({
      title: new FormControl('Test', [Validators.required]),
    });
    expect(form.pristine).toBe(true);
    expect(getResourceFormValidationMessage(form)).toBe('No changes to save');
  });

  it('returns empty string when form is dirty and valid', () => {
    const form = new FormGroup({
      title: new FormControl('Test', [Validators.required]),
    });
    form.markAsDirty();
    expect(getResourceFormValidationMessage(form)).toBe('');
  });

  it('reports missing required fields with capitalized names', () => {
    const form = new FormGroup({
      first_name: new FormControl('', [Validators.required]),
      storage_file: new FormControl('', [Validators.required]),
    });
    form.markAsDirty();
    expect(getResourceFormValidationMessage(form)).toBe('Missing required fields: First Name, Storage File');
  });

  it('returns "Form is invalid" when error is not required validator', () => {
    const form = new FormGroup({
      email: new FormControl('invalid-email', [Validators.email]),
    });
    form.markAsDirty();
    expect(getResourceFormValidationMessage(form)).toBe('Form is invalid');
  });
});
