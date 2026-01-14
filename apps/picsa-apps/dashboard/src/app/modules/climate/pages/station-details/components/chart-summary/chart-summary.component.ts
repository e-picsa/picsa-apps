/* eslint-disable @nx/enforce-module-boundaries */

import { ChangeDetectionStrategy, Component, computed, effect, input, signal } from '@angular/core';
import { generateChartConfig } from '@picsa/climate/src/app/utils';
import { CLIMATE_CHART_DEFINTIONS } from '@picsa/data/climate/chart_definitions';
import { IChartMeta, IStationData } from '@picsa/models/src';
import { PicsaChartComponent } from '@picsa/shared/features';
import { DashboardMaterialModule } from 'apps/picsa-apps/dashboard/src/app/material.module';
import { ChartConfiguration } from 'c3';

import { hackConvertStationDataForDisplay } from '../../../../climate.utils';
import { IClimateStationData, IStationRow } from '../../../../types';

@Component({
  selector: 'dashboard-climate-chart-summary',
  imports: [PicsaChartComponent, DashboardMaterialModule],
  templateUrl: './chart-summary.component.html',
  styleUrl: './chart-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartSummaryComponent {
  public station = input.required<IStationRow>();

  public chartDefintions = signal<IChartMeta[]>([]);
  public activeChartDefinition = signal<IChartMeta | undefined>(undefined);

  public activeChartConfig = signal<Partial<ChartConfiguration> | undefined>(undefined);

  readonly data = input<IClimateStationData['Row'] | null>();

  public chartData = computed<IStationData[]>(() => {
    const data = this.data();
    if (data) {
      return hackConvertStationDataForDisplay(data);
    }
    return [];
  });

  constructor() {
    effect(() => {
      const { country_code } = this.station();
      const definitions = CLIMATE_CHART_DEFINTIONS[country_code] || CLIMATE_CHART_DEFINTIONS.default;
      this.chartDefintions.set(Object.values(definitions));
      this.activeChartDefinition.set(definitions[0]);
    });

    effect(async () => {
      const chartData = this.chartData();
      const activeChartDefinition = this.activeChartDefinition();
      if (activeChartDefinition) {
        const chartConfig = await generateChartConfig(chartData, activeChartDefinition);
        this.activeChartConfig.set(chartConfig);
      }
    });
  }
}
