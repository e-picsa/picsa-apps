import { Injectable } from '@angular/core';
import { DateAdapter } from '@angular/material/core';
import { DateRange, MatDateRangeSelectionStrategy } from '@angular/material/datepicker';

@Injectable()
export class LineDatePickerSelectionStrategy<D> implements MatDateRangeSelectionStrategy<D> {
  constructor(private _dateAdapter: DateAdapter<D>) {}

  selectionFinished(date: D | null): DateRange<D> {
    return this.selectAsWeek(date);
  }

  createPreview(activeDate: D | null): DateRange<D> {
    return this.selectAsWeek(activeDate);
  }

  /** Take any date selected and return as the calendar week for that day */
  private selectAsWeek(date: D | null): DateRange<D> {
    if (date) {
      const offset = this._dateAdapter.getDayOfWeek(date);
      const start = this._dateAdapter.addCalendarDays(date, -offset);
      const end = this._dateAdapter.addCalendarDays(date, 6 - offset);
      return new DateRange<D>(start, end);
    }

    return new DateRange<D>(null, null);
  }
}
