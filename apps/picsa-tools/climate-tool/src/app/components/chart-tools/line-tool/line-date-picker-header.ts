import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject,OnDestroy } from '@angular/core';
import { DateAdapter, MAT_DATE_FORMATS, MatDateFormats } from '@angular/material/core';
import { MatCalendar } from '@angular/material/datepicker';
import { Subject, takeUntil } from 'rxjs';

/** Custom header component for datepicker. */
@Component({
  selector: 'climte-line-date-picker-header',
  styles: [
    `
      .line-date-picker-header {
        display: flex;
        align-items: center;
        padding: 0.5em;
      }

      .line-date-picker-header-label {
        flex: 1;
        height: 1em;
        font-weight: 500;
        text-align: center;
      }

      .example-double-arrow .mat-icon {
        margin: -22%;
      }
    `,
  ],
  template: `
    <div class="line-date-picker-header">
      <button mat-icon-button (click)="previousClicked('month')">
        <mat-icon>keyboard_arrow_left</mat-icon>
      </button>
      <span class="line-date-picker-header-label">{{ periodLabel }}</span>
      <button mat-icon-button (click)="nextClicked('month')">
        <mat-icon>keyboard_arrow_right</mat-icon>
      </button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class LineDatePickerHeaderComponent<D> implements OnDestroy {
  private _calendar = inject<MatCalendar<D>>(MatCalendar);
  private _dateAdapter = inject<DateAdapter<D>>(DateAdapter);
  private _dateFormats = inject<MatDateFormats>(MAT_DATE_FORMATS);

  private _destroyed = new Subject<void>();

  constructor() {
    const _calendar = this._calendar;
    const cdr = inject(ChangeDetectorRef);

    _calendar.stateChanges.pipe(takeUntil(this._destroyed)).subscribe(() => cdr.markForCheck());
  }

  ngOnDestroy() {
    this._destroyed.next();
    this._destroyed.complete();
  }

  get periodLabel() {
    return this._dateAdapter
      .format(this._calendar.activeDate, this._dateFormats.display.monthYearLabel)
      .toLocaleUpperCase()
      .split(' ')[0];
  }

  previousClicked(mode: 'month' | 'year') {
    this._calendar.activeDate =
      mode === 'month'
        ? this._dateAdapter.addCalendarMonths(this._calendar.activeDate, -1)
        : this._dateAdapter.addCalendarYears(this._calendar.activeDate, -1);
  }

  nextClicked(mode: 'month' | 'year') {
    this._calendar.activeDate =
      mode === 'month'
        ? this._dateAdapter.addCalendarMonths(this._calendar.activeDate, 1)
        : this._dateAdapter.addCalendarYears(this._calendar.activeDate, 1);
  }
}
