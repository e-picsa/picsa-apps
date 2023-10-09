import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { DataService } from './../../services/calender.data.service';

@Component({
  selector: 'seasonal-calendar-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  constructor(private router: Router ,public dataService: DataService) { }
  calendars;

  ngOnInit() {
    // //confirm data sharing
    // console.log(this.dataService.calendars)
    this.calendars = this.getCalendarsAsArray(this.dataService.calendars)
  }
  
  getCalendarsAsArray(calenderObject): any[] {
    return Object.keys(calenderObject).map((key) => calenderObject[key]);
  }
  redirectToCalendarTable(calendarName: string) {
    
    this.router.navigate(['/seasonal-calendar/calendar-table',{calendarName}] );
  }
}
 