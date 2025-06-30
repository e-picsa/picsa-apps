/* eslint-disable @nx/enforce-module-boundaries */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormField, MatSelectModule } from '@angular/material/select';
import { SupabaseService } from '@picsa/shared/services/core/supabase';
import { IStationRow } from 'apps/picsa-apps/dashboard/src/app/modules/climate/types';
import { DeploymentDashboardService } from 'apps/picsa-apps/dashboard/src/app/modules/deployment/deployment.service';

import { ICropDataDownscaled } from '../../../../../services';

@Component({
  selector: 'dashboard-crop-linked-station-select',
  imports: [CommonModule, MatSelectModule, MatFormField, MatButtonModule],
  templateUrl: './linked-station-select.component.html',
  styleUrl: './linked-station-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CropLinkedStationSelectComponent {
  public allStations = signal<IStationRow[]>([]);
  public locationId = input.required<string>();
  public downscaledData = input.required<ICropDataDownscaled['Row']>();

  public stationSelected = output<string | undefined>();

  constructor(
    private supabaseService: SupabaseService,
    private deploymentService: DeploymentDashboardService,
  ) {
    effect(async () => {
      const countryCode = this.deploymentService.activeDeploymentCountry();
      const locationId = this.locationId();
      if (countryCode && locationId) {
        await this.loadStations(countryCode, locationId);
      }
    });
  }

  /** Retrieve list of climate stations from db to select from */
  private async loadStations(countryCode: string, locationId: string) {
    await this.supabaseService.ready();
    const { data, error } = await this.supabaseService.db
      .table('climate_stations')
      .select('*')
      .eq('country_code', countryCode);
    if (error) throw error;
    // TODO - get location center either stored in location data or geojson,
    //        and use to determine closest stations
    this.allStations.set(data);
  }
}
