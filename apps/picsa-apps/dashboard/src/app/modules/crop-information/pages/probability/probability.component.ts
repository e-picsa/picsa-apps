import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { ICountryCode } from '@picsa/data';
import {
  findLocationById,
  formatLocationIdAsLabel,
  getGeoLocationData,
  getLocationSlots,
} from '@picsa/data/geoLocation';
import { PicsaFormsModule } from '@picsa/forms';
import type { CountryCodeLegacy } from '@picsa/server-types';
import {
  formatHeaderDefault,
  IDataTableOptions,
  PicsaDataTableComponent,
} from '@picsa/shared/features/data-table/data-table.component';
import { arrayToHashmap } from '@picsa/utils';

import { DeploymentDashboardService } from '../../../deployment/deployment.service';
import { CropInformationService, ICropDataDownscaledWaterRequirements } from '../../services';

interface ICropDataDownscaledTableData {
  // include parent location label if location specifies a sublocation tier
  admin_4?: string;
  admin_5?: string;
  admin_6?: string;
  location: string;
  location_id: string;
  station: string | null;
  total_crops: number;
  total_varieties: number;
}
const TABLE_DISPLAY_COLUMNS: (keyof ICropDataDownscaledTableData)[] = [
  'location',
  'station',
  'total_crops',
  'total_varieties',
];

@Component({
  selector: 'dashboard-crop-probability',
  imports: [MatButtonModule, MatIconModule, MatSelectModule, PicsaFormsModule, PicsaDataTableComponent],
  templateUrl: './probability.component.html',
  styleUrl: './probability.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CropProbabilityComponent {
  private service = inject(CropInformationService);
  private deploymentService = inject(DeploymentDashboardService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  public downscaledTableData = signal<ICropDataDownscaledTableData[]>([]);

  public downscaledTableDataOptions = signal<IDataTableOptions>({
    displayColumns: TABLE_DISPLAY_COLUMNS,
    hideColumns: [],
  });

  constructor() {
    this.service.ready();

    effect(async () => {
      const countryCode = this.deploymentService.activeDeploymentCountry();
      if (countryCode) {
        const downscaledData = await this.generateDownscaledTableData(countryCode);
        this.downscaledTableData.set(downscaledData);
      }
    });
  }

  public goToDownscaled(row: ICropDataDownscaledTableData) {
    // Always navigate by the raw location id - geo labels (admin_4/admin_5) are only
    // populated when the location exists in the geo lookup, so they can be undefined
    this.router.navigate([row.location_id], { relativeTo: this.route });
  }

  private async generateDownscaledTableData(country_code: CountryCodeLegacy) {
    const { data, error } = await this.service.cropDataDownscaledTable
      .select('*,climate_stations(station_name)')
      .eq('country_code', country_code);
    if (error) throw error;

    if (data) {
      const tableData = data.map(({ location_id, water_requirements, climate_stations }) => {
        const waterRequirements = water_requirements as ICropDataDownscaledWaterRequirements;
        let total_crops = 0;
        let total_varieties = 0;
        for (const cropData of Object.values(waterRequirements)) {
          total_crops++;
          total_varieties = total_varieties + Object.keys(cropData).length;
        }
        const entry: ICropDataDownscaledTableData = {
          location: location_id,
          location_id,
          station: climate_stations?.station_name || null,
          total_crops,
          total_varieties,
        };
        return entry;
      });
      const merged = this.mergeDetailedLocationData(country_code, tableData);
      this.downscaledTableData.set(merged);
      return merged;
    }
    return [];
  }

  /** Merge crop location id with lookup geojson data  **/
  private mergeDetailedLocationData(country_code: string, data: ICropDataDownscaledTableData[]) {
    const locationData = getGeoLocationData(country_code as ICountryCode);
    const slots = getLocationSlots(locationData);
    // top tier is always admin_4 - show as leading column when locations sit in a deeper tier
    const topSlot = slots[0] as 'admin_4';
    const isSublocation = slots.length > 1;

    // Update table to show top-tier column if location is a sublocation
    if (isSublocation) {
      this.downscaledTableDataOptions.update((opts) => ({
        ...opts,
        displayColumns: [topSlot as string].concat(opts.displayColumns || []),
        formatHeader: (v) => {
          if (v === topSlot) return locationData[topSlot].label;
          return formatHeaderDefault(v);
        },
      }));
    }

    // merge location label and parent location if required
    const topLocations = arrayToHashmap(locationData[topSlot].locations, 'id');
    return data.map((entry) => {
      const { location } = entry;
      const found = findLocationById(locationData, location);
      if (found) {
        entry[found.slot] = location;
        if (isSublocation) {
          const parentId = (found.location as Record<string, string | undefined>)[topSlot];
          entry[topSlot] = (parentId && topLocations[parentId]?.label) || formatLocationIdAsLabel(location);
        }
        entry.location = found.location.label;
      } else {
        entry.location = formatLocationIdAsLabel(location);
      }
      return entry;
    });
  }
}
