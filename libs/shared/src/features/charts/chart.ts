import {
  Component,
  effect,
  ElementRef,
  HostListener,
  inject,
  input,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import type { IChartConfig } from '@picsa/models/src/climate.models';
import * as c3 from 'c3';

// eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection
@Component({
  selector: 'picsa-chart',
  template: ` <div data-cy="chart-container" #chart class="chart-container"></div> `,
  styleUrls: ['./chart.scss'],
  // remove shadow-dom encapsulation so c3.css styles can be passed down
  encapsulation: ViewEncapsulation.None,
  imports: [],
})
/*  angular wrapper for c3.js lib
    see https://github.com/emn178/angular2-chartjs/blob/master/src/chart.component.ts
    for similar implementation on chartjs lib
*/
export class PicsaChartComponent {
  private elementRef = inject<ElementRef<HTMLDivElement>>(ElementRef);

  public chart: c3.ChartAPI;

  @ViewChild('chart', { static: true })
  chartContainer: ElementRef<HTMLDivElement>;

  config = input.required<IChartConfig>();

  // dispatch resize event to trigger chart resize on orientation change
  @HostListener('window:orientationchange', [])
  onOrientationChange() {
    if (this.chart) {
      setTimeout(() => {
        this.create(this.config());
      }, 200);
    }
  }
  /** Custom event to force rerender (e.g. deep config changes not picked uo) */
  @HostListener('window:picsaChartRerender', [])
  chartRerender() {
    if (this.chart) {
      setTimeout(() => {
        this.create(this.config());
      }, 200);
    }
  }
  constructor() {
    effect(() => {
      const config = this.config();
      this.create(config);
    });
  }

  // use create method to populate div which will also be available before viewInit
  private create(config: Partial<c3.ChartConfiguration>) {
    this.chart = c3.generate({
      ...config,
      bindto: this.chartContainer.nativeElement,
      data: config.data || {},
      size: config.size || {
        height: this.elementRef.nativeElement.offsetHeight - 32, // include extra pxs for labels
      },
      oninit: function () {
        this.svg.attr('id', 'picsa_chart_svg');
      },
    });
  }
}

export type c3ChartAPI = c3.ChartAPI;
export type c3ChartConfiguration = c3.ChartConfiguration;
