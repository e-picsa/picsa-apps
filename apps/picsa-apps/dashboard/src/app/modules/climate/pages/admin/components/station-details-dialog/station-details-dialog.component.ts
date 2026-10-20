import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ClimateService } from '../../../../climate.service';
import { extractStationGenerationMetadata } from '../../../../climate.utils';
import type { IClimateStationData, IStationRow } from '../../../../types';
import { ChartSummaryComponent } from '../../../station-details/components/chart-summary/chart-summary.component';
import { CropProbabilitiesComponent } from '../../../station-details/components/crop-probabilities/crop-probabilities.component';
import { DataSummaryComponent } from '../../../station-details/components/data-summary/data-summary';
import { LocationSummaryComponent } from '../../../station-details/components/location-summary/location-summary/location-summary.component';

export interface IStationDetailsDialogData {
  station: IStationRow;
  stationData?: IClimateStationData['Row'] | null;
}

@Component({
  selector: 'dashboard-station-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatProgressBarModule,
    MatTabsModule,
    MatTooltipModule,
    LocationSummaryComponent,
    DataSummaryComponent,
    ChartSummaryComponent,
    CropProbabilitiesComponent,
  ],
  templateUrl: './station-details-dialog.component.html',
  styleUrls: ['./station-details-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StationDetailsDialogComponent implements OnInit {
  public data: IStationDetailsDialogData = inject(MAT_DIALOG_DATA);
  private climateService: ClimateService = inject(ClimateService);

  public stationData = signal<IClimateStationData['Row'] | null>(null);
  public loading = signal<boolean>(true);

  public generationMetadata = computed(() => {
    return extractStationGenerationMetadata(this.stationData());
  });

  public async ngOnInit(): Promise<void> {
    if (this.data?.stationData) {
      this.stationData.set(this.data.stationData);
      this.loading.set(false);
      return;
    }

    const stationId = this.data?.station?.id as string;
    if (stationId) {
      try {
        const { data } = await this.climateService.getStationData(stationId);
        if (data) {
          this.stationData.set(data);
        }
      } catch (err) {
        console.error('Failed to load station data for dialog', err);
      } finally {
        this.loading.set(false);
      }
    } else {
      this.loading.set(false);
    }
  }
}
