import { Component, Input, ViewChild, OnInit } from '@angular/core';
import { PicsaTranslateService } from '@picsa/modules/translate';
import {
  IChartMeta,
  IChartSummary,
  IChartConfig,
  IStationMeta
} from '@picsa/models/climate.models';
import { PicsaChartComponent } from '@picsa/features/charts/chart';
import { PicsaDialogLoading } from '@picsa/features/dialogs/dialogs';
import { Subject } from 'rxjs';
import { take, delay } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
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
export class ClimateChartComponent implements OnInit {
  @Input() chartMeta: IChartMeta;
  @Input() chartData: IChartSummary[];
  @Input() stationMeta: IStationMeta;
  @ViewChild('picsaChart', { static: true }) picsaChart: PicsaChartComponent;
  chartConfig: IChartConfig;
  chartRendered$ = new Subject<void>();
  lineToolValue: number;
  y1Values: number[];
  ranges: IDataRanges;
  constructor(
    private translateService: PicsaTranslateService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.ranges = this._calculateDataRanges(this.chartData, this.chartMeta);
    this.generateChart(this.chartData, this.chartMeta);
    // when using line tool and probabilities this is base solely on single y dataset
    this.y1Values = this.chartData.map(
      v => v[this.chartMeta.keys[0]] as number
    );
  }

  setLineToolValue(value: number) {
    if (value === 0) {
      this.lineToolValue = undefined;
      return this.picsaChart.chart.unload({ ids: ['LineTool'] });
    }
    const lineArray = Array(this.chartData.length).fill(value);
    lineArray.unshift('LineTool');
    this.picsaChart.chart.load({
      columns: [lineArray],
      classes: { LineTool: 'LineTool' }
    });
    this.picsaChart.chart.show('LineTool', { withLegend: true });
  }

  // create chart given columns of data and a particular key to make visible
  generateChart(data: IChartSummary[], meta: IChartMeta) {
    // configure major and minor ticks, labels and gridlines
    const gridMeta = this._calculateGridMeta(meta, this.ranges);
    // configure chart
    this.chartConfig = {
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
          title: (x, i?) => data[i as number][meta.xVar] as any
        }
      },
      axis: {
        x: {
          label: meta.xLabel,
          max: this.ranges.xMax,
          tick: {
            rotate: 75,
            multiline: false,
            values: gridMeta.xTicks,
            format: d =>
              gridMeta.xLines.includes(d as any)
                ? this._formatXAxis(d as any)
                : ''
          }
        },
        y: {
          label: { position: 'outer-middle', text: meta.yLabel },
          tick: {
            values: gridMeta.yTicks,
            format: (d: any) =>
              gridMeta.yLines.includes(d as any)
                ? this._formatYAxis(d as any, meta)
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
        hide: true
      },
      point: {
        r: d => (d.id === 'LineTool' ? 0 : 8)
      },
      onrendered: () => {
        console.log('rendered');
        this.chartRendered$.next();
      }
    };
  }

  /*****************************************************************************
   *   Download and Share
   ****************************************************************************/
  // update styles and when rendered save as png
  downloadPrintVersion() {
    console.log('exporting');
    this._showLoader();
    const title = `${this.stationMeta.name} - ${this.chartMeta.name} - ${
      this.translateService.language
    }`;
    // call export only after the below rendering changes are implemented
    this.chartRendered$
      .pipe(delay(500))
      .pipe(take(1))
      .subscribe(() => null, null, () => this.picsaChart.generatePng(title));

    // update chart view for better printing
    const viewConfig = this.chartConfig;
    const printConfig = { ...viewConfig };
    // printConfig.data.color = () => '#000000';
    printConfig.point.r = d => (d.id === 'LineTool' ? 0 : 3);
    printConfig.size = { width: 900, height: 600 };
    this.chartConfig = printConfig;
    //
  }
  // TODO - refactor for sharing
  _showLoader() {
    const dialogRef = this.dialog.open(PicsaDialogLoading, {
      width: '250px'
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
    });
  }

  /*****************************************************************************
   *   Styles and Formatting
   ****************************************************************************/

  _getPointColour(d: any): string {
    if (d.value >= this.lineToolValue) {
      return '#739B65';
    }
    if (d.value < this.lineToolValue) {
      return '#BF7720';
    }
    // default return color for series key, attached to d.id
    return seriesColors[d.id];
  }

  // iterate over data and calculate min/max values for xVar and multiple yVars
  private _calculateDataRanges(data: IChartSummary[], meta: IChartMeta) {
    let { yMin, yMax, xMin, xMax } = DATA_RANGES_DEFAULT;
    data.forEach(d => {
      const xVal = d[meta.xVar] as number;
      const yVals = meta.keys.map(k => d[k]) as number[];
      xMax = Math.max(xMax, xVal);
      xMin = Math.min(xMin, xVal);
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
      // round y max up to nearest 50 and y min down to nearest 50
      yMin: Math.floor(yMin / 50) * 50,
      yMax: Math.ceil(yMax / 50) * 50,
      xMin,
      xMax
    };
  }

  // calculate grid ticks, lines and label meta data
  private _calculateGridMeta(meta: IChartMeta, ranges: IDataRanges): IGridMeta {
    const { xMin, xMax, yMin, yMax } = ranges;
    const xMinorInterval = meta.xVar === 'Year' ? 1 : 1;
    const yMinorInterval =
      meta.yFormat === 'value' ? 50 : Math.round((yMax - yMin) / 20);
    const xMajorInterval =
      meta.xVar === 'Year' ? 2 * xMinorInterval : xMinorInterval;
    const yMajorInterval =
      meta.yFormat === 'value' ? 4 * yMinorInterval : yMinorInterval;
    return {
      xTicks: this._getAxisValues(xMin, xMax, xMinorInterval) as number[],
      xLines: this._getAxisValues(xMin, xMax, xMajorInterval) as number[],
      yTicks: this._getAxisValues(yMin, yMax, yMinorInterval) as number[],
      yLines: this._getAxisValues(yMin, yMax, yMajorInterval) as number[]
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
  private _formatXAxis(value: number) {
    return value;
  }

  private _formatYAxis(value: number, meta: IChartMeta) {
    switch (meta.yFormat) {
      case 'date-from-July':
        //181 based on local met +182 and -1 for index starting at 0
        const dayNumber = (value + 181) % 366;
        //simply converts number to day rough date value (same method as local met office)
        //initialise year
        const d = new Date(2001, 0);
        d.setDate(dayNumber);
        const monthNames: string[] = this.translateService.monthNames;
        // just take first 3 letters
        const string = `${d.getDate()}-${monthNames[
          d.getMonth() % 12
        ].substring(0, 3)}`;
        return string;
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
