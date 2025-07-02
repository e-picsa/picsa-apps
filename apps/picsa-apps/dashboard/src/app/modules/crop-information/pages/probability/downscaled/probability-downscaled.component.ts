/* eslint-disable @nx/enforce-module-boundaries */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';

import { ICropSuccessEntry, IStationRow } from '../../../../climate/types';
import { DeploymentDashboardService } from '../../../../deployment/deployment.service';
import { CropInformationService, ICropDataDownscaled, ICropDataDownscaledWaterRequirements } from '../../../services';
import { CropLinkedStationSelectComponent } from './components/linked-station-select/linked-station-select.component';
import { CropProbabilityTableComponent } from './components/probability-table/probability-table.component';

// Type generated when joining downscaled `station_id` with station data lookup
type ICropDataDownscaledWithStation = ICropDataDownscaled['Row'] & {
  station: IStationRow | null;
};

@Component({
  selector: 'dashboard-crop-probability-downscaled',
  imports: [
    CommonModule,
    CropLinkedStationSelectComponent,
    CropProbabilityTableComponent,
    MatIconModule,
    MatButtonModule,
    RouterLink,
  ],
  templateUrl: './probability-downscaled.component.html',
  styleUrl: './probability-downscaled.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProbabilityDownscaledComponent {
  public locationId = toSignal(this.route.params.pipe(map((v) => v.locationId)));
  private countryCode = computed(() => this.deploymentService.activeDeployment()?.country_code);

  public downscaledData = signal<ICropDataDownscaledWithStation | undefined>(undefined);
  public downscaledStationId = computed(() => this.downscaledData()?.station_id);
  public downscaledWaterRequirements = computed(
    () => this.downscaledData()?.water_requirements as ICropDataDownscaledWaterRequirements,
  );
  public downscaledStationProbabilities = signal<ICropSuccessEntry[] | undefined>(undefined);

  public showLinkedStationSelect = signal(false);

  public dataLoading = signal(true);
  public locationMeta = computed(() => {
    const downscaledData = this.downscaledData();
    return this.getLocationData(downscaledData);
  });

  constructor(
    private route: ActivatedRoute,
    private deploymentService: DeploymentDashboardService,
    private service: CropInformationService,
  ) {
    effect(() => {
      const location_id = this.locationId();
      const country_code = this.countryCode();
      if (location_id && country_code) {
        this.loadDownscaledCropInfo({ location_id, country_code });
      }
    });
    effect(() => {
      const stationId = this.downscaledStationId();
      if (stationId) {
        this.loadStationCropProbabilities(stationId);
      }
    });
  }

  public async updateLinkedStation(station_id?: string) {
    if (station_id) {
      const id = this.downscaledData()?.id as string;
      const updateRes = await this.service.cropDataDownscaledTable.update({ station_id }).eq('id', id);
      if (updateRes.error) {
        console.error(updateRes.error);
        throw updateRes.error;
      }
      // refresh data - do not await to allow ui to change over during reprocess
      const location_id = this.locationId();
      const country_code = this.countryCode();
      this.loadDownscaledCropInfo({ location_id, country_code });
    }
    this.showLinkedStationSelect.set(false);
  }

  private async loadDownscaledCropInfo(params: { country_code: string; location_id: string }) {
    const { country_code, location_id } = params;
    this.dataLoading.set(true);
    await this.service.ready();
    const mergedSelect = `*, station:climate_stations!station_id (*)`;
    const { data, error } = await this.service.cropDataDownscaledTable
      .select<'*', ICropDataDownscaledWithStation>(mergedSelect as any)
      .match({ country_code, location_id })
      .single();

    if (error) throw error;
    if (data) {
      this.downscaledData.set(data);
    }
    this.dataLoading.set(false);
  }

  private async loadStationCropProbabilities(station_id: string) {
    const { data, error } = await this.service.stationDataTable.select().eq('station_id', station_id).single();
    // no data error will handled at end
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    if (data && data.crop_probability_data) {
      this.downscaledStationProbabilities.set(data.crop_probability_data as ICropSuccessEntry[]);
      return;
    }
    // set empty array if no data available to still allow dummy table production
    this.downscaledStationProbabilities.set([]);
  }

  /** Lookup downscaled data id and return full geolocation data */
  private getLocationData(downscaledData?: ICropDataDownscaled['Row']) {
    if (downscaledData) {
      const locationData = this.deploymentService.activeDeploymentLocationData();
      const locations = locationData.admin_5?.locations || locationData.admin_4.locations;
      const match = locations.find((v) => v.id === downscaledData.location_id);
      if (match) {
        return match;
      }
    }
    return { id: '', label: '' };
  }
}
