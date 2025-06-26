/* eslint-disable @nx/enforce-module-boundaries */
import { ChangeDetectionStrategy, Component, effect, signal, TemplateRef, viewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { _wait } from '@picsa/utils';

import { DashboardMaterialModule } from '../../../../material.module';
import { ClimateService, IDataRefreshStatus } from '../../climate.service';
import { IClimateStationData, IStationRow } from '../../types';
import { ChartSummaryComponent } from './components/chart-summary/chart-summary.component';
import { CropProbabilitiesComponent } from './components/crop-probabilities/crop-probabilities.component';
import { DataSummaryComponent } from './components/data-summary/data-summary';
import { LocationSummaryComponent } from './components/location-summary/location-summary/location-summary.component';

@Component({
  selector: 'dashboard-station-details',
  imports: [
    DashboardMaterialModule,
    DataSummaryComponent,
    ChartSummaryComponent,
    CropProbabilitiesComponent,
    LocationSummaryComponent,
  ],
  templateUrl: './station-details.component.html',
  styleUrls: ['./station-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StationDetailsPageComponent {
  public dataFetchUpdates = signal<IDataRefreshStatus[]>([]);

  private updatesDialog = viewChild.required('updateDialog', { read: TemplateRef });

  public stationData = signal<IClimateStationData['Row'] | null>(null);

  private isFirstDataLoad = true;

  constructor(
    public service: ClimateService,
    private dialog: MatDialog,
  ) {
    effect(() => {
      const station = this.service.activeStation();
      if (station) {
        this.loadDBData(station);
      }
    });
  }

  private async loadDBData(station: IStationRow) {
    const { data, error } = await this.service.getStationData(station.id as string);
    if (data) {
      this.stationData.set(data);
    } else {
      // if no data available try to load first time from api
      if (this.isFirstDataLoad) {
        this.isFirstDataLoad = false;
        await this.refreshData(station);
      }
    }
  }

  /**
   * Retrieve updates for all station endpoints from service
   * Subscribe to combined updates and update summary signal on change
   */
  public async refreshData(station: IStationRow) {
    const dialog = this.dialog.open(this.updatesDialog());
    const status$ = this.service.updateStationDataFromApi(station);
    status$.subscribe({
      next: (update) => {
        this.dataFetchUpdates.update((updates) => {
          updates[update.index] = update;
          return [...updates];
        });
      },
      error: (err) => {
        console.error(err);
      },
      complete: async () => {
        // data should now be synced to api
        this.loadDBData(station);
        await _wait(2000);
        dialog.close();
      },
    });
  }
}
