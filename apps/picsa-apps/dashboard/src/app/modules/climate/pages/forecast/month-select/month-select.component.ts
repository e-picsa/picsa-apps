import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepicker, MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormField } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'dashboard-climate-forecast-month-select',
  imports: [DatePipe, MatButton, MatDatepickerModule, MatFormField, MatInputModule],
  templateUrl: './month-select.component.html',
  styleUrl: './month-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // https://material.angular.io/components/datepicker/overview#choosing-a-date-implementation-and-date-format-settings
  providers: [provideNativeDateAdapter()],
})
export class DashboardClimateMonthSelectComponent {
  public dateSelected = signal(new Date());

  public minDate = new Date('2024-06-01T12:00:00');
  public maxDate = new Date();

  public dateChanged = output<Date>();

  public setMonthAndYear(date: Date, picker: MatDatepicker<any>) {
    this.dateSelected.set(date);
    picker.close();
    this.dateChanged.emit(date);
  }
}
