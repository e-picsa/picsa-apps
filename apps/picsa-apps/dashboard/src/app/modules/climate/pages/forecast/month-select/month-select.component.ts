import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepicker, MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormField, MatLabel } from '@angular/material/form-field';
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

/**
   public yearOptions = signal(this.calcYearOptions());

  public yearSelected = signal(new Date().getFullYear());

  public monthOptions = computed(() => this.calcMonthOptions(this.yearSelected()));

  // Use linked signal so that when year is changed default value is set (but user can override)
  public monthSelected = linkedSignal(() => {
    const options = this.monthOptions();
    return options[options.length - 1];
  });

  private calcYearOptions() {
    const currentYear = new Date().getFullYear();
    const startYear = 2024;
    return [...Array(currentYear - startYear + 1).keys()].map((v) => v + startYear);
  }

  private calcMonthOptions(yearSelected: number) {
    const monthNumbers = [...Array(12).keys()];
    const currentYear = new Date().getFullYear();
    console.log({ monthNumbers, yearSelected });
    if (yearSelected === currentYear) {
      const currentMonth = new Date().getMonth();
      return monthNumbers.filter((v) => v <= currentMonth);
    }
    return monthNumbers;
  }
 */
