import { Component, Input } from '@angular/core';
import { MAT_DATE_RANGE_SELECTION_STRATEGY } from '@angular/material/datepicker';
import { IChartConfig, IChartMeta } from '@picsa/models/src';
import { ClimateChartService } from '../../services/climate-chart.service';
import { LineDatePickerSelectionStrategy } from './line-date-picker';
import { LineDatePickerHeaderComponent } from './line-date-picker-header';

@Component({
  selector: 'climate-line-tool',
  templateUrl: './line-tool.component.html',
  styleUrls: ['./line-tool.component.scss'],
  providers: [
    {
      provide: MAT_DATE_RANGE_SELECTION_STRATEGY,
      useClass: LineDatePickerSelectionStrategy,
    },
  ],
})
export class LineToolComponent {
  public value?: number;
  public ranges: { min: number; max: number };
  public step: number;

  public inputType?: 'number' | 'date';
  public datePickerHeader = LineDatePickerHeaderComponent;

  constructor(private chartService: ClimateChartService) {}

  @Input() set chartConfig(chartConfig: IChartConfig) {
    if (chartConfig?.axis?.y) {
      this.ranges = {
        min: chartConfig.axis?.y?.min || 0,
        max: chartConfig.axis?.y?.max || 0,
      };
    }
    this.value = undefined;
  }

  @Input() set definition(definition: IChartMeta) {
    if (definition) {
      this.step = definition.yMinor;
      if (definition.yFormat === 'value') {
        this.inputType = 'number';
        this.formatThumbValue = (v) => v;
      } else {
        this.inputType = 'date';
        this.formatThumbValue = () => '';
      }
    }
    this.value = undefined;
  }

  /** Specify how to format number that appears in slider thumb */
  public formatThumbValue(v: number): string | number {
    return '';
  }

  public setLineToolFromDate(datestring: string) {
    const d = new Date(datestring);
    const dateDayNumber = this.chartService.convertDateToDayNumber(d);
    this.value = dateDayNumber;
    return this.setLineToolValue(dateDayNumber);
  }

  /**
   * When line tool value change update chart to display custom point colours above/below
   * and trigger event emitter to handle line load/unload and chart refresh
   */
  public setLineToolValue(value: number) {
    if (value <= (this.ranges?.min as number)) {
      this.value = undefined;
    }
    const colours = this.definition?.linetool?.reverse
      ? ['#BF7720', '#739B65']
      : ['#739B65', '#BF7720'];
    const pointFormatter = (d: { value: number }) => {
      if (!this.value) return;
      return d.value >= this.value ? colours[0] : colours[1];
    };
    this.chartService.getPointColour = pointFormatter;
    this.updateChart(this.value);
  }

  /** Load or unload the linetool value as a line on the cchart */
  private updateChart(value?: number) {
    const { chart } = this.chartService.chartComponent;
    if (value) {
      const lineArray = new Array(this.chartService.stationData.length).fill(
        value
      );
      lineArray.unshift('LineTool');
      chart.load({
        columns: [lineArray as any],
        classes: { LineTool: 'LineTool' },
      });
      chart.show('LineTool');
    } else {
      chart.unload({
        ids: ['LineTool'],
      });
    }
  }
}
