import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { PicsaTranslateModule } from '@picsa/i18n';

import { ClimateChartService } from '../../services/climate-chart.service';

@Component({
  selector: 'climate-print-layout',
  templateUrl: './print-layout.component.html',
  styleUrls: ['./print-layout.component.scss'],
  imports: [PicsaTranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClimatePrintLayoutComponent {
  private chartService = inject(ClimateChartService);
  private destroyRef = inject(DestroyRef);

  readonly chartPngBlob = input.required<Blob>();

  // Derive metadata from chart service signals
  readonly stationName = computed(() => this.chartService.station()?.name ?? '');
  readonly chartDefinition = computed(() => this.chartService.chartDefinition()?.definition ?? '');
  readonly chartName = computed(() => this.chartService.chartDefinition()?.name ?? '');

  readonly pngSrc = signal<string>('');

  constructor() {
    effect(() => {
      const blob = this.chartPngBlob();
      if (blob) {
        this.setPngSrcBlob(blob);
      }
    });

    this.destroyRef.onDestroy(() => this.revokePngSrc());
  }
  private setPngSrcBlob(blob: Blob) {
    this.revokePngSrc();
    this.pngSrc.set(URL.createObjectURL(blob));
  }
  private revokePngSrc() {
    // Clean up object URL when component is destroyed
    const url = untracked(() => this.pngSrc());
    if (url) {
      URL.revokeObjectURL(url);
    }
  }
}
