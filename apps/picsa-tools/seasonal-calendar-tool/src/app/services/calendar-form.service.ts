import { Injectable } from '@angular/core';
import { FormArray, FormBuilder, FormControl, Validators } from '@angular/forms';
import { generateID } from '@picsa/shared/services/core/db/db.service';
import { Subject, takeUntil } from 'rxjs';

import { CalendarDataEntry } from '../schema';

// Interface for the UI form that supports multiple selections
interface CalendarFormData {
  id: string;
  name: string;
  activities: {
    [enterprise: string]: string[][]; // Array of arrays - each crop has an array of activities per month
  };
  weather: string[][]; // Array of arrays - each month has an array of weather conditions
  meta: {
    months: string[];
    enterpriseType: 'crop';
    enterprises: string[];
  };
}

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
  /** Observable used to manage form event subscriptions */
  private formCreated$ = new Subject<ISeasonCalendarForm>();

  private form: ISeasonCalendarForm;

  constructor(private fb: FormBuilder) {}

  /** Create an angular form for tracking seasonal calendar data */
  public createForm(values: Partial<CalendarDataEntry> = {}) {
    const form = this.createFormTemplate();
    // remove any previous form change subscriptions by triggering subject
    this.formCreated$.next(form);
    // assign form to class so that full form value can be accessed from form change subscription
    this.form = form;
    // subscribed to changes and patch form value (triggering side-effects)
    this.subscribeToFormChanges(this.form);

    // Convert single values to arrays for UI
    const convertedValues = this.convertToMultipleFormat(values);
    this.form.patchValue(convertedValues);

    return this.form;
  }

  /** Utility method, retained to ensure rawValue corresponds to expected CaledarDataEntry type */
  private get formValue() {
    const entry: CalendarFormData = this.form.getRawValue();
    return entry;
  }

  /** Convert single values from database to multiple values for UI */
  private convertToMultipleFormat(values: Partial<CalendarDataEntry>): Partial<CalendarFormData> {
    const converted: Partial<CalendarFormData> = {
      id: values.id,
      name: values.name,
      meta: values.meta,
    };

    // Convert weather from string[] to string[][]
    if (values.weather && Array.isArray(values.weather)) {
      converted.weather = values.weather.map((w) => {
        if (w && w.includes(',')) {
          // If it's already a comma-separated string, split it
          return w
            .split(',')
            .map((item) => item.trim())
            .filter((item) => item);
        }
        return w ? [w] : [];
      });
    }

    // Convert activities from {[enterprise: string]: string[]} to {[enterprise: string]: string[][]}
    if (values.activities && typeof values.activities === 'object') {
      converted.activities = {};
      Object.keys(values.activities).forEach((enterprise) => {
        if (Array.isArray(values.activities![enterprise])) {
          converted.activities![enterprise] = values.activities![enterprise].map((a) => {
            if (a && a.includes(',')) {
              // If it's already a comma-separated string, split it
              return a
                .split(',')
                .map((item) => item.trim())
                .filter((item) => item);
            }
            return a ? [a] : [];
          });
        }
      });
    }

    return converted;
  }

  /** Convert multiple values from UI to single values for database (comma-separated) */
  public convertToSingleFormat(formValue: CalendarFormData): CalendarDataEntry {
    const converted: CalendarDataEntry = {
      id: formValue.id,
      name: formValue.name,
      meta: formValue.meta,
      weather: [],
      activities: {},
    };

    // Convert weather from string[][] to string[] (comma-separated)
    if (formValue.weather && Array.isArray(formValue.weather)) {
      converted.weather = formValue.weather.map((monthArray: string[]) =>
        monthArray && monthArray.length > 0 ? monthArray.join(', ') : '',
      );
    }

    // Convert activities from {[enterprise: string]: string[][]} to {[enterprise: string]: string[]} (comma-separated)
    if (formValue.activities && typeof formValue.activities === 'object') {
      Object.keys(formValue.activities).forEach((enterprise) => {
        if (Array.isArray(formValue.activities[enterprise])) {
          converted.activities[enterprise] = formValue.activities[enterprise].map((monthArray: string[]) =>
            monthArray && monthArray.length > 0 ? monthArray.join(', ') : '',
          );
        }
      });
    }

    return converted;
  }

  /** Initialise a form with bindings for all required db fields */
  private createFormTemplate() {
    const form = this.fb.nonNullable.group({
      id: [generateID(), Validators.required],
      name: ['', Validators.required],
      activities: this.generateActivityFormControls(),
      weather: this.generateWeatherFormControls(),
      meta: this.generateMetaFormControls(),
    });
    return form;
  }

  /**
   * Handle side effects when user updates form values
   * All subscriptions are maintained until next form creation via `takeUntil` pipe
   * */
  private subscribeToFormChanges(form: ISeasonCalendarForm) {
    const { enterprises, months } = form.controls.meta.controls;

    // When user changes enterprises ensure activity entries produced
    enterprises.valueChanges.pipe(takeUntil(this.formCreated$)).subscribe(() => {
      const activityControls = this.generateActivityFormControls(this.formValue);
      form.setControl('activities', activityControls);
    });

    // When user changes time periods ensure weather and activities have correct number
    // of available entries for the time periods
    months.valueChanges.pipe(takeUntil(this.formCreated$)).subscribe(() => {
      const weatherControls = this.generateWeatherFormControls(this.formValue);
      form.setControl('weather', weatherControls);
      const activityControls = this.generateActivityFormControls(this.formValue);
      form.setControl('activities', activityControls);
    });
  }

  /**
   * Create form controls to store weather responses (array of string arrays) for the specified time periods
   * @param timePeriods number of time periods allocated, i.e. total number of months
   * */
  private generateWeatherFormControls(formValue?: CalendarFormData) {
    const array = this.fb.nonNullable.array<FormControl<string[]>>([], Validators.required);
    if (formValue) {
      // assign weather controls corresponding to each of the months specified in the form
      const timePeriods = formValue.meta.months.length || 0;
      for (let i = 0; i < timePeriods; i++) {
        const existingValues = formValue.weather?.[i] || [];
        array.push(new FormControl(existingValues, { nonNullable: true }));
      }
    }

    return array;
  }

  /**
   * Create form controls to store activity entries within a list of headings
   * Entries are stored by heading, with an array of arrays of entries for the specified time periods.
   * See schema mock data for example entry
   * @param headings list of activity headings, e.g. ids of crops
   * @param timePeriods number of time periods allocated, i.e. total number of months
   * */
  private generateActivityFormControls(formValue?: CalendarFormData) {
    const group: { [id: string]: FormArray<FormControl<string[]>> } = {};
    if (formValue) {
      // assign a group entry for every crop heading, with controls for each month time period
      const headings = formValue.meta.enterprises || [];
      const timePeriods = formValue.meta.months.length || 0;
      for (const heading of headings) {
        const cropArray = this.fb.nonNullable.array<FormControl<string[]>>([]);
        for (let i = 0; i < timePeriods; i++) {
          const existingValues = formValue.activities?.[heading]?.[i] || [];
          cropArray.push(new FormControl(existingValues, { nonNullable: true }));
        }
        group[heading] = cropArray;
      }
    }

    return this.fb.group(group);
  }

  /** Create nested formgroup to store meta months and enterprise properties */
  private generateMetaFormControls() {
    return this.fb.nonNullable.group({
      months: new FormControl<CalendarDataEntry['meta']['months']>(
        { value: [], disabled: false },
        { nonNullable: true, validators: [Validators.required] },
      ),
      enterpriseType: new FormControl<CalendarDataEntry['meta']['enterpriseType']>('crop', { nonNullable: true }),
      enterprises: new FormControl<CalendarDataEntry['meta']['enterprises']>(
        { value: [], disabled: false },
        { nonNullable: true, validators: [Validators.required] },
      ),
    });
  }
}
