import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import type { AppRole, Database, FunctionResponses } from '@picsa/server-types';
import { assignImplicitRoles } from '@picsa/server-utils';
import { formatHeaderDefault, IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features/data-table';
import { SupabaseService } from '@picsa/shared/services/core/supabase';
import { isEqual } from '@picsa/utils/object.utils';

import { DashboardMaterialModule } from '../../../../material.module';
import { DashboardAuthService } from '../../../auth/services/auth.service';
import { DeploymentDashboardService } from '../../../deployment/deployment.service';
import { UserRolesDisplayComponent } from './user-roles-display/user-roles-display.component';

type IAuthUser = FunctionResponses['Dashboard']['admin']['list-users'][number];

interface IUserWithRoles extends IAuthUser {
  roles: AppRole[];
  isMember?: boolean;
}

@Component({
  imports: [DashboardMaterialModule, PicsaDataTableComponent, ReactiveFormsModule, UserRolesDisplayComponent],
  templateUrl: './user-permissions.component.html',
  styleUrl: './user-permissions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUserPermissionsComponent {
  dialog = inject(MatDialog);
  private supabase = inject(SupabaseService);
  private deploymentService = inject(DeploymentDashboardService);
  private authService = inject(DashboardAuthService);

  public availableRoles = this.authService.authRoles;

  // Group roles for display in the edit dialog
  public roleGroups = computed(() => {
    const roles = this.availableRoles();
    const groups: { name: string; roles: string[] }[] = [];

    // Global roles
    const globalRoles = roles.filter((r) => !r.includes('.'));
    if (globalRoles.length) groups.push({ name: 'Global', roles: globalRoles });

    // Feature roles
    const featureRoles = roles.filter((r) => r.includes('.'));
    const features = new Set(featureRoles.map((r) => r.split('.')[0]));

    features.forEach((feature) => {
      const featureGroup = featureRoles.filter((r) => r.startsWith(feature + '.'));
      groups.push({ name: this.capitalize(feature), roles: featureGroup });
    });

    return groups;
  });

  public selectedRoles = new FormControl<string[]>([]);

  /** List of all auth users combined with active deployment role */
  public allUsers = computed(() => {
    const users = this.authUsers();
    const allUserRoles = this.userRolesHashmap();
    return users.map((u) => {
      const roles = (allUserRoles.get(u.id) || []) as AppRole[];
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

  public deploymentUserTableOptions: IDataTableOptions = {
    displayColumns: ['email', 'roles'],
  };

  /** Auth data of user for edit dialog */
  public editableUser = signal<IUserWithRoles | undefined>(undefined);

  private userPermissionsDialog = viewChild.required('userPermissionsDialog', { read: TemplateRef });

  private authUsers = signal<IAuthUser[]>([], { equal: isEqual });

  private userRolesHashmap = signal<Map<string, AppRole[]>>(new Map(), { equal: isEqual });

  private get deploymentId() {
    return this.deploymentService.activeDeployment().id;
  }

  constructor() {
    effect(() => {
      const { activeDeployment } = this.deploymentService;
      if (activeDeployment()) {
        this.refreshData();
      }
    });
  }

  private refreshData() {
    this.listAuthUsers();
    this.listUserRoles();
  }

  public async showUserEditDialog(user: IUserWithRoles) {
    this.editableUser.set(user);
    this.selectedRoles.setValue(user.roles || []);
    const dialog = this.dialog.open(this.userPermissionsDialog());
    dialog.afterClosed().subscribe(async (data) => {
      this.editableUser.set(undefined);
    });
  }

  public async saveUserRoles() {
    const user = this.editableUser();
    if (!user) return;
    const roles = this.selectedRoles.value || [];

    const expandedRoles = assignImplicitRoles(roles as AppRole[]);

    await this.supabase.invokeFunction(`dashboard/admin/${this.deploymentId}/update-user-roles`, {
      body: { user_id: user.id, roles: expandedRoles },
    });
    this.refreshData();
    this.dialog.closeAll();
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
    const map = new Map<string, AppRole[]>();
    for (const entry of userRoles || []) {
      map.set(entry.user_id, entry.roles);
    }
    this.userRolesHashmap.set(map);
  }

  private capitalize(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}
