import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DATE_RANGE_SELECTION_STRATEGY, MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { LINE_TOOL_OPTIONS } from '@picsa/data/climate/tool_definitions';

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
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatDatepickerModule, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LineToolComponent {
  private chartService = inject(ClimateChartService);
  private toolService = inject(ClimateToolService);
  private destroyRef = inject(DestroyRef);

  readonly ranges = signal<{ min: number; max: number }>({ min: 0, max: 0 });
  readonly step = signal(1);
  readonly inputType = signal<'number' | 'date' | undefined>(undefined);
  readonly value = signal<number | undefined>(undefined);

  readonly datePickerHeader = LineDatePickerHeaderComponent;

  /** Configurable options overridden in chart config */
  private options = LINE_TOOL_OPTIONS;

  constructor() {
    // Subscribe to chart definition changes via effect
    effect(() => {
      const chartDef = this.chartService.chartDefinition();
      if (chartDef) {
        this.loadLineToolConfig(chartDef);
      }
    });

    // React to value changes and update chart
    effect(() => {
      const val = this.value();
      this.updateOnValueChange(val);
    });

    // Remove line when component is destroyed
    this.destroyRef.onDestroy(() => {
      this.updateOnValueChange(undefined);
    });
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
    const min = this.ranges().min;
    if (value <= min) {
      this.value.set(undefined);
    } else {
      this.value.set(value);
    }
    // Note: updateOnValueChange effect handles the rest
  }

  /** Set line tool dates formats and min/max values for line tool */
  private loadLineToolConfig(definition: {
    tools: { line: typeof LINE_TOOL_OPTIONS };
    axes: { yMinor: number };
    yFormat: string;
  }) {
    this.options = definition.tools.line;
    this.step.set(definition.axes.yMinor);
    if (definition.yFormat === 'value') {
      this.inputType.set('number');
    } else {
      this.inputType.set('date');
    }

    const config = this.chartService.chartConfig();
    if (config) {
      this.ranges.set({
        min: config.axis?.y?.min || 0,
        max: config.axis?.y?.max || 0,
      });
    }

    // Set default after config loads
    setTimeout(() => {
      this.setDefaultLineValue();
    }, 50);
  }

  private updateOnValueChange(value: number | undefined) {
    // Update point colours
    const { above, below } = this.options;
    const pointFormatter = (d: { value: number }) => {
      if (!value) return;
      return d.value >= value ? above.color : below.color;
    };
    this.chartService.getPointColour = pointFormatter;

    // Update chart line
    this.updateChart(value);

    // Also inform tool service of value changes so that probability tool can update
    this.toolService.setValue('line', value);
  }

  private setDefaultLineValue() {
    // if no initial value provided calculate median and plot
    const median = calcPercentile(this.chartService.chartSeriesData(), 0.5);
    const currentStep = this.step();
    const rounded = Math.round(median / currentStep) * currentStep;
    this.value.set(rounded);
  }

  /** Load or unload the linetool value as a line on the chart */
  private updateChart(value?: number) {
    const id = 'LineTool';
    if (value) {
      this.chartService.addFixedLineToChart(value, id);
    } else {
      this.chartService.removeSeriesFromChart([id]);
    }
  }
}
