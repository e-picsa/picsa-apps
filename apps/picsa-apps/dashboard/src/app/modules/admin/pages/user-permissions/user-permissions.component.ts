import { ChangeDetectionStrategy, Component, computed, OnInit, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FunctionResponses } from '@picsa/server-types';
import { IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features/data-table';
import { SupabaseService } from '@picsa/shared/services/core/supabase';
// eslint-disable-next-line @nx/enforce-module-boundaries
import type { IAdminListUsersResponse, IUserRoles } from 'apps/picsa-server/supabase/functions/dashboard/types';

import { DashboardMaterialModule } from '../../../../material.module';
import { DeploymentDashboardService } from '../../../deployment/deployment.service';

@Component({
  imports: [DashboardMaterialModule, PicsaDataTableComponent],
  templateUrl: './user-permissions.component.html',
  styleUrl: './user-permissions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUserPermissionsComponent implements OnInit {
  public deploymentUsers = computed(() => {
    const users = this.authUsers();
    const roles = this.userRolesHashmap();
    return users.filter((u) => roles.has(u.id)).map((u) => ({ ...u, roles: roles.get(u.id)?.roles }));
  });

  public authUsers = signal<IAdminListUsersResponse>([]);
  public authUserTableOptions: IDataTableOptions = { displayColumns: ['email'] };

  private userRolesHashmap = signal<Map<string, IUserRoles['Row']>>(new Map());

  constructor(
    public dialog: MatDialog,
    private supabase: SupabaseService,
    private deploymentService: DeploymentDashboardService
  ) {}

  async ngOnInit() {
    await this.supabase.ready();
    await this.deploymentService.ready();
    this.listAuthUsers();
    this.listUserRoles();
  }

  private async listAuthUsers() {
    const { id } = this.deploymentService.activeDeployment();
    const users = await this.supabase.invokeFunction<FunctionResponses['Dashboard']['admin']['list-users']>(
      `dashboard/admin/${id}/list-users`
    );

    this.authUsers.set(users);
  }

  private async listUserRoles() {
    const { id } = this.deploymentService.activeDeployment();
    const userRoles = await this.supabase.invokeFunction<FunctionResponses['Dashboard']['admin']['list-user-roles']>(
      `dashboard/admin/${id}/list-user-roles`
    );
    const map = new Map<string, IUserRoles['Row']>();
    for (const entry of userRoles) {
      map.set(entry.user_id, entry);
    }
    this.userRolesHashmap.set(map);
  }
}
