import { Injectable } from '@angular/core';
import { FormArray, FormBuilder, FormControl, Validators } from '@angular/forms';
import { generateID } from '@picsa/shared/services/core/db/db.service';
import { Subject, takeUntil } from 'rxjs';

import { CalendarDataEntry } from '../schema';

export type ISeasonCalendarForm = ReturnType<SeasonCalendarFormService['create']>;

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
    form.patchValue(values);
    this.formCreated$.next(form);
    this.form = form;
    this.subscribeToFormChanges();
    return form;
  }

  /** Initialise a form with bindings for all required db fields */
  private createFormTemplate() {
    const form = this.fb.nonNullable.group({
      ID: [generateID(), Validators.required],
      name: ['', Validators.required],
      activities: this.generateActivityFormControls([], 0),
      weather: this.generateWeatherFormControls(0),
      meta: this.fb.nonNullable.group({
        startMonth: new FormControl<number>(null as any, {
          validators: [Validators.required, Validators.min(0)],
          nonNullable: true,
        }),
        timePeriods: new FormControl<number>(null as any, {
          validators: [Validators.required, Validators.min(0)],
          nonNullable: true,
        }),
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
    const { crops, timePeriods } = this.form.controls.meta.controls;
    // When user changes crops ensure activity entries produced
    crops.valueChanges.pipe(takeUntil(this.formCreated$)).subscribe((value) => {
      const controls = this.generateActivityFormControls(value, timePeriods.value);
      this.form.setControl('activities', controls);
    });

    // When user changes time periods ensure weather and activities have correct number
    // of available entries for the time periods
    // TODO - could consider how to migrate existing data if enabling metadata edit
    timePeriods.valueChanges.pipe(takeUntil(this.formCreated$)).subscribe((value) => {
      const weatherControls = this.generateWeatherFormControls(value);
      this.form.setControl('weather', weatherControls);
      const activityControls = this.generateActivityFormControls(crops.value, value);
      this.form.setControl('activities', activityControls);
    });
  }

  /** Create form controls to store weather responses (string array) for the specified time periods */
  private generateWeatherFormControls(timePeriods: number = 0) {
    const controls = new Array(timePeriods).fill(new FormControl(''));
    return this.fb.nonNullable.array<string>(controls, Validators.required);
  }

  /**
   * Create form controls to store activity entries within a list of headings (e.g. crops)
   * Entries are stored by heading, with an array of entries for the specified time periods.
   * See schema mock data for example entry
   * */
  private generateActivityFormControls(headings: string[] = [], timePeriods: number = 0) {
    const group: { [id: string]: FormArray<FormControl<string>> } = {};
    for (const heading of headings) {
      const controls = new Array(timePeriods).fill(new FormControl(''));
      group[heading] = this.fb.nonNullable.array<string>(controls, Validators.required);
    }
    return this.fb.group(group);
  }
}
