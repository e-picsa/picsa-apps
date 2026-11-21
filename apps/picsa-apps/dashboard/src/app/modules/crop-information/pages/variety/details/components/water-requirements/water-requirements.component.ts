import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { getDownscaledLocation, getGeoLocationData } from '@picsa/data/geoLocation';
import { PicsaFormsModule } from '@picsa/forms';
import { IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';

import { DashboardMaterialModule } from '../../../../../../../material.module';
import { AuthRoleRequiredDirective } from '../../../../../../auth/directives/authRoleRequired.directive';
import { DashboardAuthService } from '../../../../../../auth/services/auth.service';
import { DeploymentDashboardService } from '../../../../../../deployment/deployment.service';
import {
  CropInformationService,
  ICropDataDownscaled,
  ICropDataDownscaledWaterRequirements,
  ICropDataMerged,
} from '../../../../../services';

interface IWaterRequirementTableData {
  location_id: string;
  water_requirement?: number;
  // full location including country code and admin levels for use in sorting
  location_hash?: string;
}

@Component({
  selector: 'dashboard-crop-water-requirements',
  imports: [AuthRoleRequiredDirective, DashboardMaterialModule, PicsaDataTableComponent, PicsaFormsModule],
  templateUrl: './water-requirements.component.html',
  styleUrl: './water-requirements.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardCropWaterRequirementsComponent {
  dialog = inject(MatDialog);
  private service = inject(CropInformationService);
  private deploymentService = inject(DeploymentDashboardService);
  private authService = inject(DashboardAuthService);
  private notificationService = inject(PicsaNotificationService);

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

  public async save(waterRequirementInput: string) {
    const ctx = this.resolveContext();
    if (!ctx) return;
    const value = Number(waterRequirementInput);
    if (String(waterRequirementInput).trim() === '' || Number.isNaN(value)) return;
    const { crop, variety, location_id } = ctx;
    const record = await this.fetchDownscaledRecord(location_id);
    if (record) {
      const water_requirements = (record.water_requirements ?? {}) as ICropDataDownscaledWaterRequirements;
      water_requirements[crop] ??= {};
      water_requirements[crop][variety] = value;
      await this.persistWaterRequirements(record.id, water_requirements, 'Water Requirement Updated');
    } else {
      const water_requirements = { [crop]: { [variety]: value } };
      const country_code = this.countryCode;
      if (!country_code) throw new Error('Country code is not available');
      const { error } = await this.service.cropDataDownscaledTable.insert({
        country_code,
        location_id,
        water_requirements,
      });
      if (error) throw error;
      this.notificationService.showSuccessNotification(`Water Requirement Updated`);
      await this.service['loadCropData']();
    }
  }

  public async remove() {
    const ctx = this.resolveContext();
    if (!ctx) return;
    const { crop, variety, location_id } = ctx;
    const record = await this.fetchDownscaledRecord(location_id);
    const water_requirements = record?.water_requirements as ICropDataDownscaledWaterRequirements | undefined;
    if (!record || !water_requirements?.[crop]?.[variety]) return;
    delete water_requirements[crop][variety];
    if (Object.keys(water_requirements[crop]).length === 0) {
      delete water_requirements[crop];
    }
    await this.persistWaterRequirements(record.id, water_requirements, 'Water Requirement Removed');
  }

  private resolveContext() {
    if (!this.authService.hasRole('crop.editor')) return undefined;
    const location_id = this.selectedEntry()?.location_id;
    if (!location_id) return undefined;
    const { crop, variety } = this.data();
    return { crop, variety, location_id };
  }

  private async fetchDownscaledRecord(location_id: string) {
    const parentId = `${this.countryCode}/${location_id}`;
    const { data, error } = await this.service.cropDataDownscaledTable
      .select<'*', ICropDataDownscaled['Row']>('*')
      .eq('id', parentId)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  private async persistWaterRequirements(
    id: string,
    water_requirements: ICropDataDownscaledWaterRequirements,
    message: string,
  ) {
    const { error } = await this.service.cropDataDownscaledTable.update({ water_requirements }).eq('id', id);
    if (error) throw error;
    this.notificationService.showSuccessNotification(message);
    await this.service['loadCropData']();
  }

  public editWaterRequirement(entry?: IWaterRequirementTableData) {
    if (!this.authService.hasRole('crop.editor')) return;
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
    const { layers } = getGeoLocationData(country_code);
    const parentLayer = layers.length > 1 ? layers[0] : undefined;
    const deepestLayer = layers.at(-1);
    const hasParent = Boolean(parentLayer);
    const parentColLabel = parentLayer?.label ?? '';
    const deepestColLabel = deepestLayer?.label ?? 'Location';

    return downscaled.map(({ location_id, water_requirement }) => {
      const loc = getDownscaledLocation(country_code, location_id);
      if (hasParent) {
        return {
          [parentColLabel]: loc.parentLabel,
          [deepestColLabel]: loc.label,
          location_id,
          water_requirement,
          location_hash: `${country_code}/${loc.parentId}/${location_id}`,
        };
      }
      return {
        [deepestColLabel]: loc.label,
        location_id,
        water_requirement,
        location_hash: `${country_code}/${location_id}`,
      };
    });
  }
}
