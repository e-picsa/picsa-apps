import { NgRedux, select } from '@angular-redux/store';
import { Component, OnDestroy } from '@angular/core';
import * as c3 from 'c3';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TranslationsProvider } from '@picsa/core/services/translations';
// import { AppState } from "src/app/store/store.model";
import { IChartMeta, IChartSummary } from '@picsa/core/models/climate.models';
import { availableCharts } from 'src/app/data/availableCharts';

@Component({
  selector: 'climate-chart',
  templateUrl: 'climate-chart.html'
})
export class ClimateChartComponent implements OnDestroy {
  private componentDestroyed: Subject<any> = new Subject();
  // @select(['climate', 'site', 'summaries'])
  // readonly chartData$: Observable<IChartSummary[]>;
  // @select(['climate', 'site', 'lineToolValue'])
  // readonly lineToolValue$: Observable<number>;
  // @select(['climate', 'chart'])
  // readonly activeChart$: Observable<IChartMeta>;
  chart: any;
  lineToolValue: number;
  isFirstRender: boolean = true;
  activeChart: IChartMeta = availableCharts[0];

  constructor(
    // private ngRedux: NgRedux<AppState>,
    private translationsPrvdr: TranslationsProvider
  ) {
    this._addSubscriptions();
  }
  ngOnDestroy() {
    // want to remove subscriptions on destroy (note automatically handled for @select bound to async pipe in html)
    // using subject emits value manually (like event emitter) by calling the 'next()' function
    // on destroy we want to emit any value so that the .pipe(takeUntil subscription records it no longer needs to subscribe
    this.componentDestroyed.next();
    this.componentDestroyed.unsubscribe();
  }

  _addSubscriptions() {
    // this.chartData$.pipe(takeUntil(this.componentDestroyed)).subscribe(data => {
    //   if (data) {
    //     this.dataUpdated(data);
    //   }
    // });
    // this.lineToolValue$
    //   .pipe(takeUntil(this.componentDestroyed))
    //   .subscribe(v => {
    //     if (v) {
    //       this.setLineToolValue(v);
    //     }
    //   });
    // this.activeChart$
    //   .pipe(takeUntil(this.componentDestroyed))
    //   .subscribe(chart => {
    //     if (chart) {
    //       this.setChart(chart);
    //     }
    //   });
  }

  // when new data columns specified redraw any graphs
  // if no graph previously specified, default to rainfall
  dataUpdated(data: IChartSummary[]) {
    console.log('data updated', data);
    let view = 'Rainfall';
    try {
      // view = this.ngRedux.getState().climate.site.view;
    } catch (error) {}
    this.generateChart(data, view);
  }

  // create chart given columns of data and a particular key to make visible
  generateChart(data: IChartSummary[], yAxis: string) {
    // generate chart keys from csv row titles
    console.log('generating chart');
    const keys = [];
    for (const key in data[0]) {
      keys.push(key);
    }
    // generate chart
    this.chart = c3.generate({
      bindto: '#chart',
      size: {
        height: 320
      },
      padding: {
        right: 10
      },
      data: {
        json: data,
        hide: true,
        keys: {
          value: keys
        },
        x: 'Year',
        classes: { LineTool: 'LineTool' },
        color: (color, d) => {
          if (d.value >= this.lineToolValue) {
            return '#739B65';
          }
          if (d.value < this.lineToolValue) {
            return '#BF7720';
          }
          // default return color for series key, attached to d.id
          return seriesColors[d.id];
        }
      },
      tooltip: {
        grouped: false,
        format: {
          value: function(value, ratio, id) {
            if (this.activeChart.yFormat == 'value') {
              return `${parseInt(value).toString()} ${this.activeChart.units}`;
            } else {
              return `${this.formatAxis(value, this.activeChart.yFormat)} ${
                this.activeChart.units
              }`;
            }
          }.bind(this)
        }
      },
      axis: {
        x: {
          label: 'Year'
        },
        y: {
          tick: {
            format: function(d) {
              return this.formatAxis(d, this.activeChart.yFormat);
            }.bind(this)
          }
          // label: `${this.activeChart.name} (${this.activeChart.units})`
        }
      },
      legend: {
        hide: true
      },
      point: {
        r: d => {
          return 5;
        }
      },
      onrendered: () => {
        this.firstRenderComplete();
      }
    });
  }

  firstRenderComplete() {
    if (this.isFirstRender) {
      console.log('first render complete');
      // set rainfall chart to initially show
      // this.actions.selectChart(this.activeChart);
      this.isFirstRender = false;
    }
  }

  resize(size) {
    this.chart.resize({
      height: size.height,
      width: size.width
    });
  }

  setLineToolValue(value) {
    // const data = this.ngRedux.getState().climate.site.summaries;
    // this.lineToolValue = value;
    // const lineArray = Array(data.length).fill(value);
    // lineArray.unshift("LineTool");
    // this.chart.load({
    //   columns: [lineArray],
    //   classes: { LineTool: "LineTool" }
    // });
    // this.chart.show("LineTool", { withLegend: true });
  }

  async setChart(chart: IChartMeta) {
    const loader = await this.translationsPrvdr.createTranslatedLoader({
      message: 'Loading...'
    });
    await loader.present();
    this.activeChart = chart;
    console.log('activeChart', chart);
    this.chart.hide();
    this.chart.legend.hide();
    this.chart.show(chart.y, { withLegend: true });

    // reload new line tool value
    if (this.lineToolValue && chart.tools.line) {
      this.setLineToolValue(this.lineToolValue);
    }
    await loader.dismiss();
  }

  formatAxis(value, type) {
    if (type == 'date-from-July') {
      //181 based on local met +182 and -1 for index starting at 0
      const dayNumber = (value + 181) % 366;
      //simply converts number to day rough date value (same method as local met office)
      //initialise year
      const d = new Date(2001, 0);
      d.setDate(dayNumber);
      const monthNames: string[] = this.translationsPrvdr.monthNames;
      // just take first 3 letters
      const string = `${d.getDate()}-${monthNames[d.getMonth() % 12].substring(
        0,
        3
      )}`;
      return string;
    } else if (type == 'value') {
      return value;
    } else {
      return value;
    }
  }
}

const seriesColors = {
  Rainfall: '#377eb8',
  Start: '#e41a1c',
  End: '#984ea3',
  Length: '#4daf4a'
};
