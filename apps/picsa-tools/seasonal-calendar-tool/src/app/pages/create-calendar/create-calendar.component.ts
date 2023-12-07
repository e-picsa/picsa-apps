import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PicsaTranslateService } from '@picsa/shared/modules';

import { SeasonCalenderService } from './../../services/calender.data.service';

@Component({
  selector: 'seasonal-calendar-create-calender',
  templateUrl: './create-calendar.component.html',
  styleUrls: ['./create-calendar.component.scss'],
})
export class CreateCalendarComponent implements OnInit {
  data;

  constructor(private router: Router, private service: SeasonCalenderService, translateService:PicsaTranslateService) {
    this.generateCalendarMonths();
    this.data = this.router?.getCurrentNavigation()?.extras?.state;
    //console.log(this.data);
  }
  calenderTitle = '';
  selectedCrop = '';
  selectedActivity = '';
  customCrop = '';

  userCrops: string[] = [];

  calendarMonths: { weather: string; month: string }[] = [];

  months: string[] = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  message = 'Please fill all the fields.';
  showMessageFlag = false;

  private _numMonths  =0;
  private _startMonth = ''
  

  @Input() set numMonths(value: number) {
    this._numMonths = value;
    this.generateCalendarMonths();
  }

  get numMonths(): number {
    return this._numMonths;
  }

  @Input() set startMonth(value: string) {
    this._startMonth = value;
    this.generateCalendarMonths();
  }

  get startMonth(): string {
    return this._startMonth;
  }
  async ngOnInit() {
    await this.service.ready();
    
  }
  

  generateCalendarMonths() {
    const startIndex = this.months.indexOf(this.startMonth);
    this.calendarMonths = [];
    for (let i = 0; i < this.numMonths; i++) {
      const index = (startIndex + i) % 12;
      this.calendarMonths.push({ month: this.months[index], weather: '' });
    }
  }

  getWeatherCondition(month: string): string {
    const selectedMonth = this.calendarMonths.find((item) => item.month === month);
    return selectedMonth ? selectedMonth.weather : '';
  }
  

  onSubmition() {
    if (this.calendarMonths.length > 0 && this.userCrops.length > 0 && this.calenderTitle) {
      const data = {
        name: this.calenderTitle,
        crops: this.userCrops,
        timeAndConditions: this.calendarMonths,
      };
      this.service.addORUpdateData(data, 'add');
      this.router.navigate(['/seasonal-calendar']);
    } else {
      // verify fields
      this.showMessageFlag = true;
    }
  }
}
