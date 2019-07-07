import { Component, AfterViewInit, ViewEncapsulation } from '@angular/core';
import * as c3 from 'c3';

@Component({
  selector: 'picsa-chart',
  templateUrl: './chart.html',
  styleUrls: ['./chart.scss'],
  // remove shadow-dom encapsulation so c3.css styles can be passed down
  encapsulation: ViewEncapsulation.None
})
export class PicsaChartComponent implements AfterViewInit {
  ngAfterViewInit() {
    let chart = c3.generate({
      bindto: '#chart',
      data: {
        columns: [
          ['data1', 30, 200, 100, 400, 150, 250],
          ['data2', 50, 20, 10, 40, 15, 25]
        ]
      }
    });
  }
}
