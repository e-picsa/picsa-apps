import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormField, MatSelectModule } from '@angular/material/select';
import type { CountryCodeLegacy } from '@picsa/server-types';
import { SupabaseService } from '@picsa/shared/services/core/supabase';

import { IStationRow } from '../../../../../../climate/types';
import { DeploymentDashboardService } from '../../../../../../deployment/deployment.service';
import { ICropDataDownscaled } from '../../../../../services';

@Component({
  selector: 'dashboard-crop-linked-station-select',
  imports: [MatSelectModule, MatFormField, MatButtonModule],
  templateUrl: './linked-station-select.component.html',
  styleUrl: './linked-station-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CropLinkedStationSelectComponent {
  private supabaseService = inject(SupabaseService);
  private deploymentService = inject(DeploymentDashboardService);

  public allStations = signal<IStationRow[]>([]);
  public locationId = input.required<string>();
  public downscaledData = input.required<ICropDataDownscaled['Row']>();

  public stationSelected = output<string | undefined>();

  constructor() {
    effect(async () => {
      const countryCode = this.deploymentService.activeDeploymentCountry();
      const locationId = this.locationId();
      if (countryCode && locationId) {
        await this.loadStations(countryCode, locationId);
      }
    });
  }

  /** Retrieve list of climate stations from db to select from */
  private async loadStations(countryCode: CountryCodeLegacy, locationId: string) {
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
