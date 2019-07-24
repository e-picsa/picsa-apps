import { Component, Input, ViewChild, OnInit } from '@angular/core';
import { PicsaTranslateService } from '@picsa/modules/translate';
import {
  IChartMeta,
  IChartSummary,
  IChartConfig
} from '@picsa/models/climate.models';

@Component({
  selector: 'climate-chart',
  templateUrl: 'climate-chart.html'
})
export class ClimateChartComponent implements OnInit {
  @Input() chartMeta: IChartMeta;
  @Input() chartData: IChartSummary[];
  @ViewChild('chart', { static: true }) chart: any;
  chartConfig: IChartConfig;
  lineToolValue: number;
  firstRenderComplete: boolean;

  constructor(private translateService: PicsaTranslateService) {}

  ngOnInit() {
    console.log('generating chart', this.chartMeta);
    this.generateChart(this.chartData, this.chartMeta);
  }

  // create chart given columns of data and a particular key to make visible
  generateChart(data: IChartSummary[], meta: IChartMeta) {
    const startYear = data.reduce((a, b) => (a.Year < b.Year ? a : b)).Year;
    const thisYear = new Date().getFullYear();
    this.chartConfig = {
      padding: {
        right: 10
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
          // HACK pt 3 - reformat missing  titles. Also i marked ? as incorrect typings
          title: (x, i?) => data[i as number][meta.xVar] as any
        }
      },
      // TODO - currently highly custom for handling years, may want to generalise
      axis: {
        x: {
          label: meta.xVar,
          max: new Date().getFullYear(),
          tick: {
            values: this._getXAxisValues(startYear, thisYear),
            format: val => this._formatXAxis(val as number, thisYear)
          }
        },
        y: {
          label: { position: 'inner-top', text: this.chartMeta.units },
          tick: {
            format: (d: any) => this._formatAxis(d, meta)
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

  setLineToolValue(value: number) {
    this.lineToolValue = value;
    const lineArray = Array(this.chartData.length).fill(value);
    lineArray.unshift('LineTool');
    this.chart.load({
      columns: [lineArray],
      classes: { LineTool: 'LineTool' }
    });
    this.chart.show('LineTool', { withLegend: true });
  }

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

  // HACK pt 1 - want to ensure all values on x-axis up to current year
  // note, just setting max does not work as cuts if null values
  private _getXAxisValues(startYear: number, thisYear: number) {
    const xValues = [];
    for (let i = startYear; i <= thisYear; i++) {
      xValues.push(i);
    }
    return xValues;
  }

  // HACK pt 2
  // now all ticks are displayed we only want values for every 5
  private _formatXAxis(value: number, thisYear: number) {
    return (thisYear - value) % 5 === 0 ? value : '';
  }

  private _getTooltipFormat(value: number, meta: IChartMeta) {
    if (meta.yFormat == 'value') {
      return `${Math.round(value).toString()} ${meta.units}`;
    } else {
      return `${this._formatAxis(value, meta)} ${meta.units}`;
    }
  }

  private _formatAxis(value: number, meta: IChartMeta) {
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
}

const seriesColors = {
  Rainfall: '#377eb8',
  Start: '#e41a1c',
  End: '#984ea3',
  Length: '#4daf4a'
};

/* Deprecated - will remove when confirmed working

  private _resize(size) {
    this.chart.resize({
      height: size.height,
      width: size.width
    });
  }

  async setChart(chart: IChartMeta) {
    const loader = await this.translateService.createTranslatedLoader({
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


*/
