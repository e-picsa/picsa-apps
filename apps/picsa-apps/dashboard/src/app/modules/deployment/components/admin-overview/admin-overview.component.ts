import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SupabaseService } from '@picsa/shared/services/core/supabase';

import { DashboardMaterialModule } from '../../../../material.module';
import { DeploymentDashboardService } from '../../deployment.service';

@Component({
  selector: 'dashboard-admin-overview',
  templateUrl: './admin-overview.component.html',
  styleUrl: './admin-overview.component.scss',
  imports: [CommonModule, DashboardMaterialModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeploymentAdminSummaryComponent {
  private supabaseService = inject(SupabaseService);

  private deploymentService = inject(DeploymentDashboardService);

  private readonly pendingRequests = this.supabaseService.db
    .table('deployment_access_requests')
    .liveSignal({ filter: { status: 'pending' } });

  public activeDeploymentPending = computed(() => {
    const deploymentId = this.deploymentService.activeDeploymentId();
    return this.pendingRequests().filter((p) => p.deployment_id === deploymentId);
  });
  public allDeploymentPending = computed(() => {
    const deploymentId = this.deploymentService.activeDeploymentId();
    return this.pendingRequests().filter((p) => p.deployment_id !== deploymentId);
  });
}
