import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { PicsaDialogService } from '@picsa/shared/features';

import { ActivitiesEditorDialogComponent } from '../../components/activities-editor-dialog/activities-editor-dialog.component';
import { CropDialogComponent } from '../../components/crop-dialog-component/crop-dialog-component.component';
import { MonthDialogComponent } from '../../components/month-editor-dialog/crop-dialog-component.component';
import { Crop, MonthData } from '../../schema/schema_v0';
import { SeasonCalenderService } from './../../services/calender.data.service';

@Component({
  selector: 'seasonal-calendar-table',
  templateUrl: './calendar-table.component.html',
  styleUrls: ['./calendar-table.component.scss'],
})
export class CalendarTableComponent implements OnInit {
  calendarData: any;
  months: string[] = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September'];
  crops: string[] = ['Maize', 'Beans', 'Peas'];
  selectedCrop = '';
  customCrop = '';
  showCropAdder = false;

  constructor(
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private router: Router,
    private service: SeasonCalenderService,
    private dialogService: PicsaDialogService
  ) {}

  async ngOnInit() {
    
    await this.service.ready();
    this.route.params.subscribe((params) => {
      const {id} = params;
      if (id) {
        this.fetchData(id)
          .then((resData) => {
            //console.log(resData)
            this.calendarData = resData;
          })
          .catch(() => {
            this.calendarData = null;
          })
          .finally(() => {
            console.log(this.calendarData);
            if (!this.calendarData) {
              this.router.navigate(['/seasonal-calendar']);
            }
          });
      }
    });
  }
  async fetchData(id: string) {
    return await this.service.getCalenderById(id);
  }

  getActivitiesForMonthAndCrop(monthName: string, crop: Crop): string {
    const selectedMonth = crop.months.find((month) => month.month === monthName);
    if (selectedMonth) {
      return selectedMonth.activities.join(',');
    } else {
      return '';
    }
  }
  deleteActivity(crop: Crop, monthName: string, activity: string) {
    const selectedMonth = crop.months.find((month) => month.month === monthName);
    if (selectedMonth) {
      const activityIndex = selectedMonth.activities.indexOf(activity);
      if (activityIndex !== -1) {
        selectedMonth.activities.splice(activityIndex, 1);
      }
    }
  }
  openCropDialog(crop: Crop) {
    const dialogRef = this.dialog.open(CropDialogComponent, {
      data: crop,
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log('closed');
    });
  }

  openMonthHeading(month: MonthData) {
    const dialogRef = this.dialog.open(MonthDialogComponent, {
      data: month,
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log('closed');
    });
  }
  toggleCropAdder() {
    this.showCropAdder = !this.showCropAdder;
  }

  openAddActivityDialog(crop: Crop, month: MonthData) {
    const dialogRef = this.dialog.open(ActivitiesEditorDialogComponent, {
      data: {
        crop,
        month,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const activityToAdd = result;
        const selectedMonth = crop.months.find((m) => m.month === month.month);

        if (selectedMonth) {
          if (!selectedMonth.activities.includes(activityToAdd)) {
            selectedMonth.activities.push(activityToAdd);
          } else {
            console.log('Activity already exists in this month.');
          }
        }
      }
    });
  }
  async deleteCropData(crop: Crop) {
    const dialog = await this.dialogService.open('delete');
    dialog.afterClosed().subscribe(async (shouldDelete) => {
      if (shouldDelete) {
        const cropIndex = this.calendarData.crops.findIndex((c) => c.name === crop.name);
        if (cropIndex !== -1) {
          this.calendarData.crops.splice(cropIndex, 1);
        }
      }
    });
  }

  addNewCrop() {
    let cropName;
    if (this.selectedCrop === 'Other' && this.customCrop.trim() !== '') {
      cropName = this.customCrop;
      this.customCrop = '';
    } else if (this.selectedCrop && this.selectedCrop !== 'Other') {
      cropName = this.selectedCrop;
    }
    if (!this.isCropNameDuplicate(cropName)) {
      const newCrop: Crop = {
        name: cropName,
        months: this.calendarData.timeAndConditions.map((monthData) => ({
          month: monthData.month,
          activities: [],
        })),
        extraInformation: '',
      };

      this.calendarData.crops.push(newCrop);
    } else {
      console.log('Crop with the same name already exists.');
    }
  }

  isCropNameDuplicate(newCropName: string): boolean {
    return this.calendarData.crops.some((crop) => crop.name === newCropName);
  }

  async deleteMonth(monthName: string) {
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
      }
    });
  }

  saveCalendar() {
    console.log(this.calendarData);
    this.service.addORUpdateData(this.calendarData, 'update');
    this.router.navigate(['/seasonal-calendar']);
  }
}
