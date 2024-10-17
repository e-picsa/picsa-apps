import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { PasswordResetComponent } from './pages/password-reset/password-reset.component';
import { UserProfileComponent } from './pages/user-profile/user-profile.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: '',
        component: UserProfileComponent,
      },
      {
        path: 'password-reset',
        component: PasswordResetComponent,
      }
    ]),
  ],
})
export class ProfileModule {}
