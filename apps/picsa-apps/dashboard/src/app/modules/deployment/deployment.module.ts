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
        loadComponent: () => import('./pages/list/deployment-list.component').then((m) => m.DeploymentListComponent),
      },
    ]),
  ],
})
export class DeploymentModule {}
