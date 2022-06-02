import {
  Component,
  ViewEncapsulation,
  Input,
  ElementRef,
  SimpleChanges,
  OnInit
} from '@angular/core';
import * as c3 from 'c3';
import { IChartConfig } from '@picsa/models';
import { PrintProvider } from '@picsa/services/native';

@Component({
  selector: 'picsa-chart',
  template: ``,
  styleUrls: ['./chart.scss'],
  // remove shadow-dom encapsulation so c3.css styles can be passed down
  encapsulation: ViewEncapsulation.None
})
/*  angular wrapper for c3.js lib
    see https://github.com/emn178/angular2-chartjs/blob/master/src/chart.component.ts
    for similar implementation on chartjs lib
*/
export class PicsaChartComponent implements OnInit {
  public chart: c3.ChartAPI;
  private container: HTMLDivElement;
  constructor(
    private elementRef: ElementRef,
    private printPrvdr: PrintProvider
  ) {}

  @Input() data: c3.Data = {
    columns: []
  };
  @Input() config: IChartConfig = {};

  /**********************************************************************************
   *  Custom creation and change event handling
   *  Note - whilst reactive binding has been added for data, better functionality
   *  exists by simply accessing the api methods on this.chart, such as load() or unload()
   **********************************************************************************/

  ngOnInit() {
    // create chart on init, even if no data present so empty chart can be seen
    // NOTE - removed as causes duplicate creation
    // this.create();
  }
  // note, only detects object change, not content (so array push ignored)
  // see: https://stackoverflow.com/questions/43223582/why-angular-2-ngonchanges-not-responding-to-input-array-push
  ngOnChanges(changes: SimpleChanges) {
    if (changes.config.currentValue) {
      if (this.chart) {
        if (changes['config']) {
          // handle core changes which require chart rebuild
          this.create();
        } else if (changes['data']) {
          console.log('data changed', changes.data);
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
    // run outside of angular change detection
    // this.ngZone.runOutsideAngular(() => {
    if (this.container) {
      this.elementRef.nativeElement.removeChild(this.container);
    }
    this.container = document.createElement('div');
    this.container.setAttribute('id', 'chart');
    this.elementRef.nativeElement.appendChild(this.container);
    this.chart = this.chart = c3.generate({
      ...this.config,
      bindto: this.container,
      data: this.config.data ? this.config.data : this.data,
      oninit: function() {
        this.svg.attr('id', 'chart_svg');
        // const svg = document.getElementById('chart_svg');
        // svg.style.backgroundColor = 'green';
      }
    });
    // });
  }

  // https://spin.atomicobject.com/2014/01/21/convert-svg-to-png/
  // https://github.com/exupero/saveSvgAsPng
  // https://github.com/exupero/saveSvgAsPng/issues/186
  public async generatePng(title: string = 'chart') {
    await this.printPrvdr.shareSVG('chart_svg', title);
  }
}

export interface c3ChartAPI extends c3.ChartAPI {}
export interface c3ChartConfiguration extends c3.ChartConfiguration {}

/****************************************************************************
 *  Deprecated / Unused
 **************************************************************************/

// method to extract the ids from data supplied to the chart
// note - not currently used as even when one can identify which ids have
// been added/removed we don't know whether existing id has changed data
// private _getDataIDs(data: c3.Data): string[] {
//   if (data.columns) {
//     return data.columns.map(c => c[0] as string);
//   }
//   if (data.rows) {
//     return data.rows[0] as string[];
//   }
//   if (data.json) {
//     return Object.keys(data.json[0]);
//   }
//   return [];
// }
