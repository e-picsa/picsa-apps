import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'dashboard-crop-probability-table',
  imports: [CommonModule],
  templateUrl: './probability-table.component.html',
  styleUrl: './probability-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CropProbabilityTableComponent {}

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

// public cropDownscaledData = signal([]);

// public editableData = computed(() =>
//   this.generateEditableData(this.service.cropData(), this.cropDownscaledData(), this.cropTypeSelected())
// );

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

/**
 * TODO
 * - Child page to manage for specific location
 *
 * - Get map of stations with available probability data. Select
 * - Generate table of all crops
 *
 * (old)
 * - add table to store downscaled data (water requirements, local name, included in table)
 * - retrieve downscaled data and populate crop probability table
 * - add editing view to toggle more crops to include in downscaled
 * - add more metadata to main crop info page (e.g. seed owner, maturity period)
 * - decide how to handle yield potential
 * - add support for editable table data (water requirement)
 * - allow water requirements edit directly from variety page (?)
 * - persist location selected
 * - refactor location select from other tools (e.g. forecast page)
 */
