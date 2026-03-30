import { ChangeDetectionStrategy, Component, inject, OnDestroy, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { PicsaTranslateModule } from '@picsa/i18n/src';
import { PicsaDialogService } from '@picsa/shared/features';
import { RxDocument } from 'rxdb';
import { Subject, takeUntil } from 'rxjs';

import { SeasonalCalendarMaterialModule } from '../../components/material.module';
import { CalendarDataEntry } from '../../schema';
import { SeasonCalendarService } from '../../services/calendar.data.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'seasonal-calendar-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [RouterLink, SeasonalCalendarMaterialModule, PicsaTranslateModule],
})
export class HomeComponent implements OnDestroy {
  private service = inject(SeasonCalendarService);
  dialog = inject(MatDialog);
  private dialogService = inject(PicsaDialogService);

  private componentDestroyed$ = new Subject();

  /** Track which rx document entry is target for menu actions */
  private menuTargetEntry: RxDocument<CalendarDataEntry>;

  public dbCalendars = signal<RxDocument<CalendarDataEntry>[]>([]);

  /** Input dialog used when copying form */
  public copyName = signal('');

  constructor() {
    this.subscribeToDbChanges();
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next(true);
    this.componentDestroyed$.complete();
  }

  /** When opening action menu ensure active calendar saved to track with dialog actions */
  public handleMenuClick(e: Event, entry: RxDocument<CalendarDataEntry>) {
    e.stopPropagation();
    this.menuTargetEntry = entry;
    // ensure copy dialog populated with name
    this.copyName.set(entry.name);
  }

  public async promptDelete() {
    const entry = this.menuTargetEntry;
    if (entry) {
      const dialog = await this.dialogService.open('delete');
      dialog.afterClosed().subscribe(async (shouldDelete) => {
        if (shouldDelete) {
          await entry.remove();
        }
      });
    }
  }

  public async saveCopy() {
    await this.service.save({ ...this.menuTargetEntry._data, name: this.copyName() });
    this.dialog.closeAll();
  }

  private async subscribeToDbChanges() {
    await this.service.ready();
    const query = this.service.dbUserCollection;
    query.$.pipe(takeUntil(this.componentDestroyed$)).subscribe((docs) => {
      this.dbCalendars.set(docs);
    });
  }
}
