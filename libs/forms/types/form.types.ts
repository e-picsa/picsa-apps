// 1. Helpers to categorize your interface keys

import { FormControl } from '@angular/forms';

// Returns keys like 'id', 'label', 'country_code' (User fields)
type RequiredControlKeys<T> = {
  [K in keyof T]: undefined extends T[K]
    ? null extends T[K]
      ? K
      : never // If Optional & Nullable -> Keep it (User field)
    : K; // If Required -> Keep it
}[keyof T];

// Returns keys like 'created_at', 'updated_at' (System fields)
type OptionalControlKeys<T> = {
  [K in keyof T]: undefined extends T[K]
    ? null extends T[K]
      ? never
      : K // If Optional & NOT Nullable -> System field
    : never;
}[keyof T];

// 2. The Final Type
// Merges the two sets: One set is required in the form, the other is optional (?)

/**
 * Take a DB Schema type and convert into type for use in FormBuilder.
 * It provide type-safety within the form group to ensure all required fields
 * have relevant form groups
 *
 * @example
 * private fb = inject(FormBuilder);
 * public form = this.fb.group<DBToFormBuilderType<ForecastRowInsert>({})
 */
export type DBToFormBuilderType<T> = {
  [K in RequiredControlKeys<T>]-?: FormControl<Exclude<T[K], undefined> | null>;
} & {
  [K in OptionalControlKeys<T>]?: FormControl<Exclude<T[K], undefined> | null>;
};
