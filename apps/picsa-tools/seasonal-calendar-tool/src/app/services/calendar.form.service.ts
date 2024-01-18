import { Injectable } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MONTH_NAMES } from '@picsa/data';
import { generateID } from '@picsa/shared/services/core/db/db.service';

import { CalendarDataEntry } from '../schema';

/**
 * The seasonal calendar form service handles logic for interacting with seasonal calendar
 * data using angular forms.
 *
 * The service creates a default formgroup that handles all form data fields as defined in
 * the database schema, alongside options to check form states such as touched and validation
 *
 * See more info at:
 * https://angular.dev/guide/forms/reactive-forms
 * https://blog.angular-university.io/angular-form-array/
 */
@Injectable({ providedIn: 'root' })
export class SeasonCalendarFormService {
  public form = this.createBlankForm();

  /** Direct access to form value. Use rawValue to ensure data from all formControls used **/
  public get value() {
    // Reassign to force ts to check this matches db calendar entry type definition ()
    const entry: CalendarDataEntry = this.form.getRawValue();
    return entry;
  }

  constructor(private fb: FormBuilder) {}

  /** Create a clean angular form for tracking seasonal calendar data */
  public reset() {
    this.form = this.createBlankForm();
  }

  /** Initialise a form with bindings for all required db fields */
  private createBlankForm() {
    const form = this.fb.nonNullable.group({
      crops: new FormControl<any[]>([], { nonNullable: true, validators: Validators.required }),
      ID: [generateID(), Validators.required],
      name: ['', Validators.required],
      timeAndConditions: this.generateTimeAndConditionsControl([]),
    });
    return form;
  }

  /** Utility for setting nested time and condition data */
  public setFormTimeAndConditions(startMonthIndex: number, totalMonths: number) {
    // create an array using 2 cycles of months to allow for time period spanning across years,
    // e.g. 4 months starting November will slice => ["november", "december", "january", "february"]
    const months = [...MONTH_NAMES, ...MONTH_NAMES]
      .map((m) => m.id)
      .slice(startMonthIndex, startMonthIndex + totalMonths);
    // Create a new set of form controls to allow binding to weather and group formgroups within each time period
    const childFormControls = this.generateTimeAndConditionsControl(months);
    this.form.setControl('timeAndConditions', childFormControls);
  }

  /**
   * Generate a child form to store array of time period entries
   * See info about working with formArrays at:
   * https://blog.angular-university.io/angular-form-array/
   * */
  private generateTimeAndConditionsControl(months: string[] = []) {
    const formArray = this.fb.array<FormGroup<{ month: FormControl<string>; weather: FormControl<string> }>>([]);
    for (const month of months) {
      const group = this.fb.nonNullable.group({ month, weather: '' });
      formArray.push(group);
    }
    return formArray;
  }
}
