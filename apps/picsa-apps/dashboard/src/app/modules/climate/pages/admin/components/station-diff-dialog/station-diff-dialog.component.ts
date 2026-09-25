import { CommonModule, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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
import type { IStationRow } from '../../../../types';

export interface IStationDiffDialogData {
  station: IStationRow;
  diffSummary: IStationDiffSummary;
  appData: IStationData[];
  dbData: IStationData[];
}

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
export class StationDiffDialogComponent {
  readonly data: IStationDiffDialogData = inject(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<StationDiffDialogComponent>);

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

  public chartConfig = computed<IChartConfig>(() => {
    const product = this.selectedProduct();
    return generateDiffChartConfig(this.data.appData, this.data.dbData, product);
  });

  public selectProduct(productId: string) {
    this.selectedProductId.set(productId);
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
