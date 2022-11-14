import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IChartConfig, IChartMeta } from '@picsa/models/src';
import { ClimateChartService } from '../../services/climate-chart.service';

@Component({
  selector: 'climate-line-tool',
  templateUrl: './line-tool.component.html',
  styleUrls: ['./line-tool.component.scss'],
})
export class LineToolComponent {
  public value?: number;
  public ranges: { min: number; max: number };
  public step: number;
  public showNumberInput = false;

  constructor(private climateService: ClimateChartService) {}

  @Input() set chartConfig(chartConfig: IChartConfig) {
    if (chartConfig.axis?.y) {
      this.ranges = {
        min: chartConfig.axis?.y?.min || 0,
        max: chartConfig.axis?.y?.max || 0,
      };
    }
    this.value = undefined;
  }
  @Output() valueChange = new EventEmitter<number | undefined>();

  @Input() set definition(definition: IChartMeta) {
    if (definition) {
      this.step = definition.yMinor;
      if (definition.yFormat === 'value') {
        this.showNumberInput = true;
        this.formatThumbValue = (v) => v;
      } else {
        this.formatThumbValue = () => '';
      }
    }
    this.value = undefined;
  }

  public formatThumbValue(v: number): string | number {
    return '';
  }

  /**
   * When line tool value change update chart to display custom point colours above/below
   * and trigger event emitter to handle line load/unload and chart refresh
   */
  public setLineToolValue(value: number) {
    if (value < (this.ranges?.min as number)) {
      this.value = undefined;
    }
    const colours = this.definition?.linetool?.reverse
      ? ['#BF7720', '#739B65']
      : ['#739B65', '#BF7720'];
    const pointFormatter = (d: { value: number }) => {
      if (!this.value) return;
      return d.value >= this.value ? colours[0] : colours[1];
    };
    this.climateService.getPointColour = pointFormatter;
    this.valueChange.next(value);
  }
}
