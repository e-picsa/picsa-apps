import { Component, OnDestroy } from '@angular/core';
import { PicsaDialogService } from '@picsa/shared/features';
import { generateID } from '@picsa/shared/services/core/db/db.service';
import { RxDocumentData } from 'rxdb';
import { Subject, takeUntil } from 'rxjs';

import { CalendarDataEntry } from '../../schema';
import { SeasonCalenderService } from './../../services/calender.data.service';

@Component({
  selector: 'seasonal-calendar-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnDestroy {
  /** Track current calendar selected from editing from menu popup */
  editableCalendar: CalendarDataEntry;

  private componentDestroyed$ = new Subject();

  public dbCalendars: RxDocumentData<CalendarDataEntry>[] = [];

  constructor(private service: SeasonCalenderService, private dialogService: PicsaDialogService) {
    this.subscribeToDbChanges();
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next(true);
    this.componentDestroyed$.complete();
  }

  public handleMenuClick(e: Event, calendar: CalendarDataEntry) {
    e.stopPropagation();
    this.editableCalendar = calendar;
  }

  public async promptDelete() {
    const dialog = await this.dialogService.open('delete');
    dialog.afterClosed().subscribe(async (shouldDelete) => {
      if (shouldDelete) {
        await this.service.deleteCalenderByName(this.editableCalendar.name);
      }
    });
  }

  public async copyCalendar() {
    const calendarCopy = { ...this.editableCalendar, id: generateID() };
    await this.service.addORUpdateData(calendarCopy, 'add');
  }

  private async subscribeToDbChanges() {
    await this.service.ready();
    const query = this.service.dbUserCollection;
    query.$.pipe(takeUntil(this.componentDestroyed$)).subscribe((docs) => {
      const extractedData = docs.map((doc) => doc._data);
      this.dbCalendars = extractedData;
    });
  }
}
