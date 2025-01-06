import { Component, OnDestroy, OnInit } from '@angular/core';
import { MAT_DATE_RANGE_SELECTION_STRATEGY } from '@angular/material/datepicker';
import { LINE_TOOL_OPTIONS } from '@picsa/data/climate/tool_definitions';
import { Subject, takeUntil } from 'rxjs';

import { ClimateChartService } from '../../../services/climate-chart.service';
import { calcPercentile, ClimateToolService } from '../../../services/climate-tool.service';
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
  standalone: false,
})
export class LineToolComponent implements OnInit, OnDestroy {
  public value?: number;
  public ranges: { min: number; max: number };
  public step: number;

  public inputType?: 'number' | 'date';
  public datePickerHeader = LineDatePickerHeaderComponent;

  /** Configurable options overridden in chart config */
  private options = LINE_TOOL_OPTIONS;

  private componentDestroyed$ = new Subject<boolean>();

  constructor(private chartService: ClimateChartService, private toolService: ClimateToolService) {}

  ngOnInit(): void {
    this.subscribeToDefinitionChanges();
  }

  ngOnDestroy() {
    // when tool is toggle off also remove from the graph
    this.updateChartPointColours(undefined);
    this.componentDestroyed$.next(true);
    this.componentDestroyed$.complete();
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
    if (value <= (this.ranges?.min as number)) {
      value = undefined as any;
    }
    this.value = value;
    this.updateChartPointColours(value);
    // also inform tool service of value changes so that probability tool can update
    return this.toolService.setValue('line', value);
  }

  /** Set line tool dates formats and min/max values for line tool */
  private loadLineToolConfig() {
    const { chartConfig: config, chartDefinition: definition } = this.chartService;
    if (config && definition) {
      this.options = definition.tools.line;
      this.step = definition.axes.yMinor;
      if (definition.yFormat === 'value') {
        this.inputType = 'number';
      } else {
        this.inputType = 'date';
      }
      this.ranges = {
        min: config.axis?.y?.min || 0,
        max: config.axis?.y?.max || 0,
      };
      setTimeout(() => {
        this.setDefaultLineValue();
      }, 50);
    }
  }

  private subscribeToDefinitionChanges() {
    this.chartService.chartDefinition$.pipe(takeUntil(this.componentDestroyed$)).subscribe(() => {
      this.loadLineToolConfig();
    });
  }

  private updateChartPointColours(value: number | undefined) {
    const { above, below } = this.options;
    const pointFormatter = (d: { value: number }) => {
      if (!value) return;
      return d.value >= value ? above.color : below.color;
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
