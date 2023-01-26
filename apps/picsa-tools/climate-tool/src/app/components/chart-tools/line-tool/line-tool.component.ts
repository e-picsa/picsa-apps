import { Component, Input, OnDestroy } from '@angular/core';
import { MAT_DATE_RANGE_SELECTION_STRATEGY } from '@angular/material/datepicker';
import { IChartConfig, IChartMeta } from '@picsa/models/src';
import { ClimateChartService } from '../../../services/climate-chart.service';
import {
  calcPercentile,
  ClimateToolService,
} from '../../../services/climate-tool.service';
import { LineDatePickerSelectionStrategy } from './line-date-picker';
import { LineDatePickerHeaderComponent } from './line-date-picker-header';

@Component({
  selector: 'climate-line-tool',
  templateUrl: './line-tool.component.html',
  styleUrls: ['./line-tool.component.scss', './vertical-slider.scss'],
  providers: [
    {
      provide: MAT_DATE_RANGE_SELECTION_STRATEGY,
      useClass: LineDatePickerSelectionStrategy,
    },
  ],
})
export class LineToolComponent implements OnDestroy {
  public value?: number;
  public ranges: { min: number; max: number };
  public step: number;

  public inputType?: 'number' | 'date';
  public datePickerHeader = LineDatePickerHeaderComponent;

  constructor(
    private chartService: ClimateChartService,
    private toolService: ClimateToolService
  ) {}

  @Input() set chartConfig(chartConfig: IChartConfig) {
    if (chartConfig?.axis?.y) {
      this.ranges = {
        min: chartConfig.axis?.y?.min || 0,
        max: chartConfig.axis?.y?.max || 0,
      };
    }
    if (chartConfig) {
      this.setDefaultLineValue();
    }
  }

  @Input() set definition(definition: IChartMeta) {
    console.log('set definition', definition);
    if (definition) {
      this.step = definition.yMinor;
      if (definition.yFormat === 'value') {
        this.inputType = 'number';
        this.formatThumbValue = (v) => `${v}`;
      } else {
        this.inputType = 'date';
        this.formatThumbValue = () => '';
      }
      this.setDefaultLineValue();
    }
  }

  ngOnDestroy() {
    // when tool is toggle off also remove from the graph
    this.updateChartPointColours(undefined);
  }

  /** Specify how to format number that appears in slider thumb */
  public formatThumbValue(v: number): string {
    return '';
  }

  public setLineToolFromDate(datestring: string) {
    const d = new Date(datestring);
    const dateDayNumber = this.chartService.convertDateToDayNumber(d);
    return this.setLineToolValue(dateDayNumber);
  }

  /**
   * When line tool value change update chart to display custom point colours above/below
   * and trigger event emitter to handle line load/unload and chart refresh
   */
  public setLineToolValue(value: number) {
    // disable line tool if slider brought to base
    if (value <= (this.ranges?.min as number)) {
      value = undefined as any;
      // return setTimeout(() => {
      //   this.toolService.enabled.line = false;
      // }, 750);
    }
    this.value = value;
    this.updateChartPointColours(value);
    // also inform tool service of value changes so that probability tool can update
    return this.toolService.setValue('line', value);
  }

  private updateChartPointColours(value: number | undefined) {
    const colours = this.definition?.linetool?.reverse
      ? ['#BF7720', '#739B65']
      : ['#739B65', '#BF7720'];
    const pointFormatter = (d: { value: number }) => {
      if (!value) return;
      return d.value >= value ? colours[0] : colours[1];
    };
    this.chartService.getPointColour = pointFormatter;
    this.updateChart(value);
  }

  private setDefaultLineValue() {
    // if no initial value provided calculate median and plot
    const median = calcPercentile(this.chartService.chartSeriesData, 0.5);
    const rounded = Math.round(median / this.step) * this.step;
    this.value = rounded;
    this.setLineToolValue(rounded);
  }

  /** Load or unload the linetool value as a line on the cchart */
  private updateChart(value?: number) {
    const id = 'LineTool';
    if (value) {
      this.chartService.addFixedLineToChart(value, id);
    } else {
      this.chartService.removeSeriesFromChart([id]);
    }
  }
}
