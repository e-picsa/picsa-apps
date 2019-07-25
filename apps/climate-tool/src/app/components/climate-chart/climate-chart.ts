import { Component, Input, ViewChild, OnInit } from '@angular/core';
import { PicsaTranslateService } from '@picsa/modules/translate';
import {
  IChartMeta,
  IChartSummary,
  IChartConfig
} from '@picsa/models/climate.models';
import { PicsaChartComponent } from '@picsa/features/charts/chart';
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
  @ViewChild('picsaChart', { static: true }) picsaChart: PicsaChartComponent;
  chartConfig: IChartConfig;
  firstRenderComplete: boolean;
  ranges: IDataRanges;
  lineToolValue: number;
  y1Values: number[];
  constructor(private translateService: PicsaTranslateService) {}

  ngOnInit() {
    this.ranges = this.calculateDataRanges(this.chartData, this.chartMeta);
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
  // iterate over data and calculate min/max values for xVar and multiple yVars
  calculateDataRanges(data: IChartSummary[], meta: IChartMeta) {
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

  // create chart given columns of data and a particular key to make visible
  generateChart(data: IChartSummary[], meta: IChartMeta) {
    const { yMin, yMax, xMin, xMax } = this.ranges;
    // intervals depend on chart type
    const xInterval = meta.xVar === 'Year' ? 1 : 1;
    const yInterval =
      meta.yFormat === 'value' ? 50 : Math.round((yMax - yMin) / 20);
    // specify x and y axis ticks
    let xTicks = this._getAxisValues(xMin, xMax, xInterval);
    let yTicks = this._getAxisValues(yMin, yMax, yInterval);
    // specify main lines to draw on grid (major ticks, currently only want y)
    const yLines = _getArraySubset(yTicks, 4) as number[];
    this.chartConfig = {
      padding: {
        right: 10,
        left: 35
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
      tooltip: {
        grouped: false,
        format: {
          value: value => this._getTooltipFormat(value, meta),
          // HACK - reformat missing  titles (lost when passing "" values back from axis)
          // i marked ? as incorrect typings
          title: (x, i?) => data[i as number][meta.xVar] as any
        }
      },
      // TODO - currently highly custom for handling years, may want to generalise
      axis: {
        x: {
          label: meta.xVar,
          max: new Date().getFullYear(),
          tick: {
            values: xTicks,
            format: val => this._formatXAxis(val as number, xMax)
          }
        },
        y: {
          label: { position: 'inner-top', text: this.chartMeta.units },
          tick: {
            values: yTicks,
            format: (d: any) => this._formatYAxis(d, meta)
          },
          min: yMin,
          max: yMax,
          padding: {
            bottom: 0,
            top: 10
          }
        }
      },
      // add custom gridlines to only show on 'major' ticks
      grid: {
        y: {
          lines: yLines.map(l => {
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
        r: d => {
          return 8;
        }
      },
      onrendered: () => {
        this.firstRenderComplete = true;
      }
    };
  }

  export() {
    console.log('exporting');
    this.picsaChart.generatePng();
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
  private _formatXAxis(value: number, thisYear: number) {
    return (thisYear - value) % 5 === 0 ? value : '';
  }

  private _formatYAxis(value: number, meta: IChartMeta) {
    // Only show 1/4 of the ticks
    // TODO - link better to interval or other configurable options
    if (value % 200 !== 0) {
      return '';
    }
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
 *   helpers
 ****************************************************************************/
// take an array and return every nth element
const _getArraySubset = (arr: any[], n: number) => {
  const sub = [];
  for (let i = 0; i < arr.length; i += n) {
    sub.push(arr[i]);
  }
  return sub;
};

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
