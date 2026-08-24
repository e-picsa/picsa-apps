import {
  Component,
  DestroyRef,
  effect,
  ElementRef,
  HostListener,
  inject,
  input,
  signal,
  untracked,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import type { IChartConfig } from '@picsa/models/src/climate.models';
import * as c3 from 'c3';

// eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection
@Component({
  selector: 'picsa-chart',
  template: ` <div data-cy="chart-container" #chart class="chart-container"></div> `,
  styleUrls: ['./chart.scss'],
  // remove shadow-dom encapsulation so c3.css styles can be passed down
  encapsulation: ViewEncapsulation.None,
  imports: [],
})
/*  angular wrapper for c3.js lib
    see https://github.com/emn178/angular2-chartjs/blob/master/src/chart.component.ts
    for similar implementation on chartjs lib
*/
export class PicsaChartComponent {
  private elementRef = inject<ElementRef<HTMLDivElement>>(ElementRef);

  @ViewChild('chart', { static: true })
  chartContainer: ElementRef<HTMLDivElement>;

  readonly config = input.required<IChartConfig>();
  readonly chart = signal<c3.ChartAPI | undefined>(undefined);

  constructor() {
    effect(() => {
      const config = this.config();
      untracked(() => this.create(config));
    });

    inject(DestroyRef).onDestroy(() => this.destroy());
  }

  @HostListener('window:orientationchange', [])
  @HostListener('window:picsaChartRerender', [])
  rerender() {
    if (this.chart()) {
      setTimeout(() => this.create(this.config()), 200);
    }
  }

  private destroy() {
    try {
      this.chart()?.destroy();
    } catch {
      /* empty */
    }
    this.chart.set(undefined);
  }

  // use create method to populate div which will also be available before viewInit
  private create(config: Partial<c3.ChartConfiguration>) {
    this.destroy();

    const chart = c3.generate({
      ...config,
      bindto: this.chartContainer.nativeElement,
      data: config.data || {},
      size: config.size || {
        height: this.elementRef.nativeElement.offsetHeight - 32, // include extra pxs for labels
      },
      oninit() {
        this.svg.attr('id', 'picsa_chart_svg');
      },
    });

    this.chart.set(chart);
  }
}

export type c3ChartAPI = c3.ChartAPI;
export type c3ChartConfiguration = c3.ChartConfiguration;
