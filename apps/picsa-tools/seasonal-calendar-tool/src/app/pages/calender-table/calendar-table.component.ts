import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router'

import { CalendarData,Crop,DataService } from './../../services/calender.data.service';

@Component({
  selector: 'seasonal-calendar-table',
  templateUrl: './calendar-table.component.html',
  styleUrls: ['./calendar-table.component.scss'],
})

export class CalendarTableComponent implements OnInit  {
  calendarData: CalendarData;
  months: string[] = [
    'January', 'February', 'March', 'April',
    'May', 'June', 'July', 'August',
    'September',
  ];
  constructor(private route: ActivatedRoute, private dataService: DataService, private router: Router) {}

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const calendarName = params.get('calendarName');
      if(calendarName){
      this.calendarData = this.dataService.calendars[calendarName]
      if (!this.calendarData || Object.keys(this.calendarData).length === 0) {
        this.router.navigate(['/seasonal-calendar']);
      }
      }
    });
  }
 
  crops: string[] = ['Beans', 'Maize', 'Peas', 'Wheat', 'Barley']; 

  dataSource: MatTableDataSource<any>;

  getActivitiesForMonthAndCrop(monthName: string, crop: Crop): string {
    const selectedMonth = crop.months.find((month) => month.month === monthName);
    if (selectedMonth) {
      return selectedMonth.activities.join(','); 
    } else {
      return ''; 
    }
  }
  
}
