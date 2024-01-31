import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { MONTH_DATA, MONTH_DATA_HASHMAP } from '@picsa/data';
import { Subject, takeUntil } from 'rxjs';

import { ISeasonCalendarForm } from '../../services/calendar-form.service';

type IMonthForm = ReturnType<CalendarEditorComponent['createMonthForm']>;

@Component({
  selector: 'seasonal-calendar-editor',
  templateUrl: './calendar-editor.component.html',
  styleUrls: ['./calendar-editor.component.scss'],
})
export class CalendarEditorComponent implements OnInit, OnDestroy {
  /** List of month data to use in select component */
  public monthOptions = MONTH_DATA;

  public monthLabels: string[] = [];

  private componentDestroyed$ = new Subject<boolean>();

  /** Additional form just used to input start and total month numbers */
  public monthForm: IMonthForm;

  @Input() form: ISeasonCalendarForm;

  constructor(private fb: FormBuilder) {}

  // get controls of nested `entry.meta` form
  public get metaFormControls() {
    return this.form.controls.meta.controls;
  }

  public get formValue() {
    return this.form.getRawValue();
  }

  ngOnInit() {
    this.monthForm = this.createMonthForm();
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next(true);
    this.componentDestroyed$.complete();
  }

  /** Force form validation. Marking elements as touched to show validation UI */
  public validate() {
    this.form.markAllAsTouched();
    this.monthForm.markAllAsTouched();
    return this.form.valid && this.monthForm.valid;
  }

  /**
   * A separate form is used to allow track month startIndex and totalCount
   * values, and generate list of month names accordingly
   */
  private createMonthForm() {
    // calculate initial values from any existing form data
    const [startMonth] = this.formValue.meta.months;
    const startIndex = startMonth ? MONTH_DATA_HASHMAP[startMonth].index : null;
    const totalCount = this.formValue.meta.months.length || null;
    // create form
    const monthForm = this.fb.nonNullable.group({
      startIndex: new FormControl<number>(startIndex as any, {
        validators: [Validators.required, Validators.min(0)],
        nonNullable: true,
      }),
      totalCount: new FormControl<number>(totalCount as any, {
        validators: [Validators.required, Validators.min(0)],
        nonNullable: true,
      }),
    });
    // Subscribe to form value changes and generate list of month names as requried
    monthForm.valueChanges.pipe(takeUntil(this.componentDestroyed$)).subscribe(() => {
      this.generateMonthNames();
    });
    return monthForm;
  }

  /**
   * When the user specifies start month and total months generate an array of the names of all months that would cover
   * the period. E.g. startIndex:2 totalCount:3 => ['march','april','may']
   * Data is represented both with month ids and month labels for display
   */

  private generateMonthNames() {
    const { startIndex, totalCount } = this.monthForm.getRawValue();
    if (startIndex !== null && totalCount !== null) {
      // start with a list of duplciate month names to allow looping over year (e.g. November -> March)
      const monthsData = [...MONTH_DATA, ...MONTH_DATA].slice(startIndex, startIndex + totalCount);
      const monthIds = monthsData.map((m) => m.id);
      this.metaFormControls.months.patchValue(monthIds);
      this.monthLabels = monthsData.map((m) => m.label);
    }
  }
}
