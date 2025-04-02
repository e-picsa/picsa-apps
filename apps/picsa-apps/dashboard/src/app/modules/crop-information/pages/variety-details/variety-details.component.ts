import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';

import { DashboardMaterialModule } from '../../../../material.module';
import { CropInformationService, ICropInformationInsert, ICropInformationRow } from '../../services';
import { DashboardClimateVarietyFormComponent } from './components/variety-form/variety-form.component';

@Component({
  selector: 'dashboard-crop-variety-details',
  imports: [DashboardClimateVarietyFormComponent, DashboardMaterialModule, RouterModule],
  templateUrl: './variety-details.component.html',
  styleUrl: './variety-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CropVarietyDetailsComponent implements OnInit {
  public varietyFormValue = signal<ICropInformationInsert | undefined>(undefined);

  constructor(
    private service: CropInformationService,
    private router: Router,
    private route: ActivatedRoute,
    private notificationService: PicsaNotificationService,
    public dialog: MatDialog
  ) {}

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
    await this.service.table.delete().eq('id', id);
    return this.goToVarietyListPage();
  }

  private goToVarietyListPage() {
    this.router.navigate(['../'], { relativeTo: this.route, replaceUrl: true });
  }

  /** Load an existing db record for editing */
  private async loadEditableEntry(id: string) {
    const { data, error } = await this.service.table.select<'*', ICropInformationRow>('*').eq('id', id).single();
    if (data) {
      this.varietyFormValue.set(data);
    }
    if (error) {
      this.router.navigate(['../'], { relativeTo: this.route, replaceUrl: true });
      throw new Error(error.message);
    }
  }
}
