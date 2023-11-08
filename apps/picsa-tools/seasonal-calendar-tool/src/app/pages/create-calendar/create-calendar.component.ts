import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';

import { SeasonCalenderService } from './../../services/calender.data.service';

@Component({
  selector: 'seasonal-calendar-create-calender',
  templateUrl: './create-calendar.component.html',
  styleUrls: ['./create-calendar.component.scss'],
})


export class CreateCalendarComponent {
  data
  
  constructor(private router: Router, private dataService: SeasonCalenderService ) {
    this.generateCalendarMonths();
    this.data = this.router?.getCurrentNavigation()?.extras?.state;
    console.log(this.data)
  }
  calenderTitle = "";
  crops: string[] = ["Maize", "Beans", "Peas"];
  //activities: string[] = ["Planting", "Weeding", "Preparation", "Harvesting", "Drying"];
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

  message = 'Please fill all the fields.';
 showMessageFlag = false;
 
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
   if(this.calendarMonths.length > 0 && this.userCrops.length > 0 && this.calenderTitle){
    const data = {
     name: this.calenderTitle,
     crops: this.userCrops,
     timeAndConditions: this.calendarMonths,
    }
    // console.log(data);
    this.dataService.addORUpdateData(data, 'add');
    this.router.navigate(['/seasonal-calendar']);
  }else{
    this.showMessageFlag = true;
  }
 }

}