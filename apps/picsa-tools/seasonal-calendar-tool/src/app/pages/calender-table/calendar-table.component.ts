import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { MONTH_NAMES } from '@picsa/data';
import { PicsaDialogService } from '@picsa/shared/features';

import { ActivitiesEditorDialogComponent } from '../../components/activities-editor-dialog/activities-editor-dialog.component';
import { CropDialogComponent } from '../../components/crop-dialog-component/crop-dialog-component.component';
import { MonthDialogComponent } from '../../components/month-editor-dialog/crop-dialog-component.component';
import { CalendarDataEntry, CalendarPeriod, CropEntry } from '../../schema';
import { SeasonCalenderService } from './../../services/calender.data.service';

@Component({
  selector: 'seasonal-calendar-table',
  templateUrl: './calendar-table.component.html',
  styleUrls: ['./calendar-table.component.scss'],
})
export class CalendarTableComponent implements OnInit {
  calendarData: CalendarDataEntry;
  months = MONTH_NAMES;
  selectedCrop = '';
  customCrop = '';
  showCropAdder = false;
  userCropNames: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private router: Router,
    private service: SeasonCalenderService,
    private dialogService: PicsaDialogService
  ) {}

  async ngOnInit() {
    await this.service.ready();
    const { id } = this.route.snapshot.params;
    if (id) {
      const data = await this.service.getCalenderById(id);
      if (data) {
        this.calendarData = data;
        this.userCropNames = this.calendarData.crops.map((crop) => crop.name);
        return;
      }
    }
    // redirect to home page if data has not been loaded successfully
    this.router.navigate(['/seasonal-calendar']);
  }

  public getActivitiesForMonthAndCrop(monthName: string, crop: CropEntry): string {
    const selectedMonth = crop.months.find((month) => month.month === monthName);
    if (selectedMonth) {
      return selectedMonth.activities.join(',');
    } else {
      return '';
    }
  }
  public deleteActivity(crop: CropEntry, monthName: string, activity: string) {
    const selectedMonth = crop.months.find((month) => month.month === monthName);
    if (selectedMonth) {
      const activityIndex = selectedMonth.activities.indexOf(activity);
      if (activityIndex !== -1) {
        selectedMonth.activities.splice(activityIndex, 1);
        this.autoDbUpdate();
      }
    }
  }
  public openCropDialog(crop: CropEntry) {
    const dialogRef = this.dialog.open(CropDialogComponent, {
      data: crop,
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log('closed');
      this.autoDbUpdate();
    });
  }

  public openMonthHeading(period: CalendarPeriod) {
    const dialogRef = this.dialog.open(MonthDialogComponent, {
      data: period,
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log('closed');
      this.autoDbUpdate();
    });
  }
  public toggleCropAdder() {
    this.showCropAdder = !this.showCropAdder;
  }

  public openAddActivityDialog(crop: CropEntry, period: CalendarPeriod) {
    const dialogRef = this.dialog.open(ActivitiesEditorDialogComponent, {
      data: {
        crop,
        period,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const activityToAdd = result;
        const selectedMonth = crop.months.find((m) => m.month === period.month);

        if (selectedMonth) {
          if (!selectedMonth.activities.includes(activityToAdd)) {
            selectedMonth.activities.push(activityToAdd);
            this.autoDbUpdate();
          } else {
            console.log('Activity already exists in this month.');
          }
        }
      }
    });
  }
  public async deleteCropData(crop: CropEntry) {
    const dialog = await this.dialogService.open('delete');
    dialog.afterClosed().subscribe(async (shouldDelete) => {
      if (shouldDelete) {
        const cropIndex = this.calendarData.crops.findIndex((c) => c.name === crop.name);
        if (cropIndex !== -1) {
          this.calendarData.crops.splice(cropIndex, 1);
          //update db
          this.autoDbUpdate();
        }
      }
    });
  }

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

  public async deleteMonth(monthName: string) {
    const dialog = await this.dialogService.open('delete');
    dialog.afterClosed().subscribe(async (shouldDelete) => {
      if (shouldDelete) {
        // Delete the month from timeAndConditions
        this.calendarData.timeAndConditions = this.calendarData.timeAndConditions.filter(
          (month) => month.month !== monthName
        );

        // Delete the month from each crop's months array
        this.calendarData.crops.forEach((crop) => {
          crop.months = crop.months.filter((month) => month.month !== monthName);
        });
        this.autoDbUpdate();
      }
    });
  }

  public saveCalendar() {
    //console.log(this.calendarData);
    this.service.addORUpdateData(this.calendarData, 'update');
    this.router.navigate(['/seasonal-calendar']);
  }

  private autoDbUpdate() {
    //upadate db
    this.service.addORUpdateData(this.calendarData, 'update');
    //refreash crop names
    this.userCropNames = this.calendarData.crops.map((crop: any) => crop.name);
  }

  private isCropNameDuplicate(newCropName: string): boolean {
    return this.calendarData.crops.some((crop) => crop.name === newCropName);
  }
}
