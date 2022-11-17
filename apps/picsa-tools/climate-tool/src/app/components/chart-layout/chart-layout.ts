import {
  AfterViewInit,
  Component,
  Input,
  OnChanges,
  ViewChild,
} from '@angular/core';
import { IChartMeta } from '@picsa/models';
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
export class ClimateChartLayoutComponent implements OnChanges, AfterViewInit {
  @Input() definition: IChartMeta & IClimateView;
  @ViewChild('picsaChart', { static: false }) picsaChart: PicsaChartComponent;

  constructor(public chartService: ClimateChartService) {}

  ngAfterViewInit() {
    this.chartService.registerChartComponent(this.picsaChart);
  }

  public get y1Values() {
    return this.chartService.stationData.map(
      (v) => v[this.definition.keys[0]] as number
    );
  }

  // use ngOnchanges so that chartMeta can be changed directly from parent and update
  ngOnChanges() {
    console.log('changes');
    // this.chartService.generateChartConfig();
  }
}

/*****************************************************************************
 *   Defaults and Interfaces
 ****************************************************************************/
