import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, input, signal } from '@angular/core';
import { generateChartConfig } from '@picsa/climate/src/app/utils';
import { CLIMATE_CHART_DEFINTIONS } from '@picsa/data/climate/chart_definitions';
import { IChartMeta, IStationData } from '@picsa/models/src';
import { PicsaChartComponent } from '@picsa/shared/features';
import { ChartConfiguration } from 'c3';

import { IStationRow } from '../../../../types';

@Component({
  selector: 'dashboard-climate-chart-summary',
  imports: [CommonModule, PicsaChartComponent],
  templateUrl: './chart-summary.component.html',
  styleUrl: './chart-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartSummaryComponent {
  public station = input.required<IStationRow>();

  public chartDefintions = signal<IChartMeta[]>([]);
  public activeChartDefinition = signal<IChartMeta | undefined>(undefined);

  public activeChartConfig = signal<Partial<ChartConfiguration> | undefined>(undefined);

  public summaryData = signal<IStationData[]>([]);

  constructor() {
    effect(() => {
      const { country_code } = this.station();
      const definitions = CLIMATE_CHART_DEFINTIONS[country_code] || CLIMATE_CHART_DEFINTIONS.default;
      this.chartDefintions.set(Object.values(definitions));
      this.activeChartDefinition.set(definitions[0]);
    });

    effect(async () => {
      const summaryData = this.summaryData();
      const activeChartDefinition = this.activeChartDefinition();
      if (activeChartDefinition) {
        const config = await generateChartConfig(summaryData, activeChartDefinition);
        this.activeChartConfig.set(config);
      }
    });
  }
}
