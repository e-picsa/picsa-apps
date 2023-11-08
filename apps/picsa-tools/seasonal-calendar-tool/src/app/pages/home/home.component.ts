import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { PicsaDialogService } from '@picsa/shared/features';
import { Subject, takeUntil } from 'rxjs';

import { SeasonCalenderService } from './../../services/calender.data.service';

@Component({
  selector: 'seasonal-calendar-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnDestroy {
  editMode = -1;

  private componentDestroyed$ = new Subject();
  public dbCalendars: any = [];

  constructor(
    private router: Router,
    private service: SeasonCalenderService,
    private dialogService: PicsaDialogService
  ) {
    this.subscribeToDbChanges();
  }

  private async subscribeToDbChanges() {
    await this.service.ready();

    const query = this.service.dbUserCollection;
    query.$.pipe(takeUntil(this.componentDestroyed$)).subscribe((docs) => {
      const extractedData = docs.map((doc) => doc._data);
      //console.log(extractedData);
      this.dbCalendars = extractedData;
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
        await this.service.deleteCalenderByName(this.dbCalendars[index].name);
      }
    });
  }

  getCalendarsAsArray(calenderObject): any[] {
    return Object.keys(calenderObject).map((key) => calenderObject[key]);
  }

  async saveUpdates(calendar: any) {
    await this.service.addORUpdateData(calendar, 'update');
    this.editMode = -1;
  }

  redirectToCalendarTable(calendarName: string, index) {
    this.router.navigate(['/seasonal-calendar/calendar-table', { calendarName }]);
  }
}
