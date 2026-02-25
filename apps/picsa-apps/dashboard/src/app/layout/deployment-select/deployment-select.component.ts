import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal, TemplateRef, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { StoragePathPipe } from '@picsa/shared/services/core/supabase';

import { DashboardMaterialModule } from '../../material.module';
import { DeploymentDashboardService } from '../../modules/deployment/deployment.service';
import { IDeploymentRow } from '../../modules/deployment/types';
import { ProfileMenuComponent } from '../../modules/profile/components/profile-menu/profile-menu.component';

@Component({
  selector: 'dashboard-deployment-select-layout',
  templateUrl: 'deployment-select.component.html',
  styleUrl: './deployment-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule,
    DashboardMaterialModule,
    ProfileMenuComponent,
    StoragePathPipe,
    FormsModule,
    NgTemplateOutlet,
  ],
})
export class DeploymentSelectLayoutComponent {
  public service = inject(DeploymentDashboardService);
  private dialog = inject(MatDialog);

  public requestDialog = viewChild<TemplateRef<unknown>>('requestDialog');
  public deploymentLabel = '';
  public message = signal('');

  public availableDeployments = computed(() => {
    const all = this.service.allDeployments();
    const user = this.service.userDeployments();
    const userIds = user.map((d) => d.id);
    return all.filter((d) => !userIds.includes(d.id));
  });

  public onRequestAccess(deployment: IDeploymentRow) {
    this.deploymentLabel = deployment.label;

    const template = this.requestDialog();
    if (!template) return;

    const dialogRef = this.dialog.open(template, {
      width: '450px',
    });

    dialogRef.afterClosed().subscribe((shouldSend?: boolean) => {
      // will not be sent if backdrop or cancel button dismiss
      if (shouldSend) {
        // send request
        this.service.requestAccess(deployment.id, this.message());
        this.message.set('');
      }
    });
  }
}
