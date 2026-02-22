import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import type { AppRole, Database, FunctionResponses } from '@picsa/server-types';
import { APP_ROLES } from '@picsa/server-utils';
import { formatHeaderDefault, IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features/data-table';
import { PicsaDialogService } from '@picsa/shared/features/dialog';
import { SupabaseService } from '@picsa/shared/services/core/supabase';
import { isEqual } from '@picsa/utils/object.utils';
import { firstValueFrom } from 'rxjs';

import { DashboardMaterialModule } from '../../../../material.module';
import { AdminEditProfileDialogComponent } from '../../../admin/components/edit-profile-dialog/edit-profile-dialog.component';
import { DashboardAuthService } from '../../../auth/services/auth.service';
import { DeploymentDashboardService, IAccessRequest } from '../../deployment.service';

type IAuthUser = FunctionResponses['Dashboard']['admin']['list-users'][number];

interface IUserWithRoles extends IAuthUser {
  roles: AppRole[];
  isMember?: boolean;
}

@Component({
  imports: [DashboardMaterialModule, PicsaDataTableComponent, DatePipe, FormsModule],
  templateUrl: './user-permissions.component.html',
  styleUrl: './user-permissions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeploymentUserPermissionsComponent implements OnInit {
  private dialogService = inject(PicsaDialogService);
  private authService = inject(DashboardAuthService);

  public availableRoles = this.authService.authRoles;
  public currentUserId = this.authService.authUserId;
  public dialog = inject(MatDialog);

  public service = inject(DeploymentDashboardService);
  private supabase = inject(SupabaseService);

  public responseDialog = viewChild<TemplateRef<unknown>>('responseDialog');
  public activeRequest = signal<(IAccessRequest & { email: string }) | null>(null);
  public responseAction = signal<'approved' | 'rejected'>('approved');
  public responseMessage = '';

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

  public pendingRequests = signal<IAccessRequest[]>([], { equal: isEqual });

  public pendingRequestsDetails = computed(() => {
    const reqs = this.pendingRequests();
    const users = this.authUsers();
    return reqs.map((r) => {
      const u = users.find((user) => user.id === r.user_id);
      return {
        ...r,
        email: u ? u.email : 'Unknown User',
      };
    });
  });

  public pendingRequestsTableOptions: IDataTableOptions = {
    displayColumns: ['email', 'created_at', 'actions'],
    formatHeader: (header) => {
      if (header === 'actions') return '';
      if (header === 'created_at') return 'Requested At';
      return formatHeaderDefault(header);
    },
  };

  /** List of users with roles for current deployment */
  public deploymentUsers = computed(() => this.allUsers().filter((u) => u.isMember));

  public matrixTableOptions: IDataTableOptions = {
    displayColumns: [
      'email',
      'admin',
      'climate',
      'resources',
      'crop',
      'monitoring',
      'translations',
      'deployments',
      'actions',
    ],
    formatHeader: (header) => {
      if (header === 'actions') return '';
      if (header === 'admin') return 'Global Admin';
      return formatHeaderDefault(header);
    },
  };

  ngOnInit() {
    this.refreshData();
  }

  private authUsers = signal<IAuthUser[]>([], { equal: isEqual });

  private userRolesHashmap = signal<Map<string, AppRole[]>>(new Map(), { equal: isEqual });

  private get deploymentId() {
    return this.service.activeDeployment().id;
  }

  private refreshData() {
    this.listAuthUsers();
    this.listUserRoles();
    this.listPendingRequests();
  }

  private async listPendingRequests() {
    try {
      const reqs = await this.service.getDeploymentAccessRequests(this.deploymentId);
      this.pendingRequests.set(reqs || []);
    } catch (err) {
      console.error('Failed to load pending requests', err);
    }
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

  public async approveRequest(request: IAccessRequest, responseMessage?: string) {
    try {
      await this.service.updateAccessRequestStatus(request.id, 'approved', responseMessage);
      const entry: Database['public']['Tables']['user_roles']['Insert'] = {
        deployment_id: this.deploymentId,
        user_id: request.user_id,
      };
      await this.supabase.invokeFunction<any>(`dashboard/admin/${this.deploymentId}/add-user`, {
        body: entry,
      });
      this.refreshData();
    } catch (err) {
      console.error('Failed to approve request:', err);
    }
  }

  public async rejectRequest(request: IAccessRequest, responseMessage?: string) {
    try {
      await this.service.updateAccessRequestStatus(request.id, 'rejected', responseMessage);
      this.refreshData();
    } catch (err) {
      console.error('Failed to reject request:', err);
    }
  }

  public openResponseDialog(request: IAccessRequest & { email: string }, action: 'approved' | 'rejected') {
    this.activeRequest.set(request);
    this.responseAction.set(action);
    this.responseMessage = '';

    const template = this.responseDialog();
    if (!template) return;

    const dialogRef = this.dialog.open(template, {
      width: '450px',
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;

      const req = this.activeRequest();
      if (!req) return;

      if (action === 'approved') {
        this.approveRequest(req, this.responseMessage);
      } else {
        this.rejectRequest(req, this.responseMessage);
      }
    });
  }

  public async editProfile(user: IUserWithRoles) {
    const dialogRef = this.dialog.open(AdminEditProfileDialogComponent, {
      data: { userId: user.id },
    });

    const result = await firstValueFrom(dialogRef.afterClosed());
    if (result) {
      this.refreshData();
    }
  }

  public async removeUser(user: IUserWithRoles) {
    const dialogRef = await this.dialogService.open('delete', {
      title: `Are you sure you want to remove ${user.email}?`,
    });

    const confirmed = await firstValueFrom(dialogRef.afterClosed());
    if (!confirmed) return;

    await this.supabase.invokeFunction<any>(`dashboard/admin/${this.deploymentId}/remove-user`, {
      body: { user_id: user.id },
    });
    this.refreshData();
  }

  public isGlobalAdmin(user: IUserWithRoles): boolean {
    return user.roles.includes('admin');
  }

  public isCurrentUser(user: IUserWithRoles): boolean {
    return user.id === this.currentUserId();
  }

  public getPermissionStatus(user: IUserWithRoles, feature: string): 'admin' | 'editor' | null {
    // If Global Admin, they have admin access to everything
    if (this.isGlobalAdmin(user)) {
      return 'admin';
    }

    if (feature === 'admin') {
      return user.roles.includes('admin') ? 'admin' : null;
    }

    const adminRole = `${feature}.admin` as AppRole;
    if (user.roles.includes(adminRole)) return 'admin';

    const editorRole = `${feature}.editor` as AppRole;
    if (user.roles.includes(editorRole)) return 'editor';

    return null;
  }

  public async togglePermission(user: IUserWithRoles, feature: string) {
    // Prevent self-edit
    if (this.isCurrentUser(user)) return;

    // Global Admin changes must be done via menu
    if (feature === 'admin') return;

    // Prevent toggling other permissions if user is Global Admin
    // (Global Admin implies everything is Admin)
    if (this.isGlobalAdmin(user)) return;

    const currentStatus = this.getPermissionStatus(user, feature);
    const availableRoles = this.getAvailableRolesForFeature(feature);

    let nextRole: AppRole | null = null;
    let roleToRemove: AppRole | null = null;

    if (currentStatus === null) {
      // currently no access -> go to first available (usually admin)
      nextRole = availableRoles[0];
    } else if (currentStatus === 'admin') {
      // currently admin -> go to editor if available, else remove
      if (availableRoles.includes(`${feature}.editor` as AppRole)) {
        nextRole = `${feature}.editor` as AppRole;
      }
      // remove admin
      roleToRemove = feature === 'admin' ? 'admin' : (`${feature}.admin` as AppRole);
    } else if (currentStatus === 'editor') {
      // currently editor -> remove
      roleToRemove = `${feature}.editor` as AppRole;
    }

    // Update roles
    let newRoles = [...user.roles];
    if (roleToRemove) {
      newRoles = newRoles.filter((r) => r !== roleToRemove);
    }
    if (nextRole) {
      newRoles.push(nextRole);
    }

    await this.supabase.invokeFunction(`dashboard/admin/${this.deploymentId}/update-user-roles`, {
      body: { user_id: user.id, roles: newRoles },
    });
    this.refreshData();
  }

  public async toggleGlobalAdmin(user: IUserWithRoles) {
    if (this.isCurrentUser(user)) return;

    const isGlobal = this.isGlobalAdmin(user);
    // If adding global admin, we push 'admin'. If removing, we filter 'admin'.
    // Note: The requirement didn't specify wiping other roles when becoming Global Admin,
    // but usually Global Admin supersedes them. I'll keep existing roles to be safe, except 'admin'.

    let newRoles = [...user.roles];

    if (isGlobal) {
      // Revoke Global Admin
      newRoles = newRoles.filter((r) => r !== 'admin');
    } else {
      // Assign Global Admin
      newRoles.push('admin');
    }

    await this.supabase.invokeFunction(`dashboard/admin/${this.deploymentId}/update-user-roles`, {
      body: { user_id: user.id, roles: newRoles },
    });
    this.refreshData();
  }

  private getAvailableRolesForFeature(feature: string): AppRole[] {
    if (feature === 'admin') return ['admin'];
    return APP_ROLES.filter((r) => r.includes(`${feature}.`));
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
}
