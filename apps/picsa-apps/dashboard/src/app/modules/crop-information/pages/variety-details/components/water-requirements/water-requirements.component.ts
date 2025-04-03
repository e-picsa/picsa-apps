import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { GEO_LOCATION_DATA, IGelocationData } from '@picsa/data/geoLocation';
import { IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features';
import { arrayToHashmap } from '@picsa/utils';
import { DashboardMaterialModule } from 'apps/picsa-apps/dashboard/src/app/material.module';

import { DeploymentDashboardService } from '../../../../../deployment/deployment.service';
import { ICropDataDownscaled } from '../../../../services';

interface IWaterRequirementTableData {
  location_id: string;
  water_requirement: number | null;
}

@Component({
  selector: 'dashboard-crop-water-requirements',
  imports: [CommonModule, DashboardMaterialModule, PicsaDataTableComponent],
  templateUrl: './water-requirements.component.html',
  styleUrl: './water-requirements.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardCropWaterRequirementsComponent {
  data = input.required<ICropDataDownscaled['Row'][]>();

  tableData = computed(() => this.generateTableData(this.data()));

  tableOptions: IDataTableOptions = {
    hideColumns: ['location_id'],
  };

  constructor(public dialog: MatDialog, private deploymentService: DeploymentDashboardService) {}

  /**
   * Merge db downscaled data with hardcoded geolocation and return
   **/
  private generateTableData(data: ICropDataDownscaled['Row'][]): IWaterRequirementTableData[] {
    const country_code = this.deploymentService.activeDeployment()?.country_code;

    if (!country_code) return [];

    const { admin_4, admin_5 } = GEO_LOCATION_DATA[country_code] as IGelocationData;
    const { label: admin_4_label } = admin_4;

    const admin4Hashmap = arrayToHashmap(admin_4.locations, 'id');

    if (admin_5) {
      // If using admin_5 include columns for both admin_4 and admin_5 values

      // re-populate admin 4 and 5 labels from location id
      const admin5Hashmap = arrayToHashmap(admin_5.locations, 'id');
      const { label: admin_5_label } = admin_5;
      return data.map(({ location_id, water_requirement }) => {
        const admin_4_value = admin5Hashmap[location_id].admin_4;
        return {
          [admin_4_label]: admin4Hashmap[admin_4_value]?.label,
          [admin_5_label]: admin5Hashmap[location_id]?.label,
          location_id,
          water_requirement,
        };
      });
    } else {
      // Otherwise just include admin_4 label column
      return data.map(({ location_id: admin_4_value, water_requirement }) => {
        return {
          [admin_4_label]: admin_4_value,
          location_id: admin_4_value,
          water_requirement,
        };
      });
    }
  }
}
