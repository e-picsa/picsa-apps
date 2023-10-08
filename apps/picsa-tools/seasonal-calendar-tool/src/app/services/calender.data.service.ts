import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DataService {


   calendars= {}; 


  saveData(data: any) {
    //save new calender as key for the mean time 
    const transformedData = {
      name: data.name,
      timeAndConditions: data.timeAndConditions,
      crops: data.crops.map((cropName) => ({
        name: cropName,
        months: data.timeAndConditions.map((monthData) => ({
          month: monthData.month,
          activities: [], // Initially empty
        })),
        extraInformation: "",
      })),
    };
    this.calendars[data.name] = transformedData;
  } 

}

