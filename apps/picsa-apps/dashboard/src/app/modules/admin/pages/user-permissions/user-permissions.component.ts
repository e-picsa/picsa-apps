import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { SupabaseService } from '@picsa/shared/services/core/supabase';

import { DeploymentDashboardService } from '../../../deployment/deployment.service';

@Component({
  imports: [],
  templateUrl: './user-permissions.component.html',
  styleUrl: './user-permissions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUserPermissionsComponent implements OnInit {
  constructor(private supabase: SupabaseService, private deploymentService: DeploymentDashboardService) {}

  async ngOnInit() {
    // TODO - move to service (TBC auth or admin module)
    console.log('user permissions component init');
    await this.supabase.ready();
    await this.deploymentService.ready();
    console.log('list users');
    const { id } = this.deploymentService.activeDeployment();
    const { data, error } = await this.supabase.functions.invoke<any>(`dashboard/admin/${id}/users`, {
      method: 'POST',
      body: {},
    });
    //
    console.log({ data, error });
  }
}
