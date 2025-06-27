import { ChangeDetectionStrategy, Component, input, OnDestroy, OnInit } from '@angular/core';
import { PicsaTranslateModule } from '@picsa/shared/modules';

import { ClimateChartService } from '../../services/climate-chart.service';

@Component({
  selector: 'climate-print-layout',
  templateUrl: './print-layout.component.html',
  styleUrls: ['./print-layout.component.scss'],
  imports: [PicsaTranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClimatePrintLayoutComponent implements OnInit, OnDestroy {
  public stationName: string;
  public chartName: string;
  public chartDefinition: string;

  public chartPngBlob = input.required<Blob>();
  public pngSrc: string;

  constructor(public chartService: ClimateChartService) {}

  ngOnInit(): void {
    this.pngSrc = URL.createObjectURL(this.chartPngBlob());

    const { station } = this.chartService;
    if (station) {
      this.stationName = station.name;
      this.chartDefinition = this.chartService.chartDefinition?.definition || '';
      this.chartName = this.chartService.chartDefinition?.name || '';
    }
  }
  ngOnDestroy(): void {
    URL.revokeObjectURL(this.pngSrc);
  }
}
