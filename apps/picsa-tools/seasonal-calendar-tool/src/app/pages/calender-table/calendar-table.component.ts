import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router'

import { DataService } from './../../services/calender.data.service';

@Component({
  selector: 'seasonal-calendar-table',
  templateUrl: './calendar-table.component.html',
  styleUrls: ['./calendar-table.component.scss'],
})

export class CalendarTableComponent implements OnInit  {
  calendarData: any | null = null;

   sampleData:SampleData = {
    name: 'Sample Calendar',
    timeAndWeather: [
      { month: 'January', weather: 'Sunny' },
      { month: 'February', weather: 'Rainy' },
    ],
    crops: [
      {
        name: 'Maize',
        months: [
          { month: 'January', activities: ['Planting', 'Weeding'] },
          { month: 'February', activities: ['Weeding', 'Harvesting'] },
        ],
        extraInformation: 'Extra data for Maize',
      },
      {
        name: 'Beans',
        months: [
          { month: 'January', activities: ['Planting', 'Preparation'] },
          { month: 'February', activities: ['Weeding', 'Harvesting'] },
        ],
        extraInformation: 'Extra data for Beans',
      },
    ],
  }; 
  
  months: string[] = [
    'January', 'February', 'March', 'April',
    'May', 'June', 'July', 'August',
    'September',
  ];
  constructor(private route: ActivatedRoute, private dataService: DataService) {}

  ngOnInit() {
    console.log(this.dataService)
  }

 
  crops: string[] = ['Beans', 'Maize', 'Peas', 'Wheat', 'Barley']; 

  dataSource: MatTableDataSource<any>;

  // This should contain your data from the service with appropriate structure
  dataServiceData: any[] = [
    { crop: 'Beans', January: ['Value1', 'Value5', 'value6', 'value7'], February: ['Value2', 'Value6']},
    { crop: 'Maize', January: ['Value3'], February: ['Value4']},
  ];

  getActivitiesForMonthAndCrop(monthName: string, crop: Crop): string {
    const selectedMonth = crop.months.find((month) => month.month === monthName);
    if (selectedMonth) {
      return selectedMonth.activities.join(', '); // Display activities as a comma-separated string
    } else {
      return ''; // Return an empty string if no activities are found
    }
  }
  
}

interface MonthData {
  month: string;
  weather: string;
}

interface CropMonth {
  month: string;
  activities: string[];
}

interface Crop {
  name: string;
  months: CropMonth[];
  extraInformation: string;
}

interface SampleData {
  name: string;
  timeAndWeather: MonthData[];
  crops: Crop[];
}