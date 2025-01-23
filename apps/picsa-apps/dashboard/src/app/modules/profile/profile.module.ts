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
    ]),
  ],
})
export class ProfileModule {}
