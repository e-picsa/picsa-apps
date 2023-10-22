import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';

import { ActivitiesEditorDialogComponent } from '../../components/activities-editor-dialog/activities-editor-dialog.component';
import { CropDialogComponentComponent } from '../../components/crop-dialog-component/crop-dialog-component.component';
import { Crop, MonthData } from '../../schema/schema_v0'
import {  SeasonCalenderService } from './../../services/calender.data.service';



@Component({
  selector: 'seasonal-calendar-table',
  templateUrl: './calendar-table.component.html',
  styleUrls: ['./calendar-table.component.scss'],
})
export class CalendarTableComponent implements OnInit {
  calendarData: any;
  months: string[] = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September'];
  constructor(private route: ActivatedRoute,private dialog: MatDialog, private router: Router, private service: SeasonCalenderService,  ) {
     this.initaliseDb()
  }

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const calendarName = params.get('calendarName');
      if (calendarName) {
         this.fetchData(calendarName).then((resData)=>{
          //console.log(resData)
          this.calendarData = resData;
         }).catch(()=>{
           this.calendarData = null
         }).finally(()=>{
          console.log(this.calendarData) 
          if (!this.calendarData ) {
            this.router.navigate(['/seasonal-calendar']);
          }
         })    
      }
    });
  }
  async fetchData(calendarName: string){
   return await this.service.getCalenderByName(calendarName);
  }
  private async initaliseDb() {
    await this.service.initialise();
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
    const dialogRef = this.dialog.open(CropDialogComponentComponent, {
      data: crop, 
    });
  
    dialogRef.afterClosed().subscribe((result) => {
      console.log("closed")

    });
  }

  openAddActivityDialog(crop: Crop, month: MonthData) {
    const dialogRef = this.dialog.open(ActivitiesEditorDialogComponent, {
      data: {
        crop,
        month
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

  saveCalendar(){
    console.log(this.calendarData)
    this.service.addORUpdateData(this.calendarData, 'update')
    this.router.navigate(['/seasonal-calendar']);
  }

}
