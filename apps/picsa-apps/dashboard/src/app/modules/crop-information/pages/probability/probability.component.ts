import { ChangeDetectionStrategy, Component, computed, effect, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';
import { CROPS_DATA } from '@picsa/data';
import { PicsaFormsModule } from '@picsa/forms';
import { PicsaDataTableComponent } from '@picsa/shared/features/data-table/data-table.component';

import { DeploymentDashboardService } from '../../../deployment/deployment.service';
import { CropInformationService, ICropData } from '../../services';

/**
 * TODO
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
  imports: [MatButtonModule, MatIconModule, MatSelectModule, PicsaFormsModule, PicsaDataTableComponent, RouterLink],
  templateUrl: './probability.component.html',
  styleUrl: './probability.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CropProbabilityComponent {
  public editingMode = signal(false);
  public countryCode = computed(() => this.deploymentService.activeDeployment()?.country_code || '');

  public allCropTypes = CROPS_DATA;

  public cropTypeSelected = signal<string>('');

  public locationSelected = signal<(string | undefined)[]>([]);

  public cropDownscaledData = signal([]);

  public editableData = computed(() =>
    this.generateEditableData(this.service.cropData(), this.cropDownscaledData(), this.cropTypeSelected())
  );

  constructor(private service: CropInformationService, private deploymentService: DeploymentDashboardService) {
    this.service.ready();

    effect(() => {
      const location = this.locationSelected();
      const countryCode = location[2];
      const downscaledCode = location[4];
      if (countryCode && downscaledCode) {
        this.loadLocationCropData(countryCode, downscaledCode);
      }
    });
    effect(() => {
      console.log('editable data', this.editableData());
    });
    effect(() => {
      // set default crop type selected
      const selected = this.cropTypeSelected();
      if (!selected) {
        this.cropTypeSelected.set('maize');
      }
    });
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
