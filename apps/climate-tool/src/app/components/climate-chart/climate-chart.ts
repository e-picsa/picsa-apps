import { Component, Input, ViewChild } from '@angular/core';
import { PicsaDialogService } from '@picsa/features/dialog';
import { PicsaTranslateService } from '@picsa/modules/translate';
import {
  IChartMeta,
  IChartSummary,
  IChartConfig,
  IStationMeta
} from '@picsa/models/climate.models';
import { PicsaChartComponent } from '@picsa/features/charts/chart';
import { Subject } from 'rxjs';
import { delay, take } from 'rxjs/operators';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { ChartOptionsComponent } from '../chart-options/chart-options';
import { IClimateView } from '../../models';
/******************************************************************
 * Component to display highly customised charts for climate data
 * Additionally renders line tool alongside (to prevent lots of
 * data passing up and down)
 *****************************************************************/
@Component({
  selector: 'climate-chart',
  templateUrl: 'climate-chart.html',
  styleUrls: ['climate-chart.scss']
})
export class ClimateChartComponent {
  @Input() chartMeta: IChartMeta & IClimateView;
  @Input() chartData: IChartSummary[];
  @Input() stationMeta: IStationMeta;
  @ViewChild('picsaChart', { static: true }) picsaChart: PicsaChartComponent;
  chartConfig: IChartConfig;
  chartRendered$ = new Subject<void>();
  lineToolValue: number;
  reverseLineTool: boolean;
  y1Values: number[];
  ranges: IDataRanges;
  isExporting: boolean;
  constructor(
    private translateService: PicsaTranslateService,
    private dialog: PicsaDialogService,
    private bottomSheet: MatBottomSheet
  ) {}

  // use ngOnchanges so that chartMeta can be changed directly from parent and update
  ngOnChanges() {
    this.lineToolValue = undefined;
    this.prepareChart();
  }
  async prepareChart() {
    // use reverse line tool for start of season chart
    this.reverseLineTool = this.chartMeta._viewID === 'start';
    // handle translations
    this.chartMeta.name = await this.translateService.translateText(
      this.chartMeta.name
    );
    this.ranges = this._calculateDataRanges(this.chartData, this.chartMeta);
    this.chartConfig = this._getChartConfig(this.chartData, this.chartMeta);
    // when using line tool and probabilities this is base solely on single y dataset
    this.y1Values = this.chartData.map(
      v => v[this.chartMeta.keys[0]] as number
    );
  }
  async showAdvancedOptions() {
    const ref = this.bottomSheet.open(ChartOptionsComponent, {
      data: this.chartMeta
    });
    ref.afterDismissed().subscribe(d => {
      if (d) {
        if (d.action === 'print') {
          this.downloadPrintVersion();
        }
      }
    });
  }

  setLineToolValue(value: number) {
    if (value === this.ranges.yMin) {
      this.lineToolValue = undefined;
      return this.picsaChart.chart.unload({ ids: ['LineTool'] });
    }
    const lineArray = Array(this.chartData.length).fill(value);
    lineArray.unshift('LineTool');
    this.picsaChart.chart.load({
      columns: [lineArray],
      classes: { LineTool: 'LineTool' }
    });
    this.picsaChart.chart.show('LineTool');
  }
  // TODO - can't display dates nice on tooltip so just return empty string
  formatLineToolValue = (v: number) => {
    return this.chartMeta.yFormat === 'value' ? v : '';
  };

  /*****************************************************************************
   *   Chart Config
   ****************************************************************************/

  // create chart given columns of data and a particular key to make visible
  private _getChartConfig(data: IChartSummary[], meta: IChartMeta) {
    // configure major and minor ticks, labels and gridlines
    const gridMeta = this._calculateGridMeta(meta, this.ranges);
    // configure chart
    const config: IChartConfig = {
      // ensure axis labels fit
      padding: {
        right: 10,
        left: 60
      },
      data: {
        json: data,
        keys: {
          value: [...meta.keys, meta.xVar]
        },
        x: 'Year',
        classes: { LineTool: 'LineTool' },
        color: (_, d) => this._getPointColour(d)
      },
      ['title' as any]: {
        text: `${this.stationMeta.name} | ${this.chartMeta.name}`
      },
      tooltip: {
        grouped: false,
        format: {
          value: value => this._getTooltipFormat(value, meta),
          // HACK - reformat missing  titles (lost when passing "" values back from axis)
          // i marked ? as incorrect typings
          title: (x, i?) =>
            this._formatXAxis(
              data[i as number][meta.xVar] as any,
              this.stationMeta
            )
        }
      },
      axis: {
        x: {
          label: meta.xLabel,
          min: this.ranges.xMin,
          max: this.ranges.xMax,
          tick: {
            rotate: 75,
            multiline: false,
            values: gridMeta.xTicks,
            format: d =>
              gridMeta.xLines.includes(d as any)
                ? this._formatXAxis(d as any, this.stationMeta)
                : ''
          },
          height: 60
        },
        y: {
          label: { position: 'outer-middle', text: meta.yLabel },
          tick: {
            values: gridMeta.yTicks,
            format: (d: any) =>
              gridMeta.yLines.includes(d as any)
                ? this._formatYAxis(d as any, meta, true)
                : ''
          },
          min: this.ranges.yMin,
          max: this.ranges.yMax,
          padding: {
            bottom: 0,
            top: 10
          }
        }
      },
      // add custom gridlines to only show on 'major' ticks
      grid: {
        y: {
          lines: gridMeta.yLines.map(l => {
            return { value: l, class: 'picsa-gridline', text: '' };
          })
        },
        x: {
          lines: gridMeta.xLines.map(l => {
            return { value: l, class: 'picsa-gridline', text: '' };
          })
        },
        // destructured as typings incorrect
        ...{
          lines: {
            front: false
          }
        }
      },
      legend: {
        show: false
      },
      point: {
        r: d => (d.id === 'LineTool' ? 0 : 8)
      },
      onrendered: () => {
        console.log('rendered');
        this.chartRendered$.next();
      }
    };
    return config;
  }

  /*****************************************************************************
   *   Download and Share
   ****************************************************************************/
  // update styles and when rendered save as png
  async downloadPrintVersion() {
    this.isExporting = true;
    const title = `${this.stationMeta.name} - ${this.chartMeta.name} - ${
      this.translateService.language
    }`;
    // update chart view for better printing
    const viewConfig = { ...this.chartConfig };
    // slightly messy - want to update chart config for print format, and wait until render
    // complete before downloading and reverting back
    this.chartRendered$
      .pipe(delay(500))
      .pipe(take(1))
      .subscribe(
        async () => {
          await this.picsaChart.generatePng(title);
          this.isExporting = false;
          this.chartConfig = { ...viewConfig };
        },
        err => {
          throw err;
        }
      );
    const printConfig = { ...this.chartConfig };
    printConfig.point.r = d => (d.id === 'LineTool' ? 0 : 3);
    printConfig.size = { width: 900, height: 600 };
    this.chartConfig = printConfig;
  }
  // NOTE - below code not working correctly, can't get loader to close
  // assume issue with ngzone
  private async showLoader() {
    const dialogRef = await this.dialog.open('blank', {
      title: 'Generating Chart Image',
      loader: 'bars'
    });
    return dialogRef;
  }
  private async closeLoader() {
    setTimeout(() => {
      this.dialog.closeAll();
    }, 500);
  }

  /*****************************************************************************
   *   Styles and Formatting
   ****************************************************************************/

  _getPointColour(d: any): string {
    // reverse colours for start of seasion chart
    const colours = this.reverseLineTool
      ? ['#BF7720', '#739B65']
      : ['#739B65', '#BF7720'];
    if (d.value >= this.lineToolValue) {
      return colours[0];
    }
    if (d.value < this.lineToolValue) {
      return colours[1];
    }
    // default return color for series key, attached to d.id
    return seriesColors[d.id];
  }

  // iterate over data and calculate min/max values for xVar and multiple yVars
  private _calculateDataRanges(data: IChartSummary[], meta: IChartMeta) {
    let { yMin, yMax, xMin, xMax } = DATA_RANGES_DEFAULT;
    const { xMajor, yMajor } = meta;
    data.forEach(d => {
      const xVal = d[meta.xVar] as number;
      // take all possible yValues and filter out undefined
      const yVals = meta.keys.map(k => d[k]).filter(v => v) as number[];
      xMax = xVal ? Math.max(xMax, xVal) : xMax;
      xMin = xVal ? Math.min(xMin, xVal) : xMin;
      yMax = Math.max(yMax, ...yVals);
      yMin = Math.min(yMin, ...yVals);
    });
    // NOTE - yAxis hardcoded to 0 start currently for rainfall chart
    if (meta.yFormat === 'value') {
      yMin = 0;
    }
    // Note - xAxis hardcoded to end at this year for all year charts
    if (meta.xVar === 'Year') {
      xMax = new Date().getFullYear();
    }
    return {
      // round max up and min down to the nearest interval
      yMin: Math.floor(yMin / yMajor) * yMajor,
      yMax: Math.ceil(yMax / yMajor) * yMajor,
      xMin: Math.floor(xMin / xMajor) * xMajor,
      xMax: Math.ceil(xMax / xMajor) * xMajor
    };
  }

  // calculate grid ticks, lines and label meta data
  private _calculateGridMeta(meta: IChartMeta, ranges: IDataRanges): IGridMeta {
    const { xMin, xMax, yMin, yMax } = ranges;
    const { xMajor, yMajor, xMinor, yMinor } = meta;
    return {
      xTicks: this._getAxisValues(xMin, xMax, xMinor) as number[],
      xLines: this._getAxisValues(xMin, xMax, xMajor) as number[],
      yTicks: this._getAxisValues(yMin, yMax, yMinor) as number[],
      yLines: this._getAxisValues(yMin, yMax, yMajor) as number[]
    };
  }

  // sometimes want to manually specify axis values so that y-axis can start at 0,
  // or so x-axis can extend beyond range of dates to current year
  private _getAxisValues(min: number, max: number, interval: number) {
    const values = [];
    for (let i = 0; i <= (max - min) / interval; i++) {
      values.push(min + i * interval);
    }
    return values;
  }

  // now all ticks are displayed we only want values for every 5
  private _formatXAxis(value: number, stationMeta: IStationMeta): string {
    if (stationMeta.country === 'Malawi') {
      return `${value} - ${(value + 1).toString().substring(2, 4)}`;
    }
    return `${value}`;
  }

  private _formatYAxis(value: number, meta: IChartMeta, isAxisLabel?: boolean) {
    const { yMajor } = meta;
    const monthNames: string[] = this.translateService.monthNames;
    let label: string;
    switch (meta.yFormat) {
      case 'date-from-July':
        // previously 181 based on local met +182 and -1 for index starting at 0
        // now simply half of standard year 365 + 1 for index
        const dayNumber = (value + 183) % 366;
        if (isAxisLabel) {
          // just want nearest month name
          label = monthNames[Math.round(dayNumber / yMajor) % 12].substring(
            0,
            3
          );
        } else {
          //simply converts number to day rough date value (same method as local met office)
          //initialise year from a year with 365 days
          const d = new Date(2015, 0);
          d.setDate(dayNumber);
          // just take first 3 letters
          label = `${d.getDate()}-${monthNames[d.getMonth() % 12].substring(
            0,
            3
          )}`;
        }
        return label;
      case 'date':
        // TODO
        return `${value}`;
      default:
        return `${value}`;
    }
  }

  private _getTooltipFormat(value: number, meta: IChartMeta) {
    if (meta.yFormat == 'value') {
      return `${Math.round(value).toString()} ${meta.units}`;
    } else {
      return `${this._formatYAxis(value, meta)} ${meta.units}`;
    }
  }
}

/*****************************************************************************
 *   Defaults and Interfaces
 ****************************************************************************/
const seriesColors = {
  Rainfall: '#377eb8',
  Start: '#e41a1c',
  End: '#984ea3',
  Length: '#4daf4a'
};

interface IDataRanges {
  yMin: number;
  yMax: number;
  xMin: number;
  xMax: number;
}
interface IGridMeta {
  xTicks: number[];
  yTicks: number[];
  xLines: number[];
  yLines: number[];
}
const DATA_RANGES_DEFAULT: IDataRanges = {
  yMin: Infinity,
  yMax: -Infinity,
  xMin: Infinity,
  xMax: -Infinity
};

/*****************************************************************************
 *  Deprecated - will remove when confirmed working
 ****************************************************************************/

/* 

  private _resize(size) {
    this.chart.resize({
      height: size.height,
      width: size.width
    });
  }

*/
