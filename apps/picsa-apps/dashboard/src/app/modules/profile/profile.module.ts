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
        loadComponent: () => import('./pages/user-profile/user-profile.component').then((m) => m.UserProfileComponent),
      },
      {
        path: 'password-reset',
        loadComponent: () =>
          import('./pages/password-reset/password-reset.component').then((m) => m.PasswordResetComponent),
      },
    ]),
  ],
})
export class ProfileModule {}
