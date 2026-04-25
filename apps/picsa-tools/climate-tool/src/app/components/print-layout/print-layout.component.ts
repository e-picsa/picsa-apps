import { ChangeDetectionStrategy, Component, computed, inject, input, OnDestroy } from '@angular/core';
import { PicsaTranslateModule } from '@picsa/i18n';

import { ClimateChartService } from '../../services/climate-chart.service';

@Component({
  selector: 'climate-print-layout',
  templateUrl: './print-layout.component.html',
  styleUrls: ['./print-layout.component.scss'],
  imports: [PicsaTranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClimatePrintLayoutComponent implements OnDestroy {
  private chartService = inject(ClimateChartService);

  readonly chartPngBlob = input.required<Blob>();

  // Derive metadata from chart service signals
  readonly stationName = computed(() => this.chartService.station()?.name ?? '');
  readonly chartDefinition = computed(() => this.chartService.chartDefinition()?.definition ?? '');
  readonly chartName = computed(() => this.chartService.chartDefinition()?.name ?? '');

  readonly pngSrc = computed(() => URL.createObjectURL(this.chartPngBlob()));

  ngOnDestroy() {
    // Clean up object URL when component is destroyed
    const url = this.pngSrc();
    if (url) {
      URL.revokeObjectURL(url);
    }
  }
}
