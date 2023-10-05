import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DataService {
   calendars= {}; 
//   activities: string[] = [];
//   userCrops: string[] = [];
//   calendarMonths: { weather: string; month: string }[] = [];

  saveData(data: any) {
    //save new calender as key for the mean time 
    this.calendars[data.name] = {
        name: data.name,
        crops : data.crops,
        timeAndConditions: data.timeAndConditions,
        activities: data.activities
    }
  } 

}
