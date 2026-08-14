import { ChangeDetectionStrategy, Component, effect, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DATE_RANGE_SELECTION_STRATEGY, MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { LINE_TOOL_OPTIONS } from '@picsa/data/climate/tool_definitions';
import { DataPoint } from 'c3';

import { calcPercentile } from '../../../services/climate-tool.service';
import { BaseChartToolComponent, ILegendItem, IOverlayLine, IPointStyle } from '../base-tool.component';
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
export class LineToolComponent extends BaseChartToolComponent {
  public override readonly usesPointOverlay = true;

  readonly ranges = signal<{ min: number; max: number }>({ min: 0, max: 0 });
  readonly step = signal(1);
  readonly inputType = signal<'number' | 'date' | undefined>(undefined);
  readonly value = signal<number | undefined>(undefined);

  readonly datePickerHeader = LineDatePickerHeaderComponent;

  /** Configurable options overridden in chart config */
  private options = LINE_TOOL_OPTIONS;

  constructor() {
    super();

    // Subscribe to chart definition changes via effect
    effect(() => {
      const chartDef = this.chartDefinition();
      if (chartDef) {
        this.loadLineToolConfig(chartDef);
      }
    });

    // React to value changes and update tool service
    effect(() => {
      const val = this.value();
      this.updateOnValueChange(val);
    });
  }

  public override getPointStyle(d: DataPoint): IPointStyle | undefined {
    if (!this.isDecoratable(d)) return undefined;
    const val = this.value();
    if (val === undefined || d.value === undefined) return undefined;
    const { above, below } = this.options;
    const color = d.value >= val ? above.color : below.color;
    return { shape: 'circle', size: 8, fill: color, stroke: color, strokeWidth: 1 };
  }

  public override getOverlayLines(): IOverlayLine[] | undefined {
    const val = this.value();
    if (val === undefined) return undefined;
    return [
      {
        id: 'line-threshold',
        value: val,
        color: '#000000',
        strokeWidth: 3,
      },
    ];
  }

  public override getLegendItems(): ILegendItem[] {
    const { above, below } = this.options;
    return [
      { label: 'Above', shape: 'circle', fill: above.color },
      { label: 'Below', shape: 'circle', fill: below.color },
    ];
  }

  protected override onToolDestroy() {
    this.toolService.setValue('line', undefined);
  }

  public setLineToolFromDate(datestring: string) {
    const d = new Date(datestring);
    const dateDayNumber = this.convertDateToDayNumber(d);
    return this.setLineToolValue(dateDayNumber);
  }

  /**
   * When line tool value changes, set value and update chart line
   */
  public setLineToolValue(value: number) {
    const min = this.ranges().min;
    if (value <= min) {
      this.value.set(undefined);
    } else {
      this.value.set(value);
    }
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

    const config = this.chartConfig();
    if (config) {
      this.ranges.set({
        min: config.axis?.y?.min || 0,
        max: config.axis?.y?.max || 0,
      });
    }
    requestAnimationFrame(() => this.setDefaultLineValue());
  }

  private updateOnValueChange(value: number | undefined) {
    // Inform tool service of value changes so that probability tool can update
    this.toolService.setValue('line', value);
  }

  private setDefaultLineValue() {
    // if no initial value provided calculate median and plot
    const median = calcPercentile(this.chartSeriesData(), 0.5);
    const currentStep = this.step();
    const rounded = Math.round(median / currentStep) * currentStep;
    this.value.set(rounded);
  }
}
