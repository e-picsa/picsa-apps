import { Component, inject, OnDestroy } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { PicsaDialogService } from '@picsa/shared/features';
import { generateID } from '@picsa/shared/services/core/db/db.service';
import { RxDocument } from 'rxdb';
import { Subject, takeUntil } from 'rxjs';

import { SeasonalCalendarMaterialModule } from '../../components/material.module';
import { CalendarDataEntry } from '../../schema';
import { SeasonCalendarService } from '../../services/calendar.data.service';
import { ISeasonCalendarForm, SeasonCalendarFormService } from '../../services/calendar-form.service';

@Component({
  selector: 'seasonal-calendar-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [RouterLink, FormsModule, SeasonalCalendarMaterialModule, ReactiveFormsModule, TranslatePipe],
})
export class HomeComponent implements OnDestroy {
  private service = inject(SeasonCalendarService);
  dialog = inject(MatDialog);
  private dialogService = inject(PicsaDialogService);
  private formService = inject(SeasonCalendarFormService);

  /** Track current calendar selected from editing from menu popup */
  public calendarCopyForm: ISeasonCalendarForm;
  public calendarDeleteDoc: RxDocument<CalendarDataEntry>;

  private componentDestroyed$ = new Subject();

  public dbCalendars: RxDocument<CalendarDataEntry>[] = [];

  constructor() {
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
    this.calendarCopyForm = this.formService.createForm({ ...calendar._data, id: generateID() });
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
