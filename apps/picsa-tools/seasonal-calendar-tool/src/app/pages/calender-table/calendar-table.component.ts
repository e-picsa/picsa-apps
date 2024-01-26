import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CROPS_DATA, MONTH_DATA } from '@picsa/data';
import { arrayToHashmap } from '@picsa/utils';
import { debounceTime, startWith, Subject, takeUntil } from 'rxjs';

import { ISeasonCalendarForm, SeasonCalendarFormService } from '../../services/calendar-form.service';
import { SeasonCalenderService } from './../../services/calender.data.service';

@Component({
  selector: 'seasonal-calendar-table',
  templateUrl: './calendar-table.component.html',
  styleUrls: ['./calendar-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarTableComponent implements OnInit, OnDestroy {
  /** Table column labels (e.g. names of months) */
  public columnLabels: string[] = [];

  /** Table row labels (e.g. names of crops) */
  public rowLabels: string[] = [];

  /** Toggle whether to enable editing features (names and crops) */
  public editMode = false;

  /** Lookup for month labels displayed in header row */
  private monthsById = arrayToHashmap(MONTH_DATA, 'id');

  /** Lookup for crop labels displayed in table rows */
  private cropsByName = arrayToHashmap(CROPS_DATA as any as { name: string; label: string }[], 'name');

  public form: ISeasonCalendarForm;

  public get metaFormControls() {
    return this.form.controls.meta.controls;
  }
  public get activityFormControls() {
    return this.form.controls.activities.controls;
  }

  public get formValue() {
    return this.form.getRawValue();
  }

  private componentDestroyed$ = new Subject<boolean>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: SeasonCalenderService,
    private formService: SeasonCalendarFormService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    await this.service.ready();
    const { id } = this.route.snapshot.params;
    if (id) {
      const calendar = await this.service.getCalendarById(id);
      if (calendar) {
        this.form = this.formService.createForm(calendar);
        console.log({ calendar, form: this.form, formValue: this.formValue });
        this.enableFormAutoSave();
        this.cdr.markForCheck();
        this.subscribeToFormChanges();
        return;
      }
    }
    // redirect to home page if data has not been loaded successfully
    this.router.navigate(['/seasonal-calendar']);
  }

  ngOnDestroy() {
    this.componentDestroyed$.next(true);
  }

  private enableFormAutoSave() {
    this.form.valueChanges.pipe(takeUntil(this.componentDestroyed$), debounceTime(500)).subscribe((v) => {
      this.service.save(this.formValue);
    });
  }

  private subscribeToFormChanges() {
    // Generate list of month labels from ids
    this.metaFormControls.months.valueChanges
      .pipe(takeUntil(this.componentDestroyed$), startWith(this.formValue.meta.months))
      .subscribe((months) => {
        this.columnLabels = months.map((month) => this.monthsById[month]?.label);
      });
    // Generate array of rowLabels from crops
    this.metaFormControls.crops.valueChanges
      .pipe(takeUntil(this.componentDestroyed$), startWith(this.formValue.meta.crops))
      .subscribe((crops) => {
        this.rowLabels = crops.map((crop) => this.cropsByName[crop]?.label);
      });
  }

  public getActivitiesForMonthAndCrop(monthName: string, crop: any): string {
    const selectedMonth = crop.months.find((month) => month.month === monthName);
    if (selectedMonth) {
      return selectedMonth.activities.join(',');
    } else {
      return '';
    }
  }
}
