import { ChangeDetectionStrategy, Component, effect, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';
import { GEO_LOCATION_DATA, IGelocationData, topoJsonToGeoJson } from '@picsa/data/geoLocation';
import { PicsaFormsModule } from '@picsa/forms';
import { PicsaDataTableComponent } from '@picsa/shared/features/data-table/data-table.component';
import { PicsaMapComponent } from '@picsa/shared/features/map/map';
import { geoJSON } from 'leaflet';

import { DeploymentDashboardService } from '../../../deployment/deployment.service';
import {
  CropInformationService,
  ICropData,
  ICropDataDownscaled,
  ICropDataDownscaledWaterRequirements,
} from '../../services';

interface ICropDataDownscaledTableData {
  location: string;
  total_crops: number;
  total_varieties: number;
}

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

@Component({
  selector: 'dashboard-crop-probability',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    PicsaFormsModule,
    PicsaMapComponent,
    PicsaDataTableComponent,
    RouterLink,
  ],
  templateUrl: './probability.component.html',
  styleUrl: './probability.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CropProbabilityComponent {
  private picsaMapComponent = viewChild.required(PicsaMapComponent);

  // public editingMode = signal(false);
  // public countryCode = computed(() => this.deploymentService.activeDeployment()?.country_code || '');

  // public allCropTypes = CROPS_DATA;

  // public cropTypeSelected = signal<string>('');

  public locationSelected = signal<(string | undefined)[]>([]);

  // public cropDownscaledData = signal([]);

  // public editableData = computed(() =>
  //   this.generateEditableData(this.service.cropData(), this.cropDownscaledData(), this.cropTypeSelected())
  // );

  public downscaledTableData = signal<ICropDataDownscaledTableData[]>([]);

  constructor(private service: CropInformationService, private deploymentService: DeploymentDashboardService) {
    this.service.ready();

    effect(async () => {
      const location = this.locationSelected();
      const countryCode = location[2];
      const downscaledCode = location[4];
      if (countryCode && downscaledCode) {
        this.setMapBounds(countryCode, downscaledCode);
        await this.loadLocationCropData(countryCode, downscaledCode);
      }
    });

    effect(async () => {
      const { country_code } = this.deploymentService.activeDeployment();
      if (country_code) {
        const { data, error } = await this.service.cropDataDownscaledTable
          .select<'*', ICropDataDownscaled['Row']>('*')
          .eq('country_code', country_code);
        if (data) {
          const tableData = data.map(({ location_id, water_requirements }) => {
            const waterRequirements = water_requirements as ICropDataDownscaledWaterRequirements;
            let total_crops = 0;
            let total_varieties = 0;
            for (const cropData of Object.values(waterRequirements)) {
              total_crops++;
              total_varieties = total_varieties + Object.keys(cropData).length;
            }
            const entry: ICropDataDownscaledTableData = { location: location_id, total_crops, total_varieties };
            return entry;
          });
          this.downscaledTableData.set(tableData);
        }
      }
    });
  }

  // TODO - map no longer used?
  private async setMapBounds(countryCode: string, downscaledCode: string) {
    // Load admin 4 boundaries and put on map
    const geoData = GEO_LOCATION_DATA[countryCode] as IGelocationData;
    const topoJson = await geoData.admin_4.topoJson();
    const feature = topoJsonToGeoJson(topoJson);

    feature.features = feature.features.filter((v) => v.properties.name === downscaledCode);
    const map = this.picsaMapComponent().map();
    const geoFeature = geoJSON(feature as any);
    geoFeature.setStyle({ fill: false, color: 'brown', opacity: 0.5 }).addTo(map);
    map.fitBounds(geoFeature.getBounds());
  }

  public handleLocationUpdate(location: (string | undefined)[]) {
    this.locationSelected.set(location);
  }

  private async loadLocationCropData(countryCode: string, downscaledCode: string) {
    console.log('loading location crop data', { countryCode, downscaledCode });
  }

  private generateEditableData(cropVarietyData: ICropData['Row'][], downscaledData, cropTypeSelected?: string) {
    if (cropTypeSelected) {
      cropVarietyData = cropVarietyData.filter((v) => v.crop === cropTypeSelected);
    }
    return cropVarietyData.map((data) => ({
      ...data,
      included: false,
    }));
  }
}
