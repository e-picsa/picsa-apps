import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { map } from 'rxjs';

import { DashboardMaterialModule } from '../../../../../material.module';
import { CropInformationService, ICropData, ICropDataMerged } from '../../../services';
import { DashboardCropVarietyFormComponent } from './components/variety-form/variety-form.component';
import { DashboardCropWaterRequirementsComponent } from './components/water-requirements/water-requirements.component';

type RouteParams = { id: string };

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
export class CropVarietyDetailsComponent {
  service = inject(CropInformationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  dialog = inject(MatDialog);

  public isNewEntry = signal(false);
  public editMode = signal(false);
  public cropData = signal<ICropDataMerged | undefined>(undefined);

  private cropId = toSignal(this.route.params.pipe(map((v) => (v as RouteParams).id)));

  constructor() {
    this.service.ready();
    effect(() => {
      if (!this.service.readySignal()) return;
      const cropId = this.cropId();
      if (cropId === 'add') {
        this.isNewEntry.set(true);
        this.editMode.set(true);
        return;
      }
      const mergedData = this.service.cropDataMerged();
      if (mergedData) {
        const cropData = mergedData.find((v) => v.id === cropId);
        if (cropData) {
          this.cropData.set(cropData);
          return;
        } else {
          this.router.navigate(['../'], { relativeTo: this.route, replaceUrl: true });
          throw new Error(`No data exists for crop: ${cropId}`);
        }
      }
    });
  }

  public async submitForm(value: ICropData['Insert']) {
    if (value.id) {
      await this.service.update(value);
    } else {
      // remove null id when adding crop probability
      const { id, ...data } = value;
      await this.service.insert([data]);
    }
    // navigate back after successful addition
    return this.goToVarietyListPage();
  }

  public async handleDelete(id: string) {
    await this.service.delete(id);
    return this.goToVarietyListPage();
  }

  private goToVarietyListPage() {
    this.router.navigate(['../'], { relativeTo: this.route, replaceUrl: true });
  }
}
