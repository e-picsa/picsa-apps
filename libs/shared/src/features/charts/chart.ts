import { Component, ElementRef, HostListener, Input, SimpleChanges, ViewChild, ViewEncapsulation } from '@angular/core';
import { IChartConfig } from '@picsa/models';
import * as c3 from 'c3';

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
  public chart: c3.ChartAPI;

  @ViewChild('chart', { static: true })
  chartContainer: ElementRef<HTMLDivElement>;

  /**
   * Optional data override to trigger force unload/reload
   * NOTE - initial data should be populated while generated config
   * TODO - review if still required (data usually populated to config)
   */
  @Input() data: c3.Data = {
    columns: [],
  };
  @Input() config: IChartConfig = {};

  // dispatch resize event to trigger chart resize on orientation change
  @HostListener('window:orientationchange', ['$event'])
  onOrientationChange() {
    if (this.chart) {
      setTimeout(() => {
        this.create();
      }, 200);
    }
  }
  /** Custom event to force rerender (e.g. deep config changes not picked uo) */
  @HostListener('window:picsaChartRerender', [])
  chartRerender() {
    if (this.chart) {
      setTimeout(() => {
        this.create();
      }, 200);
    }
  }
  constructor(private elementRef: ElementRef<HTMLDivElement>) {}

  /**********************************************************************************
   *  Custom creation and change event handling
   *  Note - whilst reactive binding has been added for data, better functionality
   *  exists by simply accessing the api methods on this.chart, such as load() or unload()
   **********************************************************************************/

  // note, only detects object change, not content (so array push ignored)
  // see: https://stackoverflow.com/questions/43223582/why-angular-2-ngonchanges-not-responding-to-input-array-push
  ngOnChanges(changes: SimpleChanges) {
    if (changes.config?.currentValue) {
      if (this.chart) {
        if (changes['config']) {
          // handle core changes which require chart rebuild
          this.create();
        } else if (changes['data']) {
          // difficult to detect full changes (ids as well as if values changed within)
          // therefore just unload all data and load all new
          this.chart.unload();
          // need to wait after unload before reload as animation gets blocked
          setTimeout(() => {
            this.chart.load(changes.data.currentValue);
          }, 300);
        }
      } else {
        this.create();
      }
    }
  }

  // use create method to populate div which will also be available before viewInit
  private create() {
    this.chart = c3.generate({
      ...this.config,
      bindto: this.chartContainer.nativeElement,
      data: this.config.data || this.data,
      size: this.config.size || {
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
