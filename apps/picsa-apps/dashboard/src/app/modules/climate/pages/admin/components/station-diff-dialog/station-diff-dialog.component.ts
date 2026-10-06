import { CommonModule, DecimalPipe } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import type { IChartConfig, IStationData } from '@picsa/models';
import { PicsaChartComponent } from '@picsa/shared/features';

import {
  CLIMATE_PRODUCTS,
  IClimateProductDefinition,
  IProductDiffSummary,
  IStationDiffSummary,
} from '../../../../climate-diff.types';
import { generateDiffChartConfig } from '../../../../climate-diff.utils';
import type { IClimateStationData, IStationRow } from '../../../../types';

export interface IStationDiffDialogData {
  station: IStationRow;
  diffSummary: IStationDiffSummary;
  appData: IStationData[];
  dbData: IStationData[];
  stationData?: IClimateStationData['Row'];
}

const PRODUCT_METADATA_MAP: Record<string, keyof IClimateStationData['Row']> = {
  rainfall: 'annual_rainfall_metadata',
  start: 'annual_rainfall_metadata',
  end: 'annual_rainfall_metadata',
  length: 'annual_rainfall_metadata',
  temp_min: 'annual_temperature_metadata',
  temp_max: 'annual_temperature_metadata',
  extremes: 'extremes_metadata',
};

@Component({
  selector: 'dashboard-station-diff-dialog',
  imports: [
    CommonModule,
    DecimalPipe,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatTooltipModule,
    PicsaChartComponent,
  ],
  templateUrl: './station-diff-dialog.component.html',
  styleUrl: './station-diff-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StationDiffDialogComponent implements AfterViewInit {
  private destroyRef = inject(DestroyRef);
  readonly data: IStationDiffDialogData = inject(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<StationDiffDialogComponent>);

  @ViewChild('chartWrapper') chartWrapper?: ElementRef<HTMLDivElement>;
  @ViewChild(PicsaChartComponent) chartComponent?: PicsaChartComponent;

  public products = CLIMATE_PRODUCTS;

  // Select initial product: rainfall by default, or first product that has differences
  public selectedProductId = signal<string>(this.getInitialProductId());

  public selectedProduct = computed<IClimateProductDefinition>(() => {
    const id = this.selectedProductId();
    return this.products.find((p) => p.id === id) || this.products[0];
  });

  public selectedProductSummary = computed<IProductDiffSummary | undefined>(() => {
    const id = this.selectedProductId();
    return this.data.diffSummary?.products?.[id];
  });

  public selectedProductGeneration = computed<{ timestamp?: string; id?: string } | undefined>(() => {
    const stationData = this.data.stationData;
    if (!stationData) return undefined;
    const productId = this.selectedProductId();
    const metaField = PRODUCT_METADATA_MAP[productId] || 'annual_rainfall_metadata';
    const meta = stationData[metaField] as { generation_timestamp?: string; generation_id?: string } | null | undefined;
    const timestamp = meta?.generation_timestamp || stationData.updated_at;
    const id = meta?.generation_id;
    return { timestamp, id };
  });

  public chartConfig = computed<IChartConfig>(() => {
    const product = this.selectedProduct();
    return generateDiffChartConfig(this.data.appData, this.data.dbData, product);
  });

  public ngAfterViewInit() {
    // 1. Ensure chart fills full width once dialog entrance animation completes
    this.dialogRef?.afterOpened?.()?.subscribe(() => {
      this.resizeChart();
    });

    // 2. Delayed resize triggers to ensure full container width is filled
    setTimeout(() => this.resizeChart(), 60);
    setTimeout(() => this.resizeChart(), 250);

    // 3. Observe wrapper container width changes
    if (typeof ResizeObserver !== 'undefined' && this.chartWrapper?.nativeElement) {
      const ro = new ResizeObserver(() => {
        this.resizeChart();
      });
      ro.observe(this.chartWrapper.nativeElement);
      this.destroyRef.onDestroy(() => ro.disconnect());
    }
  }

  public resizeChart() {
    const c3Chart = this.chartComponent?.chart();
    if (c3Chart) {
      c3Chart.resize();
    } else if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('picsaChartRerender'));
    }
  }

  public selectProduct(productId: string) {
    this.selectedProductId.set(productId);
    setTimeout(() => this.resizeChart(), 60);
  }

  public close() {
    this.dialogRef.close();
  }

  private getInitialProductId(): string {
    const productsMap = this.data.diffSummary?.products;
    if (productsMap) {
      for (const p of this.products) {
        const summary = productsMap[p.id];
        if (summary && !summary.isInSync && summary.hasData) {
          return p.id;
        }
      }
    }
    return 'rainfall';
  }
}
