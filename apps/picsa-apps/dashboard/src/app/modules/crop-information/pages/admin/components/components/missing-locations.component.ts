import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { IGelocationData } from '@picsa/data/geoLocation';
import { arrayToHashmap } from '@picsa/utils';

import { DeploymentDashboardService } from '../../../../../deployment/deployment.service';
import { CropInformationService, ICropDataDownscaled } from '../../../../services';

@Component({
  selector: 'dashboard-crop-missing-locations',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './missing-locations.component.html',
  styleUrl: './missing-locations.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Component that checks all downscaled crop info in database and populates
 * placeholder records for any locations identified from gelocation data
 * that is not present in the database
 */
export class CropMissingLocationsComponent {
  /** Locations without db entry */
  public missingLocations = computed(() => {
    const downscaledData = this.service.downscaledData();
    const locationData = this.deploymentService.activeDeploymentLocationData();

    return this.calcMissingLocationData(downscaledData, locationData);
  });
  /** Locations with db entry but no downcaled data */
  public emptyLocations = computed(() =>
    this.service.downscaledData().filter((v) => Object.keys(v.water_requirements || {}).length === 0),
  );

  /** Text list of locations with missing entries for message display */
  public emptyLocationsList = computed(() =>
    this.emptyLocations()
      .map((v) => v.location_id)
      .join(', '),
  );

  constructor(
    private service: CropInformationService,
    private deploymentService: DeploymentDashboardService,
  ) {}

  public async addPlaceholderLocations(locations: { id: string; label: string }[]) {
    const country_code = this.deploymentService.activeDeploymentCountry();
    const entries: ICropDataDownscaled['Insert'][] = locations.map(({ id }) => ({
      country_code,
      location_id: id,
      water_requirements: {},
    }));
    const { error } = await this.service.cropDataDownscaledTable.upsert(entries);
    if (error) throw error;
    await this.service['loadCropData']();
  }

  /** */
  private calcMissingLocationData(downscaledData: ICropDataDownscaled['Row'][] = [], locationData: IGelocationData) {
    if (downscaledData.length > 0) {
      const locations = locationData.admin_5?.locations || locationData.admin_4?.locations;

      if (locations.length > 0) {
        const downscaledHashmap = arrayToHashmap(downscaledData, 'location_id');
        return locations.filter(({ id }) => !(id in downscaledHashmap));
      }
    }
    return [];
  }
}
