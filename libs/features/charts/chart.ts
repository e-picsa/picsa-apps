import {
  Component,
  ViewEncapsulation,
  Input,
  ElementRef,
  NgZone,
  SimpleChanges,
  OnInit
} from '@angular/core';
import * as c3 from 'c3';

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

  constructor(private elementRef: ElementRef, private ngZone: NgZone) {}

  @Input() data: c3.Data = {
    columns: []
  };
  @Input() config: Partial<c3.ChartConfiguration>;

  /**********************************************************************************
   *  Custom creation and change event handling
   *  Note - whilst reactive binding has been added for data, better functionality
   *  exists by simply accessing the api methods on this.chart, such as load() or unload()
   **********************************************************************************/

  ngOnInit() {
    //  create chart on init, even if no data present so empty chart can be seen
    this.create();
  }
  // note, only detects object change, not content (so array push ignored)
  // see: https://stackoverflow.com/questions/43223582/why-angular-2-ngonchanges-not-responding-to-input-array-push
  ngOnChanges(changes: SimpleChanges) {
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

  // method to extract the ids from data supplied to the chart
  // note - not currently used as even when one can identify which ids have
  // been added/removed we don't know whether existing id has changed data
  private _getDataIDs(data: c3.Data): string[] {
    if (data.columns) {
      return data.columns.map(c => c[0] as string);
    }
    if (data.rows) {
      return data.rows[0] as string[];
    }
    if (data.json) {
      return Object.keys(data.json[0]);
    }
    return [];
  }

  // use create method to populate div which will also be available before viewInit
  private create() {
    console.log('create chart', this.config, this.data);
    // run outside of angular change detection
    this.ngZone.runOutsideAngular(() => {
      if (this.container) {
        this.elementRef.nativeElement.removeChild(this.container);
      }
      this.container = document.createElement('div');
      this.container.setAttribute('id', 'chart');
      this.elementRef.nativeElement.appendChild(this.container);
      this.chart = this.chart = c3.generate({
        ...this.config,
        bindto: this.container,
        data: this.data,
        axis:{
          x:{
            label: "Year"
          }
        }
      });
    });
  }
}

export interface c3ChartAPI extends c3.ChartAPI {}
export interface c3ChartConfiguration extends c3.ChartConfiguration {}
