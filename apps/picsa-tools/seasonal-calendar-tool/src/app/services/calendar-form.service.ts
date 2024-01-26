import { Injectable } from '@angular/core';
import { FormArray, FormBuilder, FormControl, Validators } from '@angular/forms';
import { generateID } from '@picsa/shared/services/core/db/db.service';
import { Subject, takeUntil } from 'rxjs';

import { CalendarDataEntry } from '../schema';

export type ISeasonCalendarForm = ReturnType<SeasonCalendarFormService['createForm']>;

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
  /** Observable used to manage form event subscriptions */
  private formCreated$ = new Subject<ISeasonCalendarForm>();

  constructor(private fb: FormBuilder) {}

  /** Create an angular form for tracking seasonal calendar data */
  public createForm(values: Partial<CalendarDataEntry> = {}) {
    const form = this.createFormTemplate();
    this.formCreated$.next(form);
    // ensure changes subscribed to first to correctly patch controls on load
    this.subscribeToFormChanges(form);
    form.patchValue(values);
    return form;
  }

  /** Utility method, retained to ensure rawValue corresponds to expected CaledarDataEntry type */
  public getFormValue(form: ISeasonCalendarForm) {
    const entry: CalendarDataEntry = form.getRawValue();
    return entry;
  }

  /** Initialise a form with bindings for all required db fields */
  private createFormTemplate() {
    const form = this.fb.nonNullable.group({
      ID: [generateID(), Validators.required],
      name: ['', Validators.required],
      activities: this.generateActivityFormControls(),
      weather: this.generateWeatherFormControls(),
      meta: this.generateMetaFormControls(),
    });
    // const entry: CalendarDataEntry = form.getRawValue();
    return form;
  }

  /**
   * Handle side effects when user updates form values
   * All subscriptions are maintained until next form creation via `takeUntil` pipe
   * */
  private subscribeToFormChanges(form: ISeasonCalendarForm) {
    const { crops, months } = form.controls.meta.controls;

    // When user changes crops ensure activity entries produced
    crops.valueChanges.pipe(takeUntil(this.formCreated$)).subscribe((value) => {
      const activityControls = this.generateActivityFormControls(value, months.value.length, form.getRawValue());
      form.setControl('activities', activityControls);
    });

    // When user changes time periods ensure weather and activities have correct number
    // of available entries for the time periods
    months.valueChanges.pipe(takeUntil(this.formCreated$)).subscribe((monthNames) => {
      const weatherControls = this.generateWeatherFormControls(monthNames.length);
      form.setControl('weather', weatherControls);
      const activityControls = this.generateActivityFormControls(crops.value, monthNames.length, form.getRawValue());
      form.setControl('activities', activityControls);
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

  /** Create nested formgroup to store meta months and crops properties */
  private generateMetaFormControls() {
    return this.fb.nonNullable.group({
      months: new FormControl<string[]>(
        { value: [], disabled: false },
        { nonNullable: true, validators: [Validators.required] }
      ),
      crops: new FormControl<string[]>(
        { value: [], disabled: false },
        { nonNullable: true, validators: [Validators.required] }
      ),
    });
  }

  /**
   * Create form controls to store activity entries within a list of headings
   * Entries are stored by heading, with an array of entries for the specified time periods.
   * See schema mock data for example entry
   * @param headings list of activity headings, e.g. ids of crops
   * @param timePeriods number of time periods allocated, i.e. total number of months
   * */
  private generateActivityFormControls(
    headings: string[] = [],
    timePeriods: number = 0,
    initialValues: Partial<CalendarDataEntry> = {}
  ) {
    const group: { [id: string]: FormArray<FormControl<string>> } = {};
    for (const heading of headings) {
      const array = this.fb.nonNullable.array<string>([], Validators.required);
      for (let i = 0; i < timePeriods; i++) {
        const initialValue = initialValues.activities?.[heading]?.[i] || '';
        array.push(new FormControl(initialValue, { nonNullable: true }));
      }
      group[heading] = array;
    }
    return this.fb.group(group);
  }
}
