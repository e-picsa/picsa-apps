import { Component, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PicsaDialogService } from '@picsa/shared/features';
import { generateid } from '@picsa/shared/services/core/db/db.service';
import { RxDocument } from 'rxdb';
import { Subject, takeUntil } from 'rxjs';

import { CalendarDataEntry } from '../../schema';
import { SeasonCalendarService } from '../../services/calendar.data.service';
import { ISeasonCalendarForm, SeasonCalendarFormService } from '../../services/calendar-form.service';

@Component({
  selector: 'seasonal-calendar-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnDestroy {
  /** Track current calendar selected from editing from menu popup */
  public calendarCopyForm: ISeasonCalendarForm;
  public calendarDeleteDoc: RxDocument<CalendarDataEntry>;

  private componentDestroyed$ = new Subject();

  public dbCalendars: RxDocument<CalendarDataEntry>[] = [];

  constructor(
    private service: SeasonCalendarService,
    public dialog: MatDialog,
    private dialogService: PicsaDialogService,
    private formService: SeasonCalendarFormService
  ) {
    this.subscribeToDbChanges();
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next(true);
    this.componentDestroyed$.complete();
  }

  /** When opening action menu ensure active calendar saved to track with dialog actions */
  public handleMenuClick(e: Event, calendar: RxDocument<CalendarDataEntry>) {
    e.stopPropagation();
    this.calendarDeleteDoc = calendar;
    this.calendarCopyForm = this.formService.createForm({ ...calendar._data, id: generateid() });
  }

  public async promptDelete() {
    const dialog = await this.dialogService.open('delete');
    dialog.afterClosed().subscribe(async (shouldDelete) => {
      if (shouldDelete) {
        await this.calendarDeleteDoc.remove();
      }
    });
  }

  public async saveCopy() {
    await this.service.save(this.calendarCopyForm.getRawValue());
    this.dialog.closeAll();
  }

  private async subscribeToDbChanges() {
    await this.service.ready();
    const query = this.service.dbUserCollection;
    query.$.pipe(takeUntil(this.componentDestroyed$)).subscribe((docs) => {
      this.dbCalendars = docs;
    });
  }
}
