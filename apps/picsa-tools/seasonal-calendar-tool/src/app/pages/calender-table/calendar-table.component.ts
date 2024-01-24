import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { CROPS_DATA, MONTH_NAMES } from '@picsa/data';
import { arrayToHashmap } from '@picsa/utils';
import { startWith, Subject, takeUntil } from 'rxjs';

import { SeasonCalendarFormService } from '../../services/calendar-form.service';
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
  private monthsById = arrayToHashmap(MONTH_NAMES, 'id');

  /** Lookup for crop labels displayed in table rows */
  private cropsByName = arrayToHashmap(CROPS_DATA as any as { name: string; label: string }[], 'name');

  public get form() {
    return this.formService.form;
  }
  public get metaFormControls() {
    return this.form.controls.meta.controls;
  }
  public get activityFormControls() {
    return this.form.controls.activities.controls;
  }

  public get formValue() {
    return this.formService.value;
  }

  private componentDestroyed$ = new Subject<boolean>();

  constructor(
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private router: Router,
    private service: SeasonCalenderService,
    private formService: SeasonCalendarFormService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    await this.service.ready();
    const { id } = this.route.snapshot.params;
    if (id) {
      const calendar = await this.service.loadCalenderById(id);
      console.log({ calendar, form: this.formService.form, formValue: this.formService.value });
      if (calendar) {
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
    this.form.valueChanges.pipe(takeUntil(this.componentDestroyed$)).subscribe((v) => {
      console.log('save form', v);
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
  // public deleteActivity(crop: CropEntry, monthName: string, activity: string) {
  //   // const selectedMonth = crop.months.find((month) => month.month === monthName);
  //   // if (selectedMonth) {
  //   //   const activityIndex = selectedMonth.activities.indexOf(activity);
  //   //   if (activityIndex !== -1) {
  //   //     selectedMonth.activities.splice(activityIndex, 1);
  //   //     this.autoDbUpdate();
  //   //   }
  //   // }
  // }
  // public openCropDialog(crop: CropEntry) {
  //   // const dialogRef = this.dialog.open(CropDialogComponent, {
  //   //   data: crop,
  //   // });
  //   // dialogRef.afterClosed().subscribe((result) => {
  //   //   console.log('closed');
  //   //   this.autoDbUpdate();
  //   // });
  // }

  public openAddActivityDialog(crop: any, period: any) {
    // const dialogRef = this.dialog.open(ActivitiesEditorDialogComponent, {
    //   data: {
    //     crop,
    //     period,
    //   },
    // });
    // dialogRef.afterClosed().subscribe((result) => {
    //   // if (result) {
    //   //   const activityToAdd = result;
    //   //   const selectedMonth = crop.months.find((m) => m.month === period.month);
    //   //   if (selectedMonth) {
    //   //     if (!selectedMonth.activities.includes(activityToAdd)) {
    //   //       selectedMonth.activities.push(activityToAdd);
    //   //       this.autoDbUpdate();
    //   //     } else {
    //   //       console.log('Activity already exists in this month.');
    //   //     }
    //   //   }
    //   // }
    // });
  }
  // public async deleteCropData(crop: CropEntry) {
  //   const dialog = await this.dialogService.open('delete');
  //   dialog.afterClosed().subscribe(async (shouldDelete) => {
  //     if (shouldDelete) {
  //       const cropIndex = this.calendarData.crops.findIndex((c) => c.name === crop.name);
  //       if (cropIndex !== -1) {
  //         this.calendarData.crops.splice(cropIndex, 1);
  //         //update db
  //         this.autoDbUpdate();
  //       }
  //     }
  //   });
  // }

  public addNewCrop() {
    // for (let i = 0; i < this.userCropNames.length; i++)
    //   //skip crops that already exist
    //   if (!this.isCropNameDuplicate(this.userCropNames[i])) {
    //     const newCrop: CropEntry = {
    //       name: this.userCropNames[i],
    //       months: this.calendarData.timeAndConditions.map((CalendarPeriod) => ({
    //         period: CalendarPeriod.month,
    //         activities: [],
    //       })),
    //       extraInformation: '',
    //     };
    //     this.calendarData.crops.push(newCrop);
    //   }
    // this.autoDbUpdate();
    // this.showCropAdder = false;
  }

  private async deleteMonth(monthName: string) {
    // const dialog = await this.dialogService.open('delete');
    // dialog.afterClosed().subscribe(async (shouldDelete) => {
    //   if (shouldDelete) {
    //     // Delete the month from timeAndConditions
    //     this.calendarData.timeAndConditions = this.calendarData.timeAndConditions.filter(
    //       (month) => month.month !== monthName
    //     );
    //     // Delete the month from each crop's months array
    //     this.calendarData.crops.forEach((crop) => {
    //       crop.months = crop.months.filter((month) => month.month !== monthName);
    //     });
    //     this.autoDbUpdate();
    //   }
    // });
  }
}
