import { ChangeDetectionStrategy, Component, effect, OnInit, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';

import { DashboardMaterialModule } from '../../../../material.module';
import { DeploymentDashboardService } from '../../../deployment/deployment.service';
import {
  CropInformationService,
  ICropDataDownscaled,
  ICropInformationInsert,
  ICropInformationRow,
} from '../../services';
import { DashboardCropVarietyFormComponent } from './components/variety-form/variety-form.component';
import { DashboardCropWaterRequirementsComponent } from './components/water-requirements/water-requirements.component';

@Component({
  selector: 'dashboard-crop-variety-details',
  imports: [
    DashboardCropVarietyFormComponent,
    DashboardCropWaterRequirementsComponent,
    DashboardMaterialModule,
    RouterModule,
  ],
  templateUrl: './variety-details.component.html',
  styleUrl: './variety-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CropVarietyDetailsComponent implements OnInit {
  public varietyFormValue = signal<ICropInformationInsert | undefined>(undefined);

  public downscaledData = signal<ICropDataDownscaled['Row'][]>([]);

  constructor(
    private service: CropInformationService,
    private router: Router,
    private route: ActivatedRoute,
    private notificationService: PicsaNotificationService,
    public dialog: MatDialog,
    private deploymentService: DeploymentDashboardService
  ) {
    effect(() => {
      const id = this.varietyFormValue()?.id;
      if (id) {
        this.loadDownscaledData(id);
      }
    });
  }

  async ngOnInit() {
    await this.service.ready();

    const { id } = this.route.snapshot.params;
    // load editable entry from route param unless on /new route
    if (id && id !== 'add') {
      await this.loadEditableEntry(id);
    }
  }

  public async submitForm(value: ICropInformationInsert) {
    if (value.id) {
      await this.service.update(value);
    } else {
      // remove null id when adding crop probability
      const { id, ...data } = value;
      await this.service.insert(data);
    }
    // navigate back after successful addition
    return this.goToVarietyListPage();
  }

  public async handleDelete(id: string) {
    await this.service.cropDataTable.delete().eq('id', id);
    return this.goToVarietyListPage();
  }

  private goToVarietyListPage() {
    this.router.navigate(['../'], { relativeTo: this.route, replaceUrl: true });
  }

  /** Load an existing db record for editing */
  private async loadEditableEntry(id: string) {
    const { data, error } = await this.service.cropDataTable
      .select<'*', ICropInformationRow>('*')
      .eq('id', id)
      .single();
    if (data) {
      this.varietyFormValue.set(data);
    }
    if (error) {
      this.router.navigate(['../'], { relativeTo: this.route, replaceUrl: true });
      throw new Error(error.message);
    }
  }

  // TODO - merge downscaled data totals to display a `water_requirement_entries` or similar counter

  private async loadDownscaledData(crop_id: string) {
    const country_code = this.deploymentService.activeDeployment()?.country_code;
    if (!country_code) return;
    const { data, error } = await this.service.cropDataDownscaledTable
      .select<'*', ICropDataDownscaled['Row']>('*')
      .eq('crop_id', crop_id)
      .eq('country_code', country_code);
    this.downscaledData.set(data || []);
    if (error) {
      this.router.navigate(['../'], { relativeTo: this.route, replaceUrl: true });
      throw error;
    }
  }
}
