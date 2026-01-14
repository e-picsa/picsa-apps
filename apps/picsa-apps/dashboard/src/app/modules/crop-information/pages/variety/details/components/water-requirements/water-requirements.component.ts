/* eslint-disable @nx/enforce-module-boundaries */

import { ChangeDetectionStrategy, Component, computed, input, signal, TemplateRef, viewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { GEO_LOCATION_DATA, IGelocationData } from '@picsa/data/geoLocation';
import { PicsaFormsModule } from '@picsa/forms';
import { IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
import { arrayToHashmap } from '@picsa/utils';

import { DashboardMaterialModule } from '../../../../../../../material.module';
import { DeploymentDashboardService } from '../../../../../../deployment/deployment.service';
import { CropInformationService, ICropDataDownscaled, ICropDataMerged } from '../../../../../services';

interface IWaterRequirementTableData {
  location_id: string;
  water_requirement?: number;
  // full location including country code and admin levels for use in sorting
  location_hash?: string;
}

@Component({
  selector: 'dashboard-crop-water-requirements',
  imports: [DashboardMaterialModule, PicsaDataTableComponent, PicsaFormsModule],
  templateUrl: './water-requirements.component.html',
  styleUrl: './water-requirements.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardCropWaterRequirementsComponent {
  public data = input.required<ICropDataMerged>();

  public tableData = computed(() =>
    this.generateTableData(this.data()).sort((a, b) => (a.location_hash! > b.location_hash! ? 1 : -1)),
  );

  public tableOptions: IDataTableOptions = {
    hideColumns: ['location_id', 'location_hash'],
    paginatorSizes: [10, 25, 50],
  };

  public selectedEntry = signal<IWaterRequirementTableData | undefined>(undefined);

  public countryCode = this.deploymentService.activeDeploymentCountry();

  private dialogTemplate = viewChild.required('inputDialog', { read: TemplateRef });

  constructor(
    public dialog: MatDialog,
    private service: CropInformationService,
    private deploymentService: DeploymentDashboardService,
    private notificationService: PicsaNotificationService,
  ) {}

  public async save(waterRequirementInput: string) {
    const { crop, variety } = this.data();
    const entry = this.selectedEntry();
    if (entry) {
      // merge updated crop water requirement with full downscaled data
      const { location_id } = entry;
      const parentId = `${this.countryCode}/${location_id}`;
      const { data, error } = await this.service.cropDataDownscaledTable
        .select<'*', ICropDataDownscaled['Row']>('*')
        .eq('id', parentId)
        .single();
      if (error) throw error;
      if (data) {
        let { water_requirements } = data;
        water_requirements ??= {};
        water_requirements[crop] ??= {};
        water_requirements[crop][variety] = Number(waterRequirementInput);
        const { error } = await this.service.cropDataDownscaledTable.update({ water_requirements }).eq('id', data.id);
        if (error) {
          throw error;
        }
        this.notificationService.showSuccessNotification(`Water Requirement Updated`);
        await this.service['loadCropData']();
      }
    }
  }

  public editWaterRequirement(entry?: IWaterRequirementTableData) {
    entry ??= { location_id: '', water_requirement: '' as any };
    this.selectedEntry.set(entry);
    const template = this.dialogTemplate();
    this.dialog.open(template);
  }

  public handleFormLocationChange(location: (string | undefined)[]) {
    const location_id = location.pop();
    if (location_id) {
      const existingEntry = this.tableData().find((v) => v.location_id === location_id);
      if (existingEntry) {
        this.selectedEntry.set(existingEntry);
      } else {
        this.selectedEntry.set({ ...this.selectedEntry(), location_id });
      }
    } else {
      this.selectedEntry.set({ location_id: '', water_requirement: '' as any });
    }
  }

  /**
   * Merge db downscaled data with hardcoded geolocation and return
   **/
  private generateTableData(data: ICropDataMerged): IWaterRequirementTableData[] {
    const { downscaled } = data;
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
      return downscaled.map(({ location_id, water_requirement }) => {
        const admin_4_value = admin5Hashmap[location_id].admin_4;
        return {
          [admin_4_label]: admin4Hashmap[admin_4_value]?.label,
          [admin_5_label]: admin5Hashmap[location_id]?.label,
          location_id,
          water_requirement,
          location_hash: `${country_code}/${admin_4_value}/${location_id}`,
        };
      });
    } else {
      // Otherwise just include admin_4 label column
      return downscaled.map(({ location_id, water_requirement }) => {
        return {
          [admin_4_label]: admin4Hashmap[location_id],
          location_id,
          water_requirement: water_requirement,
          location_hash: `${country_code}/${location_id}`,
        };
      });
    }
  }
}
