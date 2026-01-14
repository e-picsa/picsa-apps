import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: '',
        redirectTo: '/',
        pathMatch: 'full',
      },
      // TODO - auth guards
      {
        path: 'user-permissions',
        loadComponent: () =>
          import('./pages/user-permissions/user-permissions.component').then((m) => m.AdminUserPermissionsComponent),
      },
      {
        path: 'data-approval',
        loadComponent: () =>
          import('./pages/data-approval/data-approval.component').then((m) => m.DataApprovalComponent),
      },
    ]),
  ],
})
export class AdminModule {}
