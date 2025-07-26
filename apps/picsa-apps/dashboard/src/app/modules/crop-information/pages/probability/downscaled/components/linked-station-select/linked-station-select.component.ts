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

/*************************************************************
 * TODO - sort legacy code
 *************************************************************/

// effect(async () => {
//   const location = this.locationSelected();
//   const countryCode = location[2];
//   const downscaledCode = location[4];
//   if (countryCode && downscaledCode) {
//     this.setMapBounds(countryCode, downscaledCode);
//     await this.loadLocationCropData(countryCode, downscaledCode);
//   }
// });

// effect(async () => {
//   const location = this.locationSelected();
//   const countryCode = location[2];
//   const downscaledCode = location[4];
//   if (countryCode && downscaledCode) {
//     this.setMapBounds(countryCode, downscaledCode);
//     await this.loadLocationCropData(countryCode, downscaledCode);
//   }
// });

// private async setMapBounds(countryCode: string, downscaledCode: string) {
//   // Load admin 4 boundaries and put on map
//   const geoData = GEO_LOCATION_DATA[countryCode] as IGelocationData;
//   const topoJson = await geoData.admin_4.topoJson();
//   const feature = topoJsonToGeoJson(topoJson);

//   feature.features = feature.features.filter((v) => v.properties.name === downscaledCode);
//   const map = this.picsaMapComponent().map();
//   const geoFeature = geoJSON(feature as any);
//   geoFeature.setStyle({ fill: false, color: 'brown', opacity: 0.5 }).addTo(map);
//   map.fitBounds(geoFeature.getBounds());
// }

/**
   <!-- <p>Select station to use for crop probabilities</p>
  <div class="w-96 h-96">
    <picsa-map style="width: 100%; height: 100%"></picsa-map>
  </div> -->
  <!-- <picsa-form-location-select
    [countryCode]="countryCode()"
    [value]="locationSelected()"
    (valueChanged)="handleLocationUpdate($event)"
  ></picsa-form-location-select> -->
 */
