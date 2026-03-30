import { signal } from '@angular/core';
import { form, minLength, required } from '@angular/forms/signals';

import { CalendarDataEntry, ENTRY_TEMPLATE } from './schema';

export function createForm(initialState: Partial<CalendarDataEntry> = {}) {
  // Create the Writable Signal Model
  const model = signal<CalendarDataEntry>({ ...ENTRY_TEMPLATE(), ...initialState });

  // Define the Form Schema (Replaces FormBuilder)
  const calendarForm = form(model, (path) => {
    required(path.id);
    required(path.name);
    required(path.meta.months);
    required(path.meta.enterprises);
    minLength(path.meta.enterprises, 1);
  });

  // Return both the signal model and the reactive form
  return { model, form: calendarForm };
}
