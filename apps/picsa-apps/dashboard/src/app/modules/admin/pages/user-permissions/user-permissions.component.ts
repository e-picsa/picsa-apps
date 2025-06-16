/* eslint-disable @nx/enforce-module-boundaries */
import { ChangeDetectionStrategy, Component, computed, OnInit, signal, TemplateRef, viewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Database, FunctionResponses } from '@picsa/server-types';
import { formatHeaderDefault, IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features/data-table';
import { SupabaseService } from '@picsa/shared/services/core/supabase';
import { isEqual } from '@picsa/utils/object.utils';

import { DashboardMaterialModule } from '../../../../material.module';
import { DeploymentDashboardService } from '../../../deployment/deployment.service';

type IUserRoles = Database['public']['Tables']['user_roles']['Row']['roles'];
type IAuthUser = FunctionResponses['Dashboard']['admin']['list-users'][number];

interface IUserWithRoles extends IAuthUser {
  roles: IUserRoles;
  isMember?: boolean;
}

@Component({
  imports: [DashboardMaterialModule, PicsaDataTableComponent],
  templateUrl: './user-permissions.component.html',
  styleUrl: './user-permissions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUserPermissionsComponent implements OnInit {
  /** List of all auth users combined with active deployment role */
  public allUsers = computed(() => {
    const users = this.authUsers();
    const allUserRoles = this.userRolesHashmap();
    return users.map((u) => {
      const roles = allUserRoles.get(u.id) || [];
      const userWithRoles: IUserWithRoles = { ...u, roles, isMember: allUserRoles.has(u.id) ? true : false };
      return userWithRoles;
    });
  });

  public allUserTableOptions: IDataTableOptions = {
    displayColumns: ['email', 'isMember'],
    formatHeader: (header) => {
      if (header === 'isMember') return '';
      return formatHeaderDefault(header);
    },
  };

  /** List of users with roles for current deployment */
  public deploymentUsers = computed(() => this.allUsers().filter((u) => u.isMember));

  public deploymentUserTableOptions: IDataTableOptions = { displayColumns: ['email', 'roles'] };

  /** Auth data of user for edit dialog */
  public editableUser = signal<IUserWithRoles | undefined>(undefined);

  private userPermissionsDialog = viewChild.required('userPermissionsDialog', { read: TemplateRef });

  private authUsers = signal<IAuthUser[]>([], { equal: isEqual });

  private userRolesHashmap = signal<Map<string, IUserRoles>>(new Map(), { equal: isEqual });

  private get deploymentId() {
    return this.deploymentService.activeDeployment().id;
  }

  constructor(
    public dialog: MatDialog,
    private supabase: SupabaseService,
    private deploymentService: DeploymentDashboardService,
  ) {}

  async ngOnInit() {
    await this.supabase.ready();
    await this.deploymentService.ready();
    this.refreshData();
  }
  private refreshData() {
    this.listAuthUsers();
    this.listUserRoles();
  }

  public async showUserEditDialog(user: IUserWithRoles) {
    this.editableUser.set(user);
    const dialog = this.dialog.open(this.userPermissionsDialog());
    dialog.afterClosed().subscribe(async (data) => {
      this.editableUser.set(undefined);
    });
  }

  public async addUser(user: IAuthUser) {
    const entry: Database['public']['Tables']['user_roles']['Insert'] = {
      deployment_id: this.deploymentId,
      user_id: user.id,
    };
    await this.supabase.invokeFunction<any>(`dashboard/admin/${this.deploymentId}/add-user`, {
      body: entry,
    });
    this.refreshData();
  }

  public async removeUser(user_id: string) {
    await this.supabase.invokeFunction<any>(`dashboard/admin/${this.deploymentId}/remove-user`, {
      body: { user_id },
    });
    this.refreshData();
  }

  private async listAuthUsers() {
    const users = await this.supabase.invokeFunction<FunctionResponses['Dashboard']['admin']['list-users']>(
      `dashboard/admin/${this.deploymentId}/list-users`,
    );
    this.authUsers.set(users || []);
  }

  private async listUserRoles() {
    const userRoles = await this.supabase.invokeFunction<FunctionResponses['Dashboard']['admin']['list-user-roles']>(
      `dashboard/admin/${this.deploymentId}/list-user-roles`,
    );
    const map = new Map<string, IUserRoles>();
    for (const entry of userRoles || []) {
      map.set(entry.user_id, entry.roles);
    }
    this.userRolesHashmap.set(map);
  }
}
