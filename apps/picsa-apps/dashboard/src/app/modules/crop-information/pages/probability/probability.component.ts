/* eslint-disable @nx/enforce-module-boundaries */
import { ChangeDetectionStrategy, Component, effect, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { GEO_LOCATION_DATA, IGelocationData } from '@picsa/data/geoLocation';
import { PicsaFormsModule } from '@picsa/forms';
import {
  formatHeaderDefault,
  IDataTableOptions,
  PicsaDataTableComponent,
} from '@picsa/shared/features/data-table/data-table.component';
import { PicsaMapComponent } from '@picsa/shared/features/map/map';
import { arrayToHashmap } from '@picsa/utils';

import { DeploymentDashboardService } from '../../../deployment/deployment.service';
import { CropInformationService, ICropDataDownscaled, ICropDataDownscaledWaterRequirements } from '../../services';

interface ICropDataDownscaledTableData {
  // include admin_4 location if location specifies
  admin_4?: string;
  admin_5?: string;
  location: string;
  total_crops: number;
  total_varieties: number;
}
const TABLE_DISPLAY_COLUMNS: (keyof ICropDataDownscaledTableData)[] = ['location', 'total_crops', 'total_varieties'];

@Component({
  selector: 'dashboard-crop-probability',
  imports: [MatButtonModule, MatIconModule, MatSelectModule, PicsaFormsModule, PicsaDataTableComponent],
  templateUrl: './probability.component.html',
  styleUrl: './probability.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CropProbabilityComponent {
  private picsaMapComponent = viewChild.required(PicsaMapComponent);

  public downscaledTableData = signal<ICropDataDownscaledTableData[]>([]);

  public downscaledTableDataOptions = signal<IDataTableOptions>({
    displayColumns: TABLE_DISPLAY_COLUMNS,
    hideColumns: [],
  });

  constructor(
    private service: CropInformationService,
    private deploymentService: DeploymentDashboardService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.service.ready();

    effect(async () => {
      const countryCode = this.deploymentService.activeDeploymentCountry();
      if (countryCode) {
        await this.generateDownscaledTableData(countryCode);
      }
    });
  }

  public goToDownscaled(row: ICropDataDownscaledTableData) {
    const { admin_4, admin_5 } = row;
    const targetLocation = admin_5 || admin_4;
    this.router.navigate([targetLocation], { relativeTo: this.route });
  }

  private async generateDownscaledTableData(country_code: string) {
    const { data, error } = await this.service.cropDataDownscaledTable
      .select<'*', ICropDataDownscaled['Row']>('*')
      .eq('country_code', country_code);
    if (error) throw error;

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
      const merged = this.mergeDetailedLocationData(country_code, tableData);
      this.downscaledTableData.set(merged);
    }
  }

  /** Merge crop location id with lookup geojson data  **/
  private mergeDetailedLocationData(country_code: string, data: ICropDataDownscaledTableData[]) {
    const { admin_4, admin_5 } = GEO_LOCATION_DATA[country_code] as IGelocationData;
    const isAdmin5Location = admin_5 ? true : false;
    const admin4Hashmap = arrayToHashmap(admin_4.locations, 'id');

    // Update table to show admin_4 column if location is admin_5
    if (isAdmin5Location) {
      this.downscaledTableDataOptions.update((opts) => ({
        ...opts,
        displayColumns: ['admin_4'].concat(opts.displayColumns || []),
        formatHeader: (v) => {
          if (v === 'admin_4') return admin_4.label;
          return formatHeaderDefault(v);
        },
      }));
    }

    // merge location label and parent location if required
    const locationHashmap = arrayToHashmap(admin_5?.locations || admin_4.locations, 'id');
    return data.map((entry) => {
      const { location } = entry;
      const locationDetails = locationHashmap[location];
      if (locationDetails) {
        if (isAdmin5Location) {
          entry.admin_5 = location;
          entry.admin_4 = admin4Hashmap[locationDetails['admin_4']].label;
        } else {
          entry.admin_4 = location;
        }
        entry.location = locationDetails.label;
      }
      return entry;
    });
  }
}
