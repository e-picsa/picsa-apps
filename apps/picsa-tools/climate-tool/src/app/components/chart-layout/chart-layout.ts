import { Component, Input, NgZone, OnChanges, ViewChild } from '@angular/core';
import { IChartMeta, IChartSummary, IChartConfig } from '@picsa/models';
import { PicsaChartComponent } from '@picsa/shared/features/charts/chart';
import { IClimateView } from '../../models';
import { ClimateChartService } from '../../services/climate-chart.service';

/******************************************************************
 * Component to display highly customised charts for climate data
 * Additionally renders line tool alongside (to prevent lots of
 * data passing up and down)
 *****************************************************************/
@Component({
  selector: 'climate-chart-layout',
  templateUrl: 'chart-layout.html',
  styleUrls: ['chart-layout.scss'],
})
export class ClimateChartLayoutComponent implements OnChanges {
  @Input() definition: IChartMeta & IClimateView;
  @Input() data: IChartSummary[];
  @ViewChild('picsaChart', { static: false }) picsaChart: PicsaChartComponent;

  public chartConfig: IChartConfig;

  y1Values: number[];

  constructor(
    private ngZone: NgZone,
    private chartService: ClimateChartService
  ) {}

  public handleLineToolChange(value?: number) {
    this.ngZone.run(() => {
      if (!value) {
        return this.picsaChart.chart.unload({ ids: ['LineTool'] });
      }
      const lineArray = Array(this.data.length).fill(value);
      lineArray.unshift('LineTool');
      this.picsaChart.chart.load({
        columns: [lineArray as any],
        classes: { LineTool: 'LineTool' },
      });
      this.picsaChart.chart.show('LineTool');
    });
  }

  // use ngOnchanges so that chartMeta can be changed directly from parent and update
  ngOnChanges() {
    console.log('climate chart changes', {
      definition: this.definition,
      data: this.data,
    });

    const chartConfig = this.chartService.generateChartConfig(
      this.data,
      this.definition
    );
    console.log('charTConfig', chartConfig);
    this.chartConfig = chartConfig;
    // this.prepareChart();

    this.y1Values = this.data.map((v) => v[this.definition.keys[0]] as number);
  }
}

/*****************************************************************************
 *   Defaults and Interfaces
 ****************************************************************************/
