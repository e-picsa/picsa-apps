import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MONTH_NAMES } from '@picsa/data';
import { combineLatest, Subject, takeUntil } from 'rxjs';

import { SeasonCalendarFormService } from '../../services/calendar-form.service';
import { SeasonCalenderService } from './../../services/calender.data.service';

@Component({
  selector: 'seasonal-calendar-create-calender',
  templateUrl: './create-calendar.component.html',
  styleUrls: ['./create-calendar.component.scss'],
})
export class CreateCalendarComponent implements OnInit, OnDestroy {
  /** List of month data to use in select component */
  public months = MONTH_NAMES;

  /** Generated list of month names defined by form startMonth and timePeriod data */
  public monthPreview: string[] = [];

  private componentDestroyed$ = new Subject<boolean>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private service: SeasonCalenderService,
    private formService: SeasonCalendarFormService
  ) {}

  public get form() {
    return this.formService.form;
  }

  // get controls of nested `entry.meta` form
  public get metaFormControls() {
    return this.form.controls.meta.controls;
  }
  public get formValue() {
    return this.formService.value;
  }

  async ngOnInit() {
    await this.service.ready();
    this.formService.create();
    this.generateMonthPreview();
  }
  ngOnDestroy(): void {
    this.componentDestroyed$.next(true);
    this.componentDestroyed$.complete();
  }

  async handleSubmit() {
    // show error by indicating all form components interacted with
    this.form.markAllAsTouched();
    if (this.form.valid) {
      await this.service.save(this.formValue);
      this.router.navigate(['../'], { relativeTo: this.route });
    }
  }

  /**
   * When the user specifies start month and total months generate an array of the names of all months that would cover
   * the period. E.g. startMonth:2 timePeriods:3 => ['March','April','May']
   * This is used to provide a visual preview of the month data
   */
  private generateMonthPreview() {
    const { startMonth, timePeriods } = this.metaFormControls;
    // combine values from both startMonth and timePeriod value emitters
    combineLatest([startMonth.valueChanges, timePeriods.valueChanges])
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(([startMonth, timePeriods]) => {
        if (startMonth !== null && timePeriods !== null) {
          this.monthPreview = [...MONTH_NAMES, ...MONTH_NAMES]
            .slice(startMonth, timePeriods + startMonth)
            .map((m) => m.label);
        }
      });
  }
}
