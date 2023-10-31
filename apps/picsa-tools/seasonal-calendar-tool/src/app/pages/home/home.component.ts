import { Component, OnDestroy } from '@angular/core';
import {  Router } from '@angular/router';
import { PicsaDialogService } from '@picsa/shared/features';
import { RxDocument } from 'rxdb';
import { Subject, takeUntil } from 'rxjs';

import {  CalendarDataEntry } from '../../schema';
import {  SeasonCalenderService } from './../../services/calender.data.service';

@Component({
  selector: 'seasonal-calendar-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})

export class HomeComponent implements OnDestroy {
  private componentDestroyed$ = new Subject();
  public dbCalendars: RxDocument<CalendarDataEntry>[] = [];

  constructor(private router: Router, private service: SeasonCalenderService,  private dialogService: PicsaDialogService) {
    this.subscribeToDbChanges();
  }

  private async subscribeToDbChanges() {
    await this.service.initialise();

    const query = this.service.dbUserCollection;
    query.$.pipe(takeUntil(this.componentDestroyed$)).subscribe((docs) => {
      this.dbCalendars = docs;
    });
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next(true);
    this.componentDestroyed$.complete();
  }

  // ngOnInit() {
  //  // this.calendars = this.getCalendarsAsArray(this.dataService.calendars)
  //  console.log(this.dbCalendars)
  // }

  
  
  public async promptDelete(index: number) {
    const dialog = await this.dialogService.open('delete');
    dialog.afterClosed().subscribe(async (shouldDelete) => {
      if (shouldDelete) {
        //
        this.service.deleteCalender(this.dbCalendars[index]);
      }
    });

    
  }


  getCalendarsAsArray(calenderObject): any[] {
    return Object.keys(calenderObject).map((key) => calenderObject[key]);
  }

  redirectToCalendarTable(calendarName: string, index) { 
    this.router.navigate(['/seasonal-calendar/calendar-table',{calendarName}]);
  }
}
 