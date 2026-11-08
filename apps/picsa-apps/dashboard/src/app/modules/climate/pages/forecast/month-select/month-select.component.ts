import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepicker, MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormField } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'dashboard-climate-forecast-month-select',
  imports: [DatePipe, MatButtonModule, MatDatepickerModule, MatFormField, MatInputModule, MatIconModule],
  templateUrl: './month-select.component.html',
  styleUrls: ['./month-select.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideNativeDateAdapter()],
})
export class DashboardClimateMonthSelectComponent {
  public dateSelected = signal(new Date());

  public minDate = new Date('2024-06-01T12:00:00');
  public maxDate = new Date();

  public dateChanged = output<Date>();

  private yearMonth = (date: Date) => date.getFullYear() * 12 + date.getMonth();

  /** Stepper bounds follow the picker limits - never into the future */
  public canPrevious = computed(() => this.yearMonth(this.dateSelected()) > this.yearMonth(this.minDate));
  public canNext = computed(() => this.yearMonth(this.dateSelected()) < this.yearMonth(this.maxDate));

  public stepMonth(offset: 1 | -1) {
    const current = this.dateSelected();
    const stepped = new Date(current.getFullYear(), current.getMonth() + offset, 1);
    if (offset < 0 && !this.canPrevious()) return;
    if (offset > 0 && !this.canNext()) return;
    this.setMonthAndYear(stepped);
  }

  public setMonthAndYear(date: Date, picker?: MatDatepicker<any>) {
    this.dateSelected.set(date);
    picker?.close();
    this.dateChanged.emit(date);
  }
}
