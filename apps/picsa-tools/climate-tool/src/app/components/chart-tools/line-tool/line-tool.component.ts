import { ChangeDetectionStrategy, Component, effect, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DATE_RANGE_SELECTION_STRATEGY, MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { LINE_TOOL_OPTIONS } from '@picsa/data/climate/tool_definitions';

import { calcPercentile } from '../../../services/climate-tool.service';
import { BaseChartToolComponent, TOOL_SERIES_IDS } from '../base-tool.component';
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
  readonly ranges = signal<{ min: number; max: number }>({ min: 0, max: 0 });
  readonly step = signal(1);
  readonly inputType = signal<'number' | 'date' | undefined>(undefined);
  readonly value = signal<number | undefined>(undefined);

  readonly datePickerHeader = LineDatePickerHeaderComponent;

  /** Configurable options overridden in chart config */
  private options = LINE_TOOL_OPTIONS;

  constructor() {
    super();

    // Subscribe to chart rendered events to apply point colors
    const sub = this.chartRendered$.subscribe(() => {
      this.applyPointColours();
    });

    // Subscribe to chart definition changes via effect
    effect(() => {
      const chartDef = this.chartDefinition();
      if (chartDef) {
        this.loadLineToolConfig(chartDef);
      }
    });

    // React to value changes and update chart
    effect(() => {
      const val = this.value();
      this.updateOnValueChange(val);
    });

    this.destroyRef.onDestroy(() => {
      sub.unsubscribe();
    });
  }

  public override getPointColour(d: any): string | undefined {
    const val = this.value();
    if (val === undefined || !d || typeof d.value !== 'number') return undefined;
    const { above, below } = this.options;
    return d.value >= val ? above.color : below.color;
  }

  protected override onToolDestroy() {
    this.clearPointColours();
    this.removeSeries(['LineTool']);
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
    // Update chart line
    this.updateChart(value);

    // Apply point colours to SVG DOM
    this.applyPointColours();

    // Also inform tool service of value changes so that probability tool can update
    this.toolService.setValue('line', value);
  }

  private setDefaultLineValue() {
    // if no initial value provided calculate median and plot
    const median = calcPercentile(this.chartSeriesData(), 0.5);
    const currentStep = this.step();
    const rounded = Math.round(median / currentStep) * currentStep;
    this.value.set(rounded);
  }

  /** Load or unload the linetool value as a line on the chart */
  private updateChart(value?: number) {
    const id = 'LineTool';
    if (value) {
      this.addFixedLine(value, id);
    } else {
      this.removeSeries([id]);
    }
  }

  /** Apply above/below point colors directly to SVG circle element inline styles */
  private applyPointColours() {
    const svg = document.querySelector<SVGSVGElement>('#picsa_chart_svg');
    if (!svg) return;

    const points = svg.querySelectorAll<SVGElement>('.c3-circles .c3-circle');
    points.forEach((el: any) => {
      const d = el.__data__;
      if (!d || typeof d.value !== 'number') return;
      if (d.id && TOOL_SERIES_IDS.includes(d.id)) return;

      const color = this.getPointColour(d);
      if (color) {
        el.setAttribute('style', `fill: ${color} !important; stroke: ${color} !important;`);
      } else {
        el.removeAttribute('style');
      }
    });
  }

  /** Remove point color inline style overrides when tool is destroyed */
  private clearPointColours() {
    const svg = document.querySelector<SVGSVGElement>('#picsa_chart_svg');
    if (!svg) return;

    const points = svg.querySelectorAll<SVGElement>('.c3-circles .c3-circle');
    points.forEach((el: any) => {
      el.removeAttribute('style');
    });
  }
}
