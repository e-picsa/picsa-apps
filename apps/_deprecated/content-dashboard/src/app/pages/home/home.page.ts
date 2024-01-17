import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { PicsaChartComponent } from '@picsa/shared/features/charts/chart';

@Component({
  selector: 'station-data-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class HomePage implements AfterViewInit {
  @ViewChild('chart', { static: true }) chart: PicsaChartComponent;
  sampleData = {
    columns: [
      ['data1', 30, 200, 100, 400, 150, 250],
      ['data2', 50, 20, 10, 40, 15, 25],
    ],
  };
  ngAfterViewInit() {
    setTimeout(() => {
      this.sampleData = {
        columns: [['data1', 230, 190, 300, 500, 300, 400]],
      };
    }, 1000);
    setTimeout(() => {
      this.sampleData = {
        columns: [['data3', 50, 20, 10, 40, 15, 25]],
      };
      console.log('sample data', this.sampleData);
    }, 2000);
  }
}
