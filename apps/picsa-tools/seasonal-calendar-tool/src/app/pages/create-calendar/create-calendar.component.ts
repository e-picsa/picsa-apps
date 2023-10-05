import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';

import { DataService } from './../../services/calender.data.service';
@Component({
  selector: 'seasonal-calendar-create-calender',
  templateUrl: './create-calendar.component.html',
  styleUrls: ['./create-calendar.component.scss'],
})


export class CreateCalendarComponent {
  
  constructor(private router: Router, private dataService: DataService) {
    this.generateCalendarMonths();
  }
  calenderTitle = "";
  crops: string[] = ["Maize", "Beans", "Peas"];
  activities: string[] = ["Planting", "Weeding", "Preparation", "Harvesting", "Drying"];
  selectedCrop = "";
  selectedActivity = "";
  customCrop = ''

  userCrops: string[] = [];

  
  calendarMonths: {weather:string, month:string}[]= [];


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
    'December'
  ];

 
  private _numMonths = 0;
  private _startMonth = '';

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
  

  addActivity() {
    if (this.selectedActivity && !this.activities.includes(this.selectedActivity)) {
      this.activities.push(this.selectedActivity);
      this.selectedActivity = "";
    }
  }


  addCrop() {
    if (this.selectedCrop === 'Other' && this.customCrop.trim() !== '') {
      this.userCrops.push(this.customCrop);
      this.customCrop = ''; 
    } else if (this.selectedCrop && this.selectedCrop !== 'Other' &&  !this.userCrops.includes(this.selectedCrop)) {
      this.userCrops.push(this.selectedCrop);
    }
    this.selectedCrop = ''; 
  }

  removeCrop(index: number) {
    this.userCrops.splice(index, 1);
  }

  removeActivity(index: number) {
    this.activities.splice(index, 1);
  }

  generateCalendarMonths() {
    const startIndex = this.months.indexOf(this.startMonth);
    this.calendarMonths = [];
    for (let i = 0; i < this.numMonths; i++) {
      const index = (startIndex + i) % 12;
      this.calendarMonths.push({month:this.months[index],weather:''});
    }
  }

  getWeatherCondition(month: string): string {
    const selectedMonth = this.calendarMonths.find(item => item.month === month);
    return selectedMonth ? selectedMonth.weather : '';
  }

  onSubmition(){
    //any required data validation
    const data = {
     name: this.calenderTitle,
     crops: this.userCrops,
     timeAndConditions: this.calendarMonths,
     activities: this.activities
    }
    console.log(data);
  
    this.dataService.saveData(data);
  
    this.router.navigate(['/seasonal-calendar', data]);
  }

}
