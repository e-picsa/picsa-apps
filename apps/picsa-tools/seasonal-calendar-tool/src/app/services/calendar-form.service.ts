import { Injectable } from '@angular/core';
import { FormArray, FormBuilder, FormControl, Validators } from '@angular/forms';
import { generateID } from '@picsa/shared/services/core/db/db.service';
import { Subject, takeUntil } from 'rxjs';

import { CalendarDataEntry } from '../schema';

export type ISeasonCalendarForm = ReturnType<SeasonCalendarFormService['createFormTemplate']>;

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
  /** Main form for tracking state of season calendar data */
  public form: ISeasonCalendarForm;

  /** Subscribable form used to remove form event subscriptions */
  private formCreated$ = new Subject<ISeasonCalendarForm>();

  /** Direct access to form value. Use rawValue to ensure data from all formControls used **/
  public get value() {
    // Reassign to force ts to check this matches db calendar entry type definition ()
    const entry: CalendarDataEntry = this.form?.getRawValue();
    return entry;
  }

  constructor(private fb: FormBuilder) {}

  /** Create an angular form for tracking seasonal calendar data */
  public create(values: Partial<CalendarDataEntry> = {}) {
    const form = this.createFormTemplate();
    this.formCreated$.next(form);
    this.form = form;
    // ensure changes subscribed to first to correctly patch controls on load
    this.subscribeToFormChanges();

    // TODO - ensure initial values populate and reload
    this.form.patchValue(values);
    return this.form;
  }

  /** Initialise a form with bindings for all required db fields */
  private createFormTemplate() {
    const form = this.fb.nonNullable.group({
      ID: [generateID(), Validators.required],
      name: ['', Validators.required],
      activities: this.generateActivityFormControls([], 0),
      weather: this.generateWeatherFormControls(0),
      meta: this.fb.nonNullable.group({
        months: new FormControl<string[]>(
          { value: [], disabled: false },
          { nonNullable: true, validators: [Validators.required] }
        ),
        crops: new FormControl<string[]>(
          { value: [], disabled: false },
          { nonNullable: true, validators: [Validators.required] }
        ),
      }),
    });
    return form;
  }

  /**
   * Handle side effects when user updates form values
   * All subscriptions are maintained until next form creation via `takeUntil` pipe
   * */
  private subscribeToFormChanges() {
    const { crops, months } = this.form.controls.meta.controls;

    // When user changes crops ensure activity entries produced
    crops.valueChanges.pipe(takeUntil(this.formCreated$)).subscribe((value) => {
      const controls = this.generateActivityFormControls(value, months.value.length);
      this.form.setControl('activities', controls);
    });

    // When user changes time periods ensure weather and activities have correct number
    // of available entries for the time periods
    months.valueChanges.pipe(takeUntil(this.formCreated$)).subscribe((monthNames) => {
      const weatherControls = this.generateWeatherFormControls(monthNames.length);
      this.form.setControl('weather', weatherControls);
      const activityControls = this.generateActivityFormControls(crops.value, monthNames.length);
      this.form.setControl('activities', activityControls);
    });
  }

  /** Create form controls to store weather responses (string array) for the specified time periods */
  private generateWeatherFormControls(timePeriods: number = 0) {
    const array = this.fb.nonNullable.array<string>([], Validators.required);
    for (let i = 0; i < timePeriods; i++) {
      array.push(new FormControl('', { nonNullable: true }));
    }
    return array;
  }

  /**
   * Create form controls to store activity entries within a list of headings (e.g. crops)
   * Entries are stored by heading, with an array of entries for the specified time periods.
   * See schema mock data for example entry
   * */
  private generateActivityFormControls(headings: string[] = [], timePeriods: number = 0) {
    const group: { [id: string]: FormArray<FormControl<string>> } = {};
    for (const heading of headings) {
      const array = this.fb.nonNullable.array<string>([], Validators.required);
      for (let i = 0; i < timePeriods; i++) {
        array.push(new FormControl('', { nonNullable: true }));
      }
      group[heading] = array;
    }
    return this.fb.group(group);
  }
}
