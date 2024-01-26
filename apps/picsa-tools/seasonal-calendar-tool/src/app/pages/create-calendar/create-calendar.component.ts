import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MONTH_NAMES } from '@picsa/data';
import { Subject, takeUntil } from 'rxjs';

import { ISeasonCalendarForm, SeasonCalendarFormService } from '../../services/calendar-form.service';
import { SeasonCalenderService } from './../../services/calender.data.service';

@Component({
  selector: 'seasonal-calendar-create-calender',
  templateUrl: './create-calendar.component.html',
  styleUrls: ['./create-calendar.component.scss'],
})
export class CreateCalendarComponent implements OnInit, OnDestroy {
  /** List of month data to use in select component */
  public months = MONTH_NAMES;

  public monthLabels: string[] = [];

  private componentDestroyed$ = new Subject<boolean>();

  /** Additional form just used to input start and total month numbers */
  public monthForm = this.createMonthForm();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private service: SeasonCalenderService,
    private formService: SeasonCalendarFormService,
    private fb: FormBuilder
  ) {}

  public form: ISeasonCalendarForm;

  // get controls of nested `entry.meta` form
  public get metaFormControls() {
    return this.form.controls.meta.controls;
  }
  public get formValue() {
    return this.form.getRawValue();
  }

  async ngOnInit() {
    await this.service.ready();
    this.form = this.formService.createForm();
  }
  ngOnDestroy(): void {
    this.componentDestroyed$.next(true);
    this.componentDestroyed$.complete();
  }

  async handleSubmit() {
    // show error by indicating all form components interacted with
    this.form.markAllAsTouched();

    this.monthForm.markAllAsTouched();
    if (this.form.valid) {
      await this.service.save(this.formValue);
      this.router.navigate(['../'], { relativeTo: this.route });
    }
  }

  /**
   * A separate form is used to allow track month startIndex and totalCount
   * values, and generate list of month names accordingly
   */
  private createMonthForm() {
    const monthForm = this.fb.nonNullable.group({
      startIndex: new FormControl<number>(null as any, {
        validators: [Validators.required, Validators.min(0)],
        nonNullable: true,
      }),
      totalCount: new FormControl<number>(null as any, {
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
      const monthsData = [...MONTH_NAMES, ...MONTH_NAMES].slice(startIndex, startIndex + totalCount);
      const monthIds = monthsData.map((m) => m.id);
      this.metaFormControls.months.patchValue(monthIds);
      this.monthLabels = monthsData.map((m) => m.label);
    }
  }
}
